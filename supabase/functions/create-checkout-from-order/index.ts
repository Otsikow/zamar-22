import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { order_id } = await req.json();
    
    if (!order_id) {
      return new Response("Bad Request - Missing order_id", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the existing order
    const { data: order, error } = await supabase
      .from("custom_song_orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (error || !order) {
      console.error("Order not found:", error);
      return new Response("Order not found", { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    if (order.status !== "pending") {
      return new Response("Only pending orders can be resumed", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log(`Resuming payment for order: ${order_id}, tier: ${order.tier}, amount: £${order.amount/100}`);

    // Create new Stripe checkout session for the existing order
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price: order.stripe_price_id,
        quantity: 1
      }],
      success_url: `${Deno.env.get("SITE_URL") || Deno.env.get("APP_BASE_URL")}/library?payment=success`,
      cancel_url: `${Deno.env.get("SITE_URL") || Deno.env.get("APP_BASE_URL")}/library?payment=cancelled`,
      metadata: { 
        order_id, 
        user_id: order.user_id, 
        tier: order.tier, 
        type: "resume" 
      }
    });

    // Update the order with the new session ID
    await supabase
      .from("custom_song_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order_id);

    console.log("Resume payment session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      }
    });

  } catch (error) {
    console.error("Error creating checkout from order:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      }
    });
  }
});