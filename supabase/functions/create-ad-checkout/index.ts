import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// GBP pricing in pence for placements and durations
const PRICING_GBP: Record<string, Record<string, number>> = {
  hero: { "7d": 4400, "30d": 9600 },
  player: { "7d": 2800, "30d": 6400 },
  sidebar: { "7d": 2000, "30d": 4800 },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Get current user (requires Authorization header from client)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const { data: userResult, error: userErr } = await supabase.auth.getUser(token);
    if (userErr) console.error("Auth getUser error", userErr);

    const user = userResult?.user;
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { placement, duration } = await req.json();

    if (!placement || !duration) {
      return new Response(JSON.stringify({ error: "Missing placement or duration" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const placementKey = String(placement).toLowerCase();
    const durationKey = String(duration).toLowerCase();

    const amount = PRICING_GBP[placementKey]?.[durationKey];
    if (!amount) {
      return new Response(JSON.stringify({ error: "Invalid placement/duration combination" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeSecret) {
      console.error("Missing STRIPE_SECRET_KEY secret");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    const origin = req.headers.get("origin") ?? "";
    const successUrl = origin ? `${origin}/thank-you` : `https://example.com/thank-you`;
    const cancelUrl = origin ? `${origin}/pricing` : `https://example.com/pricing`;

    const prettyPlacement = placementKey.charAt(0).toUpperCase() + placementKey.slice(1);
    const prettyDuration = durationKey.toUpperCase();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: `Ad Package: ${prettyPlacement} — ${prettyDuration}` },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        placement: placementKey,
        duration: durationKey,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-ad-checkout error", error);
    return new Response(JSON.stringify({ error: (error as Error).message ?? String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
