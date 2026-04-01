import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/responses.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return jsonResponse({ success: true, message: "OK" });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ success: false, message: "Não autorizado" }, 401);

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, authHeader.replace("Bearer ", ""));
    
    const { targetId } = await req.json();
    if (!targetId) return jsonResponse({ success: false, message: "Target ID é obrigatório" }, 400);

    const { data: target, error: targetError } = await supabaseAdmin
      .from("publication_targets")
      .select("*, publications(*)")
      .eq("id", targetId)
      .single();

    if (targetError || !target) {
      return jsonResponse({ success: false, message: "Target não encontrado" }, 404);
    }

    const pub = target.publications;
    if (!pub) {
      return jsonResponse({ success: false, message: "Publicação não encontrada" }, 404);
    }

    const { data: userData } = await supabaseClient.auth.getUser();
    if (!userData.user || userData.user.id !== pub.user_id) {
      return jsonResponse({ success: false, message: "Não autorizado" }, 403);
    }

    if (target.status !== "erro" && target.status !== "failed") {
      return jsonResponse({ success: false, message: `Target não está em estado de erro. Status atual: ${target.status}` }, 400);
    }

    await supabaseAdmin
      .from("publication_targets")
      .update({ 
        status: "queued", 
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", targetId);

    const { data: existingJob } = await supabaseAdmin
      .from("publication_jobs")
      .select("id, status")
      .eq("publication_target_id", targetId)
      .single();

    if (existingJob) {
      if (existingJob.status === "failed") {
        await supabaseAdmin
          .from("publication_jobs")
          .update({
            status: "queued",
            run_at: new Date().toISOString(),
            attempt_count: 0,
            last_error: null,
            locked_at: null
          })
          .eq("id", existingJob.id);
      }
    } else {
      await supabaseAdmin
        .from("publication_jobs")
        .insert({
          publication_target_id: targetId,
          run_at: new Date().toISOString(),
          status: "queued"
        });
    }

    await supabaseAdmin.from("publication_logs").insert({
      publication_target_id: targetId,
      event: "retry_initiated",
      details: `Tentativa de republicação iniciada pelo usuário ${userData.user.id}`
    });

    return jsonResponse({ 
      success: true, 
      message: "Publicação reenviada para a fila com sucesso!",
      targetId
    });

  } catch (err: any) {
    console.error("retry-publish error:", err.message);
    return jsonResponse({ success: false, message: err.message }, 500);
  }
});