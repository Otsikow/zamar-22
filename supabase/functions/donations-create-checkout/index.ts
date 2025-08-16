// supabase/functions/donations-create-checkout/index.ts
// Deno Deploy / Supabase Edge Function
import Stripe from "https://esm.sh/stripe@14.23.0";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://your-domain.com";

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

interface Body {
  amount?: number;           // in major units, e.g. 25 for £25
  currency?: string;         // 'gbp' (default)
  priceId?: string;          // if you use a pre-created Price in Stripe
  campaign?: string;         // 'General Fund' | 'Translation Fund' | ...
  supporterName?: string;    // optional
  email?: string;            // optional prefill
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "*";

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    console.log("Processing donation request");
    
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Check if Stripe key exists
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY environment variable is not set");
      return new Response(JSON.stringify({ error: "Stripe configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }
    console.log("Stripe key found:", stripeKey ? "Yes" : "No");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-06-20",
    });

    const body = (await req.json()) as Body;
    console.log("Request body:", body);

    // Basic validation
    const currency = (body.currency || "gbp").toLowerCase();
    const campaign = body.campaign || "General Fund";

    if (!body.priceId && !(body.amount && body.amount > 0)) {
      return new Response(JSON.stringify({ error: "Provide priceId or positive amount" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Build line item
    let lineItem:
      | Stripe.Checkout.SessionCreateParams.LineItem
      | Stripe.Checkout.SessionCreateParams.LineItem = {};

    if (body.priceId) {
      lineItem = { price: body.priceId, quantity: 1, adjustable_quantity: { enabled: true } };
    } else {
      lineItem = {
        price_data: {
          currency,
          product_data: {
            name: `Donation — ${campaign}`,
            metadata: { campaign },
          },
          unit_amount: Math.round((body.amount as number) * 100), // to minor units
        },
        quantity: 1,
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      customer_email: body.email,
      line_items: [lineItem],
      metadata: {
        campaign,
        supporter_name: body.supporterName || "",
      },
      // Where Stripe sends the donor back
      success_url: `${SITE_URL}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/donation-cancel`,
      automatic_tax: { enabled: false },
      billing_address_collection: "auto",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  } catch (err) {
    console.error("[donations-create-checkout] Error:", err);
    // Surface a helpful message while preserving 200/4xx semantics
    const msg = (err as any)?.message || "Unexpected error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }
});