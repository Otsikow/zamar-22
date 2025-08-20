import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Create service role client to bypass RLS for user creation
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id } = await req.json();
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get referral code from cookie header
    const cookieHeader = req.headers.get('cookie') || '';
    const refMatch = cookieHeader.match(/zamar_ref=([^;]+)/);
    const refCode = refMatch ? refMatch[1] : null;

    console.log('Processing referral attachment:', { user_id, refCode });

    if (!refCode) {
      console.log('No referral code found, skipping attachment');
      return new Response(JSON.stringify({ success: true, message: 'No referral to attach' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find the referrer by ref_code
    const { data: referrer, error: referrerError } = await supabaseService
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('ref_code', refCode)
      .single();

    if (referrerError || !referrer) {
      console.log('Referrer not found for code:', refCode);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid referral code' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prevent self-referral
    if (referrer.id === user_id) {
      console.log('Self-referral attempt blocked');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Cannot refer yourself' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update the new user's profile with referrer info (only if not already set)
    const { error: updateError } = await supabaseService
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', user_id)
      .is('referred_by', null); // Only update if not already set

    if (updateError) {
      console.error('Error updating referred_by:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to attach referral' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create referral record for tracking
    const { error: referralError } = await supabaseService
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_user_id: user_id,
        generation: 1,
        status: 'pending'
      });

    if (referralError) {
      console.error('Error creating referral record:', referralError);
      // Continue even if this fails, as the main attachment succeeded
    }

    console.log('Referral attachment successful:', { 
      referrer_id: referrer.id, 
      referred_user_id: user_id 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      referrer: {
        name: `${referrer.first_name || ''} ${referrer.last_name || ''}`.trim() || 'A friend',
        email: referrer.email
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error in attach-referral:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});