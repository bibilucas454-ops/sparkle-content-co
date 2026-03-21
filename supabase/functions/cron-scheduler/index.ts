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
      // Find tokens that are expired, expiring in the next 24 hours, OR have no expiry date set (null = unknown)
      const expiryThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
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

    // 1. Fetch pending jobs
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from("publication_jobs")
      .select("id")
      .eq("status", "queued")
      .lte("run_at", new Date().toISOString())
      .order("run_at", { ascending: true })
      .limit(5);

    if (fetchError) throw fetchError;

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum job na fila para processar." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobIds = jobs.map((j) => j.id);
    console.log(`Encontrados ${jobIds.length} jobs para processar. IDs:`, jobIds);

    // 2. Lock jobs (atomically update to 'processing')
    const { error: lockError } = await supabaseAdmin
      .from("publication_jobs")
      .update({ 
        status: "processing", 
        locked_at: new Date().toISOString()
      })
      .in("id", jobIds);

    if (lockError) {
      console.error("Falha ao travar jobs:", lockError);
      throw lockError;
    }

    // 3. Invoke publish-video worker for each job concurrently
    // We pass the JWT token to bypass or use service_role. The worker uses Admin naturally.
    const results = await Promise.allSettled(
      jobIds.map(async (jobId) => {
        const { data, error } = await supabaseAdmin.functions.invoke("publish-video", {
          body: { jobId }, // New signature: worker will take jobId and handle the rest
        });

        if (error) {
           console.error(`Erro ao invocar publish-video para jobId ${jobId}:`, error);
           throw error;
        }
        if (data?.error) {
           console.error(`publish-video reportou erro para jobId ${jobId}:`, data.error);
           throw new Error(data.error);
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
            await supabaseAdmin.from("publication_targets").update({status: "erro", error_message: "Falha final de agendamento"}).eq("id", jobTarget.publication_target_id);
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
