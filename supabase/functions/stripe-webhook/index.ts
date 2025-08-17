import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing env", { status: 500 });
  }

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  const { default: Stripe } = await import("https://esm.sh/stripe@16.5.0?target=deno");
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as any;
    const paymentIntent = s.payment_intent as string;
    const amount = s.amount_total; // in pence
    const currency = s.currency;
    const meta = s.metadata || {};

    // Handle custom song orders
    if (meta.type === "custom_song_order" && meta.order_id) {
      await supabase.from("custom_song_orders").update({
        status: "paid",
        stripe_payment_intent: paymentIntent,
        updated_at: new Date().toISOString()
      }).eq("id", meta.order_id);

      console.log("Custom song order marked as paid:", meta.order_id);
    } else if (meta.type === "upgrade" && meta.order_id && meta.upgrade_to) {
      // Handle order upgrades
      const tierAmounts = { basic: 2500, pro: 6000, premium: 12900 };
      const newAmount = tierAmounts[meta.upgrade_to as keyof typeof tierAmounts];
      
      await supabase.from("custom_song_orders").update({
        tier: meta.upgrade_to,
        amount: newAmount,
        updated_at: new Date().toISOString()
      }).eq("id", meta.order_id);

      console.log(`Order upgraded to ${meta.upgrade_to}:`, meta.order_id);
    } else if (meta.type === "resume" && meta.order_id) {
      // Handle resumed payments for existing orders
      await supabase.from("custom_song_orders").update({
        status: "paid",
        stripe_payment_intent: paymentIntent,
        stripe_session_id: s.id,
        updated_at: new Date().toISOString()
      }).eq("id", meta.order_id);

      console.log("Resumed payment completed for order:", meta.order_id);
    } else if (meta.type === "single_song" && meta.song_id) {
      // Handle single song purchases
      await supabase.from("purchases").insert({
        user_id: meta.user_id,
        song_id: meta.song_id,
        amount: s.amount_total,
        currency: s.currency,
        status: "completed",
        stripe_payment_id: paymentIntent,
        stripe_session_id: s.id
      });

      console.log("Single song purchase recorded:", meta.song_id);
    } else if (meta.type === "donation") {
      // Handle donations (both one-time and recurring)
      const isRecurring = meta.recurring === 'true' || s.mode === 'subscription';
      
      await supabase.from("donations").insert({
        user_id: null, // Allow anonymous donations
        amount: Math.round(amount / 100), // Convert from pence to pounds
        currency,
        type: isRecurring ? 'monthly' : 'one-time',
        stripe_customer_id: s.customer,
        stripe_subscription_id: s.subscription || null,
        stripe_payment_intent: paymentIntent,
        stripe_checkout_session: s.id,
        status: "completed",
      });
      
      console.log(`${isRecurring ? 'Monthly' : 'One-time'} donation recorded:`, {
        amount: amount / 100,
        currency
      });
    }

    // Process referral earnings if user is identified
    if (meta.user_id && meta.user_id !== "anonymous") {
      try {
        const paymentAmount = amount ? amount / 100 : 0; // Convert from pence to pounds
        if (paymentAmount >= 25) {
          await supabase.rpc("insert_referral_earnings_after_payment", {
            payer_id: meta.user_id,
            payment_amount: paymentAmount
          });
        }
      } catch (referralError) {
        console.log("Referral processing failed:", referralError);
        // Don't fail the webhook for referral errors
      }
    }
  }

  return new Response("ok", { status: 200 });
});