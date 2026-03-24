import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 0. Token Refresh Maintenance
    console.log("Iniciando manutenção de tokens OAuth...");
    try {
      // Find tokens that are expired, expiring in the next 1 hour, OR have no expiry date set (null = unknown)
      const expiryThreshold = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const { data: staleTokens } = await supabaseAdmin
        .from("social_tokens")
        .select("user_id, platform")
        .or(`expires_at.is.null,expires_at.lt.${expiryThreshold}`);

      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      if (staleTokens && staleTokens.length > 0) {
        console.log(`Encontrados ${staleTokens.length} tokens para atualizar.`);
        for (const token of staleTokens) {
          try {
            console.log(`Atualizando token para ${token.platform} (User: ${token.user_id})...`);
            const result = await supabaseAdmin.functions.invoke("refresh-token", {
              body: { platform: token.platform, userId: token.user_id },
              headers: { Authorization: `Bearer ${serviceRoleKey}` },
            });
            if (result.error) {
              console.error(`Erro ao atualizar token ${token.platform} para usuário ${token.user_id}:`, result.error);
            } else {
              console.log(`Token ${token.platform} atualizado com sucesso para usuário ${token.user_id}.`);
            }
          } catch (e) {
            console.error(`Falha ao atualizar token ${token.platform} para usuário ${token.user_id}:`, e);
          }
        }
      } else {
        console.log("Nenhum token expirado ou sem data encontrado.");
      }
    } catch (e) {
      console.error("Erro na rotina de manutenção de tokens:", e);
    }

    // 1. Fetch pending jobs (ready OR stuck in processing for > 5mins)
    const now = new Date();
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60000);

    const { data: rawJobs, error: fetchError } = await supabaseAdmin
      .from("publication_jobs")
      .select("id, status, run_at, locked_at, publication_target_id")
      .or(`status.eq.ready,status.eq.queued,and(status.eq.processing,locked_at.lt.${fiveMinsAgo.toISOString()})`)
      .order("run_at", { ascending: true })
      .limit(50); // Fetch more to filter

    if (fetchError) throw fetchError;

    const jobs = (rawJobs || []).filter((j: any) => {
      // Logic: Only process if run_at is now or past
      return new Date(j.run_at) <= now && j.status !== 'cancelled';
    }).slice(0, 20); // Professional SaaS: Process up to 20 concurrently

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum job na fila para processar." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobIds = jobs.map((j: any) => j.id);
    console.log(`[Scheduler] Iniciando processamento de ${jobIds.length} jobs.`, jobIds);

    // 2. Lock jobs (atomically update to 'processing')
    const { error: lockError } = await supabaseAdmin
      .from("publication_jobs")
      .update({ 
        status: "processing", 
        locked_at: new Date().toISOString()
      })
      .in("id", jobIds);

    if (lockError) {
      console.error("[Scheduler] Falha ao travar jobs:", lockError);
      throw lockError;
    }

    // 3. Invoke publish-video worker for each job concurrently
    const results = await Promise.allSettled(
      jobs.map(async (job) => {
        const correlationId = job.id; // Use Job ID as Correlation ID
        
        await supabaseAdmin.rpc("log_audit_event", {
          p_user_id: null, // Will be resolved by the worker or we could fetch it here
          p_event_type: "publish_started",
          p_publication_id: null, // Resolved in worker
          p_message: `Scheduler iniciando processamento do job ${job.id}`,
          p_correlation_id: correlationId
        });

        const { data, error } = await supabaseAdmin.functions.invoke("publish-video", {
          body: { jobId: job.id, correlationId }, 
        });

        if (error) {
           console.error(`[Scheduler] Erro fatal na invocação do worker (Job: ${job.id}):`, error);
           throw error;
        }
        return data;
      })
    );

    // 4. Handle results and Retries 
    // The worker (publish-video) should handle setting the final status to 'completed' or 'failed'.
    // But if the invocation itself fails (timeout, 5xx), we handle retries here.
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      const jobId = jobIds[i];

      if (res.status === "rejected") {
        const errorMsg = res.reason?.message || "Invocation Timeout or Fatal Error";
        
        // Fetch current job attempt count
        const { data: job } = await supabaseAdmin
          .from("publication_jobs")
          .select("attempt_count")
          .eq("id", jobId)
          .single();
          
        const attempts = (job?.attempt_count || 1);

        // Record attempt
        await supabaseAdmin.from("publication_attempts").insert({
          publication_job_id: jobId,
          attempt_number: attempts,
          error_message: errorMsg,
          http_status: 500
        });

        if (attempts >= 3) {
          // Permanent failure after 3 retries
          await supabaseAdmin.from("publication_jobs").update({
            status: "failed",
            last_error: `Falha permanente após ${attempts} tentativas. Último erro: ${errorMsg}`
          }).eq("id", jobId);
          
          // Also mark corresponding target as error
          const { data: jobTarget } = await supabaseAdmin.from("publication_jobs").select("publication_target_id").eq("id", jobId).single();
          if (jobTarget?.publication_target_id) {
            await supabaseAdmin.from("publication_targets").update({status: "erro", error_message: errorMsg}).eq("id", jobTarget.publication_target_id);
          }
        } else {
          // Transient failure (Queue again for next minute)
          const nextRun = new Date(Date.now() + 60000 * 5); // retry in 5 mins
          await supabaseAdmin.from("publication_jobs").update({
            status: "queued",
            attempt_count: attempts + 1,
            run_at: nextRun.toISOString(),
            last_error: errorMsg,
            locked_at: null
          }).eq("id", jobId);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: jobIds.length, 
        details: results.map(r => r.status) 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Cron Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
