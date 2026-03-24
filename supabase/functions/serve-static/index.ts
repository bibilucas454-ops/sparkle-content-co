const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIME_TYPES: Record<string, string> = {
  "html": "text/html",
  "js": "application/javascript", 
  "css": "text/css",
  "json": "application/json",
  "png": "image/png",
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "svg": "image/svg+xml",
  "ico": "image/x-icon",
  "txt": "text/plain",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  
  // Get path - split by function name
  const pathParts = req.url.split("/functions/v1/serve-static/");
  let path = pathParts.length > 1 ? pathParts[1] : "";
  
  // URL decode and clean
  if (path) {
    path = decodeURIComponent(path);
  }
  
  // Default to index.html for root
  if (!path || path === "") {
    path = "index.html";
  }

  const fullUrl = `${supabaseUrl}/storage/v1/object/public/site/${path}`;

  const response = await fetch(fullUrl);
    
  if (!response.ok) {
    return new Response(`File not found: ${path}`, { 
      status: 404, 
      headers: { ...corsHeaders, "Content-Type": "text/plain" } 
    });
  }

  const ext = path.split(".").pop()?.toLowerCase() || "html";
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const body = await response.arrayBuffer();

  return new Response(body, {
    headers: {
      ...corsHeaders,
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});
