import Stripe from "npm:stripe@14.23.0";

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

  const out: Record<string, unknown> = { ok: false, step: "start" };

  try {
    const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.zamarsongs.com";
    const key = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    out.hasStripeKey = !!key;
    out.keyPrefix = key.slice(0, 7); // "sk_test" or "sk_live"

    if (!key) throw new Error("STRIPE_SECRET_KEY is missing in Supabase Function Secrets");

    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
    out.step = "stripe_inited";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: { currency: "gbp", product_data: { name: "Zamar Donation (smoke £1)" }, unit_amount: 100 },
        quantity: 1
      }],
      success_url: `${SITE_URL}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/donation-cancel`,
    });

    out.step = "session_created";
    out.ok = true;
    out.url = session.url;
    return new Response(JSON.stringify(out), { status: 200, headers: { "content-type": "application/json", ...cors(origin) } });
  } catch (err) {
    out.step = "error";
    out.error = (err as any)?.message ?? String(err);
    return new Response(JSON.stringify(out), { status: 200, headers: { "content-type": "application/json", ...cors(origin) } });
  }
});