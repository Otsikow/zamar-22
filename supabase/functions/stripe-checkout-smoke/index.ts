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
    out.keyPrefix = key.slice(0, 7); // sk_test / sk_live

    if (!key) throw new Error("STRIPE_SECRET_KEY is missing in Supabase Function Secrets");

    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
    out.step = "stripe_inited";

    // Create a fixed £1 session and FORCE hosted Checkout UI
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "hosted",
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: { name: "Zamar Donation (smoke £1)" },
          unit_amount: 100, // £1 → pence
        },
        quantity: 1,
      }],
      success_url: `${SITE_URL}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/donate/cancelled`,
      // optional but useful for diagnosis
      metadata: { smoke: "true" },
    });

    out.step = "session_created";
    out.session_id = session.id;
    out.url = session.url ?? null;

    if (!session.url) {
      // Fetch again just in case (some accounts populate URL on retrieve)
      const fresh = await stripe.checkout.sessions.retrieve(session.id);
      out.url_after_retrieve = fresh.url ?? null;
      out.payment_intent = fresh.payment_intent ?? null; // extra context
      out.customer = fresh.customer ?? null;
      out.warning = "Stripe returned no hosted URL. Check ui_mode, account settings, and success/cancel URLs.";
      return new Response(JSON.stringify(out), {
        status: 200,
        headers: { "content-type": "application/json", ...cors(origin) },
      });
    }

    out.ok = true;
    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { "content-type": "application/json", ...cors(origin) },
    });
  } catch (err) {
    out.step = "error";
    out.error = (err as any)?.message ?? String(err);
    return new Response(JSON.stringify(out), {
      status: 200, // always 200 so the client can read diagnostics
      headers: { "content-type": "application/json", ...cors(origin) },
    });
  }
});