import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CUSTOM-SONG-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Custom song checkout creation started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Create Supabase client for authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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
    const { request_id, tier } = await req.json();
    if (!request_id || !tier) {
      throw new Error("request_id and tier are required");
    }

    // Get the custom song request to verify ownership
    const { data: customRequest, error: requestError } = await supabaseClient
      .from("custom_song_requests")
      .select("*")
      .eq("id", request_id)
      .eq("user_id", user.id)
      .single();

    if (requestError || !customRequest) {
      throw new Error("Custom song request not found or access denied");
    }

    // Find the appropriate product based on tier
    const tierMapping: Record<string, string> = {
      basic: "Essential",
      signature: "Signature", 
      premier: "Premier"
    };

    const productNamePart = tierMapping[tier] || "Essential";
    
    const { data: product, error: productError } = await supabaseClient
      .from("products")
      .select("*")
      .eq("category", "custom_song")
      .eq("is_active", true)
      .ilike("name", `%${productNamePart}%`)
      .single();

    if (productError || !product) {
      throw new Error(`Product not found for tier: ${tier}`);
    }

    logStep("Product found", { productId: product.id, name: product.name, tier });

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

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create checkout session for custom song
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: product.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}&type=custom_song&request_id=${request_id}`,
      cancel_url: `${origin}/request-song?tier=${tier}`,
      metadata: {
        user_id: user.id,
        product_id: product.id,
        request_id: request_id,
        tier: tier,
        type: "custom_song"
      },
    });
    
    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      requestId: request_id,
      tier 
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-custom-song-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});