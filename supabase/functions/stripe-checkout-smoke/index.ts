// Minimal, high-signal Stripe smoke test for Supabase Edge Functions (Deno)
import Stripe from "https://esm.sh/stripe@14.23.0";

function cors(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "*";
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });

  const diagnostics: Record<string, unknown> = { step: "start" };

  try {
    // 1) Check env
    const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.zamarsongs.com";
    const key = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    diagnostics.hasStripeKey = !!key;
    diagnostics.keyPrefix = key.slice(0, 7); // e.g. "sk_test" or "sk_live"

    if (!key) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY is missing", diagnostics }),
        { status: 500, headers: { "content-type": "application/json", ...cors(origin) } }
      );
    }

    // 2) Init Stripe and check API version
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
    diagnostics.step = "stripe_inited";

    // 3) Create a fixed £1 Checkout Session (no request body needed)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: "Zamar Donation (smoke test £1)" },
            unit_amount: 100, // £1 in pence
          },
          quantity: 1,
        },
      ],
      success_url: `${SITE_URL}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/donation-cancel`,
    });

    diagnostics.step = "session_created";

    return new Response(JSON.stringify({ ok: true, url: session.url, diagnostics }), {
      status: 200,
      headers: { "content-type": "application/json", ...cors(origin) },
    });
  } catch (err) {
    diagnostics.step = "error";
    diagnostics.message = (err as any)?.message ?? String(err);
    return new Response(JSON.stringify({ error: diagnostics.message, diagnostics }), {
      status: 500,
      headers: { "content-type": "application/json", ...cors(origin) },
    });
  }
});