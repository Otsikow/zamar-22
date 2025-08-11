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
    const url = new URL(req.url);
    const adId = url.searchParams.get("ad_id");
    if (!adId) return new Response("Missing ad_id", { status: 400, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: ad } = await supabase
      .from("ads")
      .select("id, target_url")
      .eq("id", adId)
      .maybeSingle();

    if (!ad || !ad.target_url) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    // Log click and increment via ad-track logic inline
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? null;
    const ua = req.headers.get("user-agent") ?? null;
    const referrer = req.headers.get("referer") ?? null;

    await supabase.from("ad_logs").insert({ ad_id: adId, type: "click", ip, ua, referrer });

    const { data: counts } = await supabase.from("ads").select("clicks").eq("id", adId).maybeSingle();
    const current = (counts?.clicks as number | null) ?? 0;
    await supabase.from("ads").update({ clicks: current + 1 }).eq("id", adId);

    return Response.redirect(ad.target_url, 302);
  } catch (e) {
    console.error("ad-redirect error", e);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
