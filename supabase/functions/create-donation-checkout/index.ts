import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Environment-based CORS configuration
const getAllowedOrigins = () => {
  const envOrigins = Deno.env.get("ALLOWED_ORIGINS");
  if (envOrigins) {
    return envOrigins.split(",").map(s => s.trim()).filter(Boolean);
  }
  
  // Default fallback origins
  return [
    "https://www.zamarsongs.com",
    "https://zamarsongs.com",
    "http://localhost:3000"
  ];
};

function corsHeaders(origin: string | null) {
  const allowedOrigins = getAllowedOrigins();
  
  // For development, allow any lovable.dev subdomain
  const isLovableDev = origin?.includes('lovable.dev');
  const isConfiguredOrigin = allowedOrigins.includes(origin ?? "");
  
  const allowOrigin = (isLovableDev || isConfiguredOrigin) ? origin! : "https://www.zamarsongs.com";
  
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

Deno.serve(async (req) => {
  console.log("=== Edge Function Started ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
  const origin = req.headers.get("origin");
  console.log("Origin:", origin);
  
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight");
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    console.log("Parsing request body...");
    const body = await req.json();
    console.log("Request body:", body);
    
    const { amountGBP, campaign_id, donor_name, donor_email } = body;

    // Basic validation
    console.log("Validating amount:", amountGBP);
    if (!amountGBP || isNaN(amountGBP) || amountGBP < 1) {
      console.log("Amount validation failed");
      return new Response(JSON.stringify({ error: "Minimum donation is £1" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    console.log("Checking environment variables...");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const APP_BASE_URL = Deno.env.get("APP_BASE_URL");
    console.log("STRIPE_SECRET_KEY exists:", !!STRIPE_SECRET_KEY);
    console.log("APP_BASE_URL:", APP_BASE_URL);
    
    if (!STRIPE_SECRET_KEY || !APP_BASE_URL) {
      console.log("Environment variables missing");
      return new Response(JSON.stringify({ error: "Server not configured (env)" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Lazy import Stripe
    console.log("Importing Stripe...");
    const { default: Stripe } = await import("https://esm.sh/stripe@16.5.0?target=deno");
    console.log("Creating Stripe instance...");
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    // Use the configured donation price ID
    console.log("Creating Stripe session...");
    const sessionData = {
      mode: "payment" as const,
      payment_method_types: ["card"],
      customer_email: donor_email || "guest@zamarsongs.com",
      line_items: [
        {
          price: "price_1RwhfCPZvYhtttKceXN3txRB", // Fixed donation price ID
          quantity: Math.round(Number(amountGBP) * 100), // Use quantity to represent pence
        },
      ],
      success_url: `${APP_BASE_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/donate`,
      metadata: {
        campaign_id: campaign_id ?? "general",
        donor_name: donor_name ?? "Anonymous",
        donor_email: donor_email ?? "guest@zamarsongs.com",
        amount_gbp: amountGBP.toString(),
      },
    };
    
    console.log("Session data:", JSON.stringify(sessionData, null, 2));
    const session = await stripe.checkout.sessions.create(sessionData);
    console.log("Session created successfully:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  } catch (e) {
    console.error("=== ERROR IN EDGE FUNCTION ===");
    console.error("Error type:", typeof e);
    console.error("Error message:", e?.message);
    console.error("Full error:", e);
    console.error("Stack trace:", e?.stack);
    
    // Always return JSON with 4xx/5xx so the client can show a helpful message
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }
});