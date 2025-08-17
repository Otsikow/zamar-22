import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'https://esm.sh/stripe@16.5.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { amount, recurring = false, email } = body

    console.log('Donation request:', { amount, recurring, email })

    // Validate required environment variables
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const APP_URL = Deno.env.get('APP_BASE_URL') || Deno.env.get('SITE_URL') || 'https://www.zamarsongs.com'
    
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY')
    }

    console.log('Environment check:', {
      hasStripeKey: !!STRIPE_SECRET_KEY,
      stripeKeyPrefix: STRIPE_SECRET_KEY?.substring(0, 7),
      appUrl: APP_URL
    })

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Convert amount to pence and ensure minimum
    const amountInPence = Math.max(100, Math.round(Number(amount) * 100))

    let session

    if (recurring) {
      // Monthly recurring donation
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: email || undefined,
        line_items: [{
          price_data: {
            currency: 'gbp',
            recurring: { interval: 'month' },
            product_data: { name: 'Monthly Donation to Zamar' },
            unit_amount: amountInPence,
          },
          quantity: 1,
        }],
        metadata: {
          type: 'donation',
          recurring: 'true',
        },
        success_url: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/donate`,
      })
    } else {
      // One-time donation
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email || undefined,
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: 'One-Time Donation to Zamar' },
            unit_amount: amountInPence,
          },
          quantity: 1,
        }],
        metadata: {
          type: 'donation',
          recurring: 'false',
        },
        success_url: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/donate`,
      })
    }

    console.log('Checkout session created:', session.id)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Donation checkout error:', error)
    
    return new Response(JSON.stringify({
      error: errorMessage,
      hint: 'Check STRIPE_SECRET_KEY, amount validation, and environment setup.',
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    })
  }
})