import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const cors = {
  allowHeaders: "authorization, x-client-info, apikey, content-type",
  allowMethods: "GET, POST, OPTIONS",
  allowOrigins: ["https://www.zamarsongs.com", "https://zamarsongs.com", "http://localhost:3000", "https://lovable.dev"],
};

function corsHeaders(origin: string | null) {
  // For development, allow any lovable.dev subdomain or the configured origins
  const isLovableDev = origin?.includes('lovable.dev');
  const isConfiguredOrigin = cors.allowOrigins.includes(origin ?? "");
  const allowOrigin = isLovableDev || isConfiguredOrigin ? origin! : cors.allowOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": cors.allowHeaders,
    "Access-Control-Allow-Methods": cors.allowMethods,
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    const { amountGBP, campaign_id, donor_name, donor_email } = await req.json();

    // Basic validation
    if (!amountGBP || isNaN(amountGBP) || amountGBP < 1) {
      return new Response(JSON.stringify({ error: "Minimum donation is £1" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const APP_BASE_URL = Deno.env.get("APP_BASE_URL");
    if (!STRIPE_SECRET_KEY || !APP_BASE_URL) {
      return new Response(JSON.stringify({ error: "Server not configured (env)" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Lazy import Stripe
    const { default: Stripe } = await import("https://esm.sh/stripe@16.5.0?target=deno");
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    // Build a dynamic price (donations often need flexible amount)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: donor_email || "guest@zamarsongs.com",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Zamar Donation",
              description: campaign_id ? `Campaign: ${campaign_id}` : "General Fund",
            },
            unit_amount: Math.round(Number(amountGBP) * 100), // pence
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_BASE_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/donate`,
      metadata: {
        campaign_id: campaign_id ?? "general",
        donor_name: donor_name ?? "Anonymous",
        donor_email: donor_email ?? "guest@zamarsongs.com",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  } catch (e) {
    // Always return JSON with 4xx/5xx so the client can show a helpful message
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }
});