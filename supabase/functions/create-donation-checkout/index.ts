import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Get current user (optional for donations)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    let user = null;
    if (token && token !== supabaseAnonKey) {
      const { data: userResult } = await supabase.auth.getUser(token);
      user = userResult?.user;
    }

    const { amount, campaign, donationType } = await req.json();

    if (!amount || parseFloat(amount) < 1) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeSecret) {
      console.error("Missing STRIPE_SECRET_KEY secret");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    const origin = req.headers.get("origin") ?? "";
    const siteUrl = Deno.env.get("SITE_URL") ?? origin;
    const successUrl = `${siteUrl}/thank-you`;
    const cancelUrl = `${siteUrl}/donate`;

    // Convert amount to pence
    const amountInPence = Math.round(parseFloat(amount) * 100);

    // Determine campaign name for display
    const campaignMap: Record<string, string> = {
      general: "General Fund",
      translation: "Translation Fund", 
      production: "Song Production",
      outreach: "Outreach Projects"
    };
    
    const campaignName = campaignMap[campaign] || "General Fund";
    const donationTypeText = donationType === "monthly" ? "Monthly" : "One-time";
    
    const session = await stripe.checkout.sessions.create({
      mode: donationType === "monthly" ? "subscription" : "payment",
      ui_mode: "hosted",
      line_items: donationType === "monthly" ? [
        {
          price_data: {
            currency: "gbp",
            product_data: { 
              name: `${donationTypeText} Donation - ${campaignName}`,
              description: `Monthly donation to support ${campaignName}`
            },
            unit_amount: amountInPence,
            recurring: { interval: "month" }
          },
          quantity: 1,
        },
      ] : [
        {
          price_data: {
            currency: "gbp",
            product_data: { 
              name: `${donationTypeText} Donation - ${campaignName}`,
              description: `One-time donation to support ${campaignName}`
            },
            unit_amount: amountInPence,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user?.id ?? "anonymous",
        campaign: campaignName,
        donation_type: donationType,
        amount: amount,
      },
      customer_email: user?.email,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-donation-checkout error", error);
    return new Response(JSON.stringify({ error: (error as Error).message ?? String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});