import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  try {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: cors });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: cors });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({
        error: "Missing environment variables",
        details: {
          SUPABASE_URL: !!supabaseUrl,
          SUPABASE_ANON_KEY: !!anonKey,
          SUPABASE_SERVICE_ROLE_KEY: !!serviceRoleKey
        }
      }), { status: 500, headers: cors });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), { status: 401, headers: cors });
    }

    // Caller (with their JWT)
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: callerErr?.message }), { status: 401, headers: cors });
    }

    // Admin check from app_metadata.role OR fallback to admin_users table
    const role = (caller.app_metadata as Record<string, any>)?.role;
    let isAdmin = role === "admin";
    
    // If not admin in app_metadata, check admin_users table
    if (!isAdmin) {
      const { data: adminCheck, error: adminCheckErr } = await callerClient
        .from('admin_users')
        .select('role')
        .eq('user_id', caller.id)
        .maybeSingle();
      
      isAdmin = !adminCheckErr && adminCheck?.role === 'admin';
    }
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Access denied. Admin privileges required." }), { status: 403, headers: cors });
    }

    const body = await req.json().catch(() => null) as { userId?: string } | null;
    const targetUserId = body?.userId?.trim();
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "Missing required field 'userId' (Auth user id)" }), { status: 400, headers: cors });
    }

    // Prevent accidental self-delete
    if (targetUserId === caller.id) {
      return new Response(JSON.stringify({ error: "Refused: you cannot delete your own admin account from here." }), { status: 400, headers: cors });
    }

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // (Optional) revoke target user's sessions before deletion
    await adminClient.auth.admin.signOut(targetUserId).catch(() => {});

    // First, soft delete in profiles table
    const { error: profileDeleteErr } = await adminClient
      .from('profiles')
      .update({ 
        account_status: 'deleted',
        deleted_at: new Date().toISOString() 
      })
      .eq('id', targetUserId);

    if (profileDeleteErr) {
      console.error("Profile soft delete error:", profileDeleteErr);
    }

    const { error: delErr } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (delErr) {
      return new Response(JSON.stringify({ error: "Failed to delete user", details: delErr.message }), { status: 500, headers: cors });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal Server Error", details: String(e) }), { status: 500, headers: cors });
  }
});