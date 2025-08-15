import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    // Create service role client to bypass RLS
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { ref } = await req.json();
    
    if (!ref) {
      return new Response(JSON.stringify({ error: 'No ref code provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find referrer by ref code
    const { data: referrer } = await supabaseService
      .from('profiles')
      .select('id')
      .eq('referral_code', ref)
      .single();

    // Get client IP and user agent
    const ip = req.headers.get('x-forwarded-for') ?? 
               req.headers.get('x-real-ip') ?? 
               'unknown';
    const ua = req.headers.get('user-agent') ?? 'unknown';

    // Log the click
    const { error } = await supabaseService
      .from('referral_clicks')
      .insert({
        ref_code: ref,
        referrer_id: referrer?.id || null,
        ip,
        ua
      });

    if (error) {
      console.error('Error logging referral click:', error);
      return new Response(JSON.stringify({ error: 'Failed to log click' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});