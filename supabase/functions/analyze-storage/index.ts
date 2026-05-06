import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKETS = ["videos", "creator-media", "thumbnails", "post-audio"];

async function listAllFiles(supabase: any, bucket: string): Promise<{ name: string; id: string; size: number; metadata: any }[]> {
  const files: any[] = [];
  let page: string | null = null;
  
  do {
    const options: any = { limit: 1000 };
    if (page) options.cursors = { starting_after: page };
    
    const { data, error } = await supabase.storage.from(bucket).list("", options);
    if (error) {
      console.error(`Erro ao listar ${bucket}:`, error.message);
      break;
    }
    
    if (data && data.length > 0) {
      for (const file of data) {
        files.push({
          name: file.name,
          id: file.id,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          last_modified: file.metadata?.last_modified,
        });
      }
      page = data[data.length - 1]?.name;
    } else {
      page = null;
    }
  } while (page);
  
  return files;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // 1. Validação de Segurança - Obrigatório Bearer token
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.error("[Analyze Storage] Acesso não autorizado - Token ausente.");
    return json({ error: "Não autorizado. Bearer token obrigatório." }, 401);
  }

  const bearerToken = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Aceita service_role key OU JWT válido de usuário
  const isServiceRole = bearerToken === serviceRoleKey;

  let authenticatedUserId: string | undefined;
  if (isServiceRole) {
    console.log("[Analyze Storage] Chamada via service_role - acesso administrativo.");
  } else {
    // Usuário normal - extrai userId do JWT
    try {
      const payload = JSON.parse(atob(bearerToken.split('.')[1]));
      authenticatedUserId = payload.sub;
    } catch (e) {
      return json({ error: "Token JWT inválido" }, 401);
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
  );

  const body = await req.json().catch(() => ({}));
  const { dryRun = true } = body;

  console.log("=== INÍCIO DA ANÁLISE DE STORAGE ===");

  // Determina se é visualização administrativa ou do usuário
  const isAdminView = isServiceRole || !authenticatedUserId;
  console.log(`[Analyze Storage] Modo: ${isAdminView ? 'ADMINISTRATIVO' : 'USUÁRIO: ' + authenticatedUserId}`);

  const analysis: any = {
    buckets: {},
    orphan_analysis: {
      bucket_files_without_db_ref: [],
      db_refs_without_bucket_file: [],
    },
    summary: {
      total_storage_bytes: 0,
      total_files: 0,
      orphan_files_count: 0,
      invalid_refs_count: 0,
    },
  };

  // 1) Buscar referências no banco - FILTRADO POR USUÁRIO
  let query = supabase
    .from("uploads")
    .select("id, file_path, thumbnail_path, file_name, size_bytes, user_id, created_at");
  
  // Se não for admin, filtra apenas pelos uploads do usuário
  if (!isAdminView && authenticatedUserId) {
    query = query.eq("user_id", authenticatedUserId);
  }
  
  const { data: allUploads, error: uError } = await query;
  
  if (uError) {
    return json({ error: "Erro ao buscar uploads: " + uError.message }, 500);
  }

  const dbFilePaths = new Set<string>();
  const dbThumbPaths = new Set<string>();
  const dbFilesMap: Map<string, any> = new Map();

  for (const u of allUploads || []) {
    if (u.file_path) {
      dbFilePaths.add(u.file_path);
      dbFilesMap.set(u.file_path, { ...u, type: "file" });
    }
    if (u.thumbnail_path) {
      dbThumbPaths.add(u.thumbnail_path);
      dbFilesMap.set(u.thumbnail_path, { ...u, type: "thumbnail" });
    }
  }

  console.log(`Referências no banco: ${dbFilePaths.size} files + ${dbThumbPaths.size} thumbnails`);

  // 2) Listar arquivos em cada bucket - APENAS para admins
  for (const bucket of BUCKETS) {
    console.log(`\nAnalisando bucket: ${bucket}`);
    
    // Se não for admin, mostra apenas resumo (não lista arquivos individuais)
    if (!isAdminView) {
      // Usuário normal: mostra só total, não arquivos individuais por segurança
      const { data: files } = await supabase.storage.from(bucket).list("", { limit: 1000, offset: 0 });
      const bucketSize = files?.reduce((sum, f) => sum + (f.metadata?.size || 0), 0) || 0;
      
      analysis.buckets[bucket] = {
        files_count: files?.length || 0,
        total_size_bytes: bucketSize,
        note: "Resumo apenas - use service_role para análise completa",
      };
      analysis.summary.total_storage_bytes += bucketSize;
      analysis.summary.total_files += files?.length || 0;
      continue;
    }
    
    const files = await listAllFiles(supabase, bucket);
    
    let bucketSize = 0;
    const bucketFiles: any[] = [];
    const bucketFileNames = new Set<string>();

    for (const f of files) {
      const fullPath = `${bucket}/${f.name}`;
      bucketSize += f.size;
      bucketFileNames.add(fullPath);
      
      bucketFiles.push({
        path: fullPath,
        name: f.name,
        size: f.size,
        created_at: f.created_at,
      });
    }

    analysis.buckets[bucket] = {
      files_count: files.length,
      total_size_bytes: bucketSize,
      files: bucketFiles,
    };

    analysis.summary.total_storage_bytes += bucketSize;
    analysis.summary.total_files += files.length;

    // 3) Identificar órfãos (arquivo no storage sem referência no banco)
    for (const f of files) {
      const fullPath = `${bucket}/${f.name}`;
      if (!dbFilePaths.has(fullPath) && !dbThumbPaths.has(fullPath)) {
        analysis.orphan_analysis.bucket_files_without_db_ref.push({
          bucket,
          path: fullPath,
          size: f.size,
          created_at: f.created_at,
          type: f.name.includes("thumb") ? "thumbnail" : "file",
          reason: "Não existe referência na tabela uploads",
        });
        analysis.summary.orphan_files_count++;
      }
    }
  }

  // 4) Verificar referências inválidas (DB aponta para arquivo que não existe no Storage)
  for (const filePath of dbFilePaths) {
    const [bucket, ...rest] = filePath.split("/");
    const fileName = rest.join("/");
    
    if (!BUCKETS.includes(bucket)) continue;
    
    const { data: exists } = await supabase.storage
      .from(bucket)
      .list("", { limit: 1 });

    // Simples check - tenta baixar para ver se existe
    try {
      await supabase.storage.from(bucket).download(fileName);
    } catch (e: any) {
      if (e.message?.includes("not found") || e.message?.includes("404")) {
        const dbRec = dbFilesMap.get(filePath);
        analysis.orphan_analysis.db_refs_without_bucket_file.push({
          path: filePath,
          db_record: dbRec,
          reason: "Arquivo não existe no Storage",
        });
        analysis.summary.invalid_refs_count++;
      }
    }
  }

  console.log("\n=== FIM DA ANÁLISE ===");
  console.log(`Total Storage: ${analysis.summary.total_storage_bytes / 1024 / 1024} MB`);
  console.log(`Total Arquivos: ${analysis.summary.total_files}`);
  console.log(`Órfãos (Storage sem DB): ${analysis.summary.orphan_files_count}`);
  console.log(`Inválidos (DB sem Storage): ${analysis.summary.invalid_refs_count}`);

  if (dryRun) {
    return json({ analysis, dryRun: true });
  }

  return json({ analysis, dryRun: false });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  }));
}