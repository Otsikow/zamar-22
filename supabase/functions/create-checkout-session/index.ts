// supabase/functions/create-checkout-session/index.ts
// Creates Stripe Checkout sessions with referral tracking

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, price_id, referral_code, click_id } = await req.json();

    if (!user_id || !price_id) {
      return new Response("Missing required params", { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Create checkout session with referral metadata
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${Deno.env.get("FRONTEND_URL") || "https://www.zamarsongs.com"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("FRONTEND_URL") || "https://www.zamarsongs.com"}/cancel`,
      metadata: {
        user_id,
        referral_code: referral_code || "",
        click_id: click_id || "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error creating checkout session", err);
    return new Response("Internal Server Error", { 
      status: 500,
      headers: corsHeaders
    });
  }
});