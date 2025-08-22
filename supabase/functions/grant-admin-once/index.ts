import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    if (!token) {
      console.log("Missing Bearer token");
      return new Response(JSON.stringify({ error: "Missing Bearer token" }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 1) Get caller user with their auth context
    const userClient = createClient(supabaseUrl, anonKey, { 
      global: { headers: { Authorization: authHeader } } 
    });
    
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      console.log("Invalid user token:", userErr);
      await logAdminAttempt(serviceKey, supabaseUrl, null, false, req);
      return new Response(JSON.stringify({ error: "Invalid user token" }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const callerId = userData.user.id;
    console.log("Grant admin attempt by user:", callerId);

    // 2) Check if any admin already exists (atomic check)
    const serviceClient = createClient(supabaseUrl, serviceKey);
    
    const { data: existingAdmins, error: countError } = await serviceClient
      .from("admin_users")
      .select("id")
      .limit(1);
    
    if (countError) {
      console.error("Error checking existing admins:", countError);
      await logAdminAttempt(serviceKey, supabaseUrl, callerId, false, req);
      return new Response(JSON.stringify({ error: "Server error" }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3) If admins exist, deny the request
    if (existingAdmins && existingAdmins.length > 0) {
      console.log("Admin already exists, denying request");
      await logAdminAttempt(serviceKey, supabaseUrl, callerId, false, req);
      return new Response(JSON.stringify({ error: "Admin already exists" }), { 
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4) Grant admin privileges - first user becomes admin
    const { error: insertError } = await serviceClient
      .from("admin_users")
      .insert({
        user_id: callerId,
        role: "admin"
      });

    if (insertError) {
      console.error("Failed to insert admin user:", insertError);
      await logAdminAttempt(serviceKey, supabaseUrl, callerId, false, req);
      return new Response(JSON.stringify({ error: "Failed to grant admin privileges" }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 5) Update auth metadata (optional but recommended)
    const { error: authError } = await serviceClient.auth.admin.updateUserById(callerId, {
      app_metadata: { role: "admin" },
    });

    if (authError) {
      console.warn("Updated admin_users but failed to update app_metadata:", authError);
    }

    console.log("Successfully granted admin privileges to user:", callerId);
    await logAdminAttempt(serviceKey, supabaseUrl, callerId, true, req);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unhandled error in grant-admin-once:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper function to log admin creation attempts
async function logAdminAttempt(
  serviceKey: string, 
  supabaseUrl: string, 
  userId: string | null, 
  success: boolean, 
  req: Request
) {
  try {
    const serviceClient = createClient(supabaseUrl, serviceKey);
    
    const userAgent = req.headers.get("User-Agent") || "Unknown";
    const forwarded = req.headers.get("X-Forwarded-For");
    const realIp = req.headers.get("X-Real-IP");
    const cfIp = req.headers.get("CF-Connecting-IP");
    
    // Extract single IP address safely
    let ipAddress = forwarded || realIp || cfIp || "127.0.0.1";
    if (ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
    }

    await serviceClient.from('admin_creation_attempts').insert({
      attempted_by: userId,
      success,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  } catch (error) {
    console.error('Failed to log admin attempt:', error);
  }
}