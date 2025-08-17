import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Checkout creation started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Create Supabase client for authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Service role client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { order_id, tier, amount } = await req.json();
    if (!order_id || !tier || !amount) {
      throw new Error("order_id, tier, and amount are required");
    }

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabaseService
      .from("custom_song_orders")
      .select("*")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single();

    if (orderError || !order) {
      throw new Error("Order not found or access denied");
    }

    logStep("Order verified", { orderId: order.id, tier: order.tier });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    const origin = req.headers.get("origin") || "https://wtnebvhrjnpygkftjreo.supabase.co";
    const SITE_URL = Deno.env.get("SITE_URL") || origin;

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Custom Song - ${tier.charAt(0).toUpperCase() + tier.slice(1)} Package`,
              description: `Custom song creation with ${tier} tier features`,
            },
            unit_amount: amount, // amount in pence
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${SITE_URL}/library?status=success&order_id=${order.id}`,
      cancel_url: `${SITE_URL}/library?status=cancelled&order_id=${order.id}`,
      metadata: {
        user_id: user.id,
        order_id: order.id,
        tier: tier,
        type: "custom_song_order"
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    // Update order with session ID
    await supabaseService
      .from("custom_song_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);
    
    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      orderId: order.id,
      tier 
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});