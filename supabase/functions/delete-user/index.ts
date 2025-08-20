import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { 
        status: 405,
        headers: corsHeaders 
      });
    }

    // Client with the caller's JWT (for reading who is calling)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }
    });

    // Read the authenticated user (the caller)
    const { data: { user }, error: getUserErr } = await supabase.auth.getUser();
    if (getUserErr || !user) {
      console.error("Auth error:", getUserErr);
      return new Response("Unauthorized", { 
        status: 401,
        headers: corsHeaders 
      });
    }

    console.log("Authenticated user:", user.id);
    console.log("User app_metadata:", user.app_metadata);

    // ✅ Admin check from app_metadata (no RLS involved)
    const role = (user.app_metadata as Record<string, any>)?.role;
    console.log("User role from app_metadata:", role);
    
    if (role !== "admin") {
      // Fallback: check admin_users table
      const { data: adminCheck, error: adminCheckErr } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      console.log("Admin check from database:", adminCheck, adminCheckErr);
      
      if (adminCheckErr || !adminCheck || adminCheck.role !== 'admin') {
        return new Response("Access denied. Admin privileges required.", { 
          status: 403,
          headers: corsHeaders 
        });
      }
    }

    // Parse payload
    const { userId } = await req.json().catch(() => ({ userId: null }));
    if (!userId) {
      return new Response("Missing userId", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    console.log("Attempting to delete user:", userId);

    // Use a **service-role** client for admin deletion
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // First, soft delete in profiles table
    const { error: profileDeleteErr } = await adminClient
      .from('profiles')
      .update({ 
        account_status: 'deleted',
        deleted_at: new Date().toISOString() 
      })
      .eq('id', userId);

    if (profileDeleteErr) {
      console.error("Profile soft delete error:", profileDeleteErr);
      return new Response(`Failed to soft delete user profile: ${profileDeleteErr.message}`, { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Then, delete the auth user (requires service role)
    const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("Auth delete error:", delErr);
      return new Response(`Failed to delete user: ${delErr.message}`, { 
        status: 500,
        headers: corsHeaders 
      });
    }

    console.log("User successfully deleted:", userId);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      }
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response("Internal Server Error", { 
      status: 500,
      headers: corsHeaders 
    });
  }
});