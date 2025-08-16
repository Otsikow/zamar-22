import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe signature found");
    }

    // Get the raw body
    const body = await req.text();
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout completion", { sessionId: session.id });

      const userId = session.metadata?.user_id;
      const priceId = session.line_items?.data?.[0]?.price?.id || session.metadata?.price_id;

      if (!userId || !priceId) {
        logStep("Missing userId or priceId", { userId, priceId });
        return new Response("Missing required metadata", { 
          status: 400,
          headers: corsHeaders 
        });
      }

      // Find the product by stripe_price_id
      const { data: product, error: productError } = await supabaseClient
        .from("products")
        .select("*")
        .eq("stripe_price_id", priceId)
        .single();

      if (productError || !product) {
        logStep("Product not found", { priceId, error: productError });
        return new Response("Product not found", { 
          status: 404,
          headers: corsHeaders 
        });
      }

      logStep("Found product", { productId: product.id, category: product.category });

      // Create purchase record
      const { error: purchaseError } = await supabaseClient
        .from("purchases")
        .insert({
          user_id: userId,
          product_id: product.id,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          status: "paid"
        });

      if (purchaseError) {
        logStep("Failed to create purchase record", { error: purchaseError });
        return new Response("Failed to create purchase record", { 
          status: 500,
          headers: corsHeaders 
        });
      }

      logStep("Purchase record created successfully");

      // Handle different product categories
      if (product.category === "supporter" || product.category === "subscription") {
        // Update user membership tier
        const { error: updateError } = await supabaseClient
          .from("profiles")
          .update({ 
            account_status: "active",
            // You might want to add a membership_tier column to profiles table
          })
          .eq("id", userId);

        if (updateError) {
          logStep("Failed to update user profile", { error: updateError });
        } else {
          logStep("User profile updated for membership");
        }
      }

      // Process referral earnings if applicable
      try {
        const paymentAmount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents
        if (paymentAmount >= 25) {
          await supabaseClient.rpc("insert_referral_earnings_after_payment", {
            payer_id: userId,
            payment_amount: paymentAmount
          });
          logStep("Referral earnings processed");
        }
      } catch (referralError) {
        logStep("Referral processing failed", { error: referralError });
        // Don't fail the webhook for referral errors
      }

    } else if (event.type === "invoice.payment_succeeded") {
      // Handle subscription renewals
      const invoice = event.data.object as Stripe.Invoice;
      logStep("Processing subscription renewal", { invoiceId: invoice.id });

      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const userId = subscription.metadata?.user_id;

      if (userId) {
        // Process referral earnings for subscription renewals
        try {
          const paymentAmount = invoice.amount_paid ? invoice.amount_paid / 100 : 0;
          if (paymentAmount >= 25) {
            await supabaseClient.rpc("insert_referral_earnings_after_payment", {
              payer_id: userId,
              payment_amount: paymentAmount
            });
            logStep("Subscription renewal referral earnings processed");
          }
        } catch (referralError) {
          logStep("Subscription referral processing failed", { error: referralError });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Webhook error", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});