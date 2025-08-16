import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount_cents, currency = 'GBP', recurring = false, campaign = 'General Fund' } = await req.json();

    if (!amount_cents || amount_cents < 100) {
      throw new Error("Minimum donation is £1");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let user_id = null;
    
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user_id = data.user?.id || null;
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const origin = req.headers.get("origin") || "https://your-app.com";
    
    let mode: 'payment' | 'subscription' = 'payment';
    let line_items;

    if (!recurring) {
      mode = 'payment';
      line_items = [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { 
            name: `Donation - ${campaign}`,
            description: `Support Zamar Songs - ${campaign}`
          },
          unit_amount: amount_cents
        },
        quantity: 1
      }];
    } else {
      mode = 'subscription';
      // Create a recurring price for the custom monthly amount
      const product = await stripe.products.create({ 
        name: `Monthly Donation - ${campaign}`,
        description: `Monthly donation to support ${campaign}`
      });
      
      const price = await stripe.prices.create({
        unit_amount: amount_cents,
        currency: currency.toLowerCase(),
        recurring: { interval: 'month' },
        product: product.id
      });
      
      line_items = [{ price: price.id, quantity: 1 }];
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      line_items,
      metadata: { 
        user_id: user_id || '', 
        campaign, 
        type: recurring ? 'recurring' : 'one_time' 
      },
      success_url: `${origin}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/donate`
    });

    // Pre-log pending donation
    await supabase.from('donations').insert({
      user_id,
      amount: amount_cents / 100, // Store as decimal amount, not cents
      currency,
      campaign,
      type: recurring ? 'recurring' : 'one_time',
      stripe_checkout_session: session.id,
      status: 'pending'
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating donation checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});