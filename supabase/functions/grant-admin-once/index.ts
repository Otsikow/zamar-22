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
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Check if any admin exists
    const { count, error: countErr } = await supabaseService
      .from('admin_users')
      .select('*', { count: 'exact', head: true });

    if (countErr) {
      console.error('admin count error', countErr);
      return new Response(JSON.stringify({ error: 'Server error' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ error: 'Already initialized' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Insert current user as admin
    const { error: insertErr } = await supabaseService
      .from('admin_users')
      .insert({ user_id: userRes.user.id, role: 'admin' });

    if (insertErr) {
      console.error('admin insert error', insertErr);
      return new Response(JSON.stringify({ error: 'Failed to grant admin' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
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
