import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, adId, placement } = await req.json();
    if (!adId || !type) {
      return new Response(JSON.stringify({ error: "Missing adId or type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? null;
    const ua = req.headers.get("user-agent") ?? null;
    const referrer = req.headers.get("referer") ?? null;

    // Dedup window 30 minutes
    const windowMs = 30 * 60 * 1000;
    let skip = false;
    if (ip && ua) {
      const { data: existing } = await supabase
        .from("ad_logs")
        .select("id, created_at")
        .eq("ad_id", adId)
        .eq("type", type)
        .eq("ip", ip)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing && Date.now() - new Date(existing.created_at).getTime() < windowMs) {
        skip = true;
      }
    }

    if (!skip) {
      await supabase.from("ad_logs").insert({ ad_id: adId, placement, type, ip, ua, referrer });

      const col = type === "click" ? "clicks" : "impressions";
      const { data: adRow } = await supabase.from("advertisements").select("impressions, clicks").eq("id", adId).maybeSingle();
      const current = (adRow?.[col as "impressions" | "clicks"] as number | null) ?? 0;
      await supabase.from("advertisements").update({ [col]: current + 1 } as any).eq("id", adId);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ad-track error", e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
