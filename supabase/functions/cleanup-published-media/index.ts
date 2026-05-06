// Limpeza one-off: remove arquivos do Storage e registros uploads/post_media
// para uploads ligados APENAS a publicações já publicadas (mantém agendados/pendentes).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PUBLISHED = ["published", "publicado", "success", "sucesso"];
const IN_USE = [
  "pendente", "scheduled", "agendado", "queued",
  "processing", "processando", "enviando", "rascunho", "draft",
];
const BUCKETS = ["videos", "creator-media", "thumbnails", "post-audio"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dryRun === true;

  // 1) IDs de uploads publicados
  const { data: pubRows, error: e1 } = await supabase
    .from("post_media")
    .select("upload_id, publication_targets:publication_id(publication_targets(status))")
    .limit(100000);

  // Simpler: fetch via two queries
  const { data: targets, error: et } = await supabase
    .from("publication_targets")
    .select("publication_id, status")
    .in("status", PUBLISHED);
  if (et) return json({ error: et.message }, 500);

  const publishedPubIds = new Set((targets ?? []).map((t: any) => t.publication_id));

  const { data: inUseTargets } = await supabase
    .from("publication_targets")
    .select("publication_id")
    .in("status", IN_USE);
  const inUsePubIds = new Set((inUseTargets ?? []).map((t: any) => t.publication_id));

  const { data: pubsExtra } = await supabase
    .from("publications")
    .select("id, overall_status, scheduled_for, deleted_at");
  const nowIso = new Date().toISOString();
  for (const p of pubsExtra ?? []) {
    if (p.deleted_at) continue;
    if (
      (p.scheduled_for && p.scheduled_for > nowIso) ||
      IN_USE.includes(p.overall_status)
    ) inUsePubIds.add(p.id);
  }

  const { data: allPm } = await supabase
    .from("post_media")
    .select("upload_id, publication_id")
    .limit(100000);

  const publishedUploads = new Set<string>();
  const inUseUploads = new Set<string>();
  for (const pm of allPm ?? []) {
    if (publishedPubIds.has(pm.publication_id)) publishedUploads.add(pm.upload_id);
    if (inUsePubIds.has(pm.publication_id)) inUseUploads.add(pm.upload_id);
  }
  const toDelete = [...publishedUploads].filter((id) => !inUseUploads.has(id));

  // 2) Buscar file_paths
  const { data: uploads, error: eu } = await supabase
    .from("uploads")
    .select("id, file_path, thumbnail_path, mime_type, size_bytes")
    .in("id", toDelete);
  if (eu) return json({ error: eu.message }, 500);

  let totalBytes = 0;
  for (const u of uploads ?? []) totalBytes += Number(u.size_bytes ?? 0);

  if (dryRun) {
    return json({
      dryRun: true,
      candidatos: uploads?.length ?? 0,
      tamanho_total_mb: +(totalBytes / 1048576).toFixed(2),
    });
  }

  // 3) Apagar do Storage (tenta cada bucket — silencia not-found)
  const storageResults: Record<string, { tentados: number; ok: number; erros: number }> = {};
  for (const bucket of BUCKETS) {
    const paths: string[] = [];
    for (const u of uploads ?? []) {
      if (u.file_path) paths.push(u.file_path);
      if (u.thumbnail_path) paths.push(u.thumbnail_path);
    }
    if (!paths.length) continue;
    let ok = 0, erros = 0;
    // Em lotes de 100
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100);
      const { data, error } = await supabase.storage.from(bucket).remove(chunk);
      if (error) { erros += chunk.length; continue; }
      ok += data?.length ?? 0;
    }
    storageResults[bucket] = { tentados: paths.length, ok, erros };
  }

  // 4) Apagar post_media + uploads
  const { error: epm } = await supabase
    .from("post_media")
    .delete()
    .in("upload_id", toDelete);
  if (epm) return json({ error: "post_media: " + epm.message, storageResults }, 500);

  const { error: edu } = await supabase
    .from("uploads")
    .delete()
    .in("id", toDelete);
  if (edu) return json({ error: "uploads: " + edu.message, storageResults }, 500);

  return json({
    sucesso: true,
    arquivos_excluidos: uploads?.length ?? 0,
    tamanho_liberado_mb: +(totalBytes / 1048576).toFixed(2),
    storage: storageResults,
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
