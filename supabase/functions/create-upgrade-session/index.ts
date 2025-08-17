import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AMOUNTS = { 
  basic: 2500,    // £25
  pro: 6000,      // £60  
  premium: 12900  // £129
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
    const { order_id, target_tier } = await req.json();
    
    if (!order_id || !AMOUNTS[target_tier as keyof typeof AMOUNTS]) {
      return new Response("Bad Request - Missing order_id or invalid target_tier", { 
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

    // Calculate the upgrade delta
    const currentAmount = AMOUNTS[order.tier as keyof typeof AMOUNTS];
    const targetAmount = AMOUNTS[target_tier as keyof typeof AMOUNTS];
    const delta = targetAmount - currentAmount;

    if (delta <= 0) {
      return new Response("No upgrade available - target tier is not higher", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log(`Creating upgrade session: ${order.tier} → ${target_tier}, delta: £${delta/100}`);

    // Create Stripe checkout session for the upgrade
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: { 
            name: `Upgrade to ${target_tier.charAt(0).toUpperCase() + target_tier.slice(1)}`,
            description: `Upgrade from ${order.tier} to ${target_tier} tier`
          },
          unit_amount: delta
        },
        quantity: 1
      }],
      success_url: `${Deno.env.get("SITE_URL") || Deno.env.get("APP_BASE_URL")}/library?upgrade=success`,
      cancel_url: `${Deno.env.get("SITE_URL") || Deno.env.get("APP_BASE_URL")}/library?upgrade=cancelled`,
      metadata: { 
        order_id, 
        upgrade_to: target_tier, 
        type: "upgrade",
        original_tier: order.tier
      }
    });

    console.log("Upgrade session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      }
    });

  } catch (error) {
    console.error("Error creating upgrade session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      }
    });
  }
});