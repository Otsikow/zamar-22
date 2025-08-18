// supabase/functions/stripe-webhook-referrals/index.ts
// Handles Stripe webhooks and processes referral earnings via RPCs

import Stripe from "https://esm.sh/stripe@13.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const user_id = session.metadata?.user_id;
    const referral_code = session.metadata?.referral_code;
    const click_id = session.metadata?.click_id;
    const gross = session.amount_total;
    const currency = session.currency || "gbp";

    try {
      // Attach referral → user if not yet linked
      if (referral_code && user_id) {
        await supabase.rpc("attach_referral_on_signup", {
          p_referred_user: user_id,
          p_code: referral_code,
          p_click_id: click_id ? Number(click_id) : null,
        });
      }

      // Record L1/L2 earnings using the new RPC
      if (user_id && gross) {
        await supabase.rpc("record_referral_purchase", {
          p_buyer_user: user_id,
          p_order_id: session.id,
          p_gross_amount_cents: gross,
          p_currency: currency.toUpperCase(),
        });
      }
    } catch (err) {
      console.error("Error recording referral:", err);
    }
  }

  return new Response("ok", { status: 200 });
});