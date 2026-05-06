// _shared/responses.ts

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export interface SuccessResponse {
  success: true;
  message: string;
  [key: string]: any;
}

export interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: any;
}

export function jsonResponse(data: Record<string, any>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function logIntegrationEvent(supabaseAdmin: any, userId: string, platform: string, eventType: string, payload: any = {}) {
  try {
    await supabaseAdmin.rpc("log_integration_event", {
      p_user_id: userId,
      p_platform: platform,
      p_event_type: eventType,
      p_payload: payload
    });
  } catch (err) {
    console.error(`[Error Logging Event] ${platform} ${eventType}:`, err);
  }
}
