import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.24.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, currency = "gbp", campaign = "General Fund", customer_email, success_url, cancel_url } = await req.json();

    if (!amount || Number.isNaN(Number(amount))) {
      return new Response(JSON.stringify({ error: "Amount is required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: "Stripe secret missing" }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

    const unit_amount = Math.round(Number(amount) * 100); // £ → pence

    const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.zamarsongs.com";
    const successUrl = success_url ?? `${siteUrl}/donations/thanks?ok=1`;
    const cancelUrl = cancel_url ?? `${siteUrl}/donations/cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer_email || undefined,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount,
            product_data: { name: `Donation – ${campaign}` },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ["card"],
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});