import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[${new Date().toISOString()}] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Donation webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    logStep("Event type", { type: event.type });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout session", { sessionId: session.id });

      const amount_total = session.amount_total || 0;
      const amount = amount_total / 100; // Convert from cents to decimal
      const currency = session.currency?.toUpperCase() || 'GBP';
      const metadata = session.metadata || {};
      
      // Find existing donation by user and amount (since we don't store checkout session)
      const { data: existingDonation } = await supabase
        .from('donations')
        .select('id')
        .eq('user_id', metadata.user_id || null)
        .eq('amount', amount)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingDonation) {
        // Update existing donation
        const { error } = await supabase
          .from('donations')
          .update({
            stripe_payment_id: session.payment_intent as string,
            status: 'completed'
          })
          .eq('id', existingDonation.id);

        if (error) {
          logStep("Error updating donation", { error });
        } else {
          logStep("Updated existing donation", { donationId: existingDonation.id });
        }
      } else {
        // Create new donation record
        const { error } = await supabase
          .from('donations')
          .insert({
            user_id: metadata.user_id || null,
            amount,
            campaign: metadata.campaign || 'General Fund',
            type: metadata.type || 'one_time',
            stripe_payment_id: session.payment_intent as string,
            status: 'completed'
          });

        if (error) {
          logStep("Error creating donation", { error });
        } else {
          logStep("Created new donation record");
        }
      }

      // Process referral earnings if donation meets minimum threshold (£25)
      if (amount_total >= 2500 && metadata.user_id) {
        try {
          await supabase.rpc('insert_referral_earnings_after_payment', {
            payer_id: metadata.user_id,
            payment_amount: amount
          });
          logStep("Processed referral earnings", { userId: metadata.user_id, amount });
        } catch (error) {
          logStep("Error processing referral earnings", { error });
        }
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      logStep("Processing subscription payment", { invoiceId: invoice.id });

      // Handle recurring donation payments
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const checkoutSession = await stripe.checkout.sessions.list({
          subscription: subscription.id,
          limit: 1
        });

        if (checkoutSession.data.length > 0) {
          const session = checkoutSession.data[0];
          const metadata = session.metadata || {};

          // Create donation record for subscription payment
          const { error } = await supabase
            .from('donations')
            .insert({
              user_id: metadata.user_id || null,
              amount: invoice.amount_paid / 100, // Convert from cents to decimal
              campaign: metadata.campaign || 'General Fund',
              type: 'recurring',
              stripe_payment_id: invoice.payment_intent as string,
              status: 'completed'
            });

          if (error) {
            logStep("Error creating recurring donation", { error });
          } else {
            logStep("Created recurring donation record");
          }

          // Process referral earnings for recurring payment
          if (invoice.amount_paid >= 2500 && metadata.user_id) {
            try {
              await supabase.rpc('insert_referral_earnings_after_payment', {
                payer_id: metadata.user_id,
                payment_amount: invoice.amount_paid / 100
              });
              logStep("Processed referral earnings for subscription", { userId: metadata.user_id });
            } catch (error) {
              logStep("Error processing subscription referral earnings", { error });
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Webhook error", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});