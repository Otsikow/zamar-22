import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYMENT-REFERRALS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key for database writes
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { user_id, payment_amount, payment_type = 'donation', description } = await req.json();
    
    if (!user_id) {
      throw new Error("user_id is required");
    }
    
    if (!payment_amount || payment_amount < 25) {
      logStep("Payment amount below minimum threshold", { amount: payment_amount });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment amount must be at least £25 to qualify for referral earnings" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Processing payment referrals", { user_id, payment_amount });

    // Call the database function to process referral earnings
    const { error: rpcError } = await supabaseClient
      .rpc('insert_referral_earnings_after_payment', {
        payer_id: user_id,
        payment_amount: payment_amount
      });

    if (rpcError) {
      logStep("Error processing referral earnings", { error: rpcError });
      throw rpcError;
    }

    // Also insert into payments table for tracking
    const { error: insertError } = await supabaseClient
      .from('payments')
      .insert({
        user_id,
        amount: payment_amount,
        status: 'succeeded',
        payment_type: payment_type,
        description: description || `Payment of £${payment_amount}`,
        currency: 'gbp'
      });

    if (insertError) {
      logStep("Error inserting payment record", { error: insertError });
      // Don't throw here as referral processing already succeeded
    }

    logStep("Referral earnings processed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Referral earnings processed successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing payment referrals", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});