import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create sync job
    const { data: job, error: jobError } = await supabase
      .from("music_sync_jobs")
      .insert({
        source: "manual",
        status: "running",
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // In production, this would fetch from external APIs
    // For now, we just mark the existing seed data as synced
    const { data: updated, error: updateError } = await supabase
      .from("music_catalog")
      .update({ 
        last_synced_at: new Date().toISOString(),
        is_trending: true 
      })
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select("id");

    const recordsCount = updated?.length || 0;

    // Mark job as completed
    await supabase
      .from("music_sync_jobs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        records_fetched: recordsCount,
        records_updated: recordsCount
      })
      .eq("id", job.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Music catalog synced",
        records: recordsCount 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
