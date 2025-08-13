import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const supabaseAuth = createClient(supabaseUrl, anonKey);
  const supabaseService = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);

    if (userErr || !userRes?.user) {
      // Log failed attempt
      await logAdminAttempt(supabaseService, null, false, req);
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Use atomic transaction to prevent race conditions
    const { data: result, error: transactionError } = await supabaseService.rpc('atomic_grant_first_admin', {
      candidate_user_id: userRes.user.id
    });

    // Log the attempt
    await logAdminAttempt(supabaseService, userRes.user.id, !transactionError && result?.success, req);

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return new Response(JSON.stringify({ error: 'Server error' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!result?.success) {
      return new Response(JSON.stringify({ error: result?.error || 'Already initialized' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error('grant-admin-once error', e);
    return new Response(JSON.stringify({ error: (e as Error).message ?? String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Helper function to log admin creation attempts
async function logAdminAttempt(supabase: any, userId: string | null, success: boolean, req: Request) {
  try {
    const userAgent = req.headers.get("User-Agent") || "Unknown";
    const forwarded = req.headers.get("X-Forwarded-For");
    const realIp = req.headers.get("X-Real-IP");
    const cfIp = req.headers.get("CF-Connecting-IP");
    
    // Extract single IP address safely
    let ipAddress = forwarded || realIp || cfIp || "127.0.0.1";
    if (ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
    }

    await supabase.from('admin_creation_attempts').insert({
      attempted_by: userId,
      success,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  } catch (error) {
    console.error('Failed to log admin attempt:', error);
  }
}
