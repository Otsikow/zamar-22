import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'https://esm.sh/stripe@16.5.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  console.log('🔥 DONATION FUNCTION STARTED')
  console.log('Method:', req.method)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled')
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    console.log('📝 Parsing request body...')
    const bodyText = await req.text()
    console.log('Raw body:', bodyText)
    
    const body = bodyText ? JSON.parse(bodyText) : {}
    console.log('Parsed body:', body)
    
    const { amount, recurring = false, email } = body
    console.log('Extracted values:', { amount, recurring, email, amountType: typeof amount })

    // Validate required environment variables
    console.log('🔧 Checking environment variables...')
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const APP_URL = Deno.env.get('APP_BASE_URL') || Deno.env.get('SITE_URL') || 'https://www.zamarsongs.com'
    
    console.log('Environment status:', {
      hasStripeKey: !!STRIPE_SECRET_KEY,
      stripeKeyPrefix: STRIPE_SECRET_KEY?.substring(0, 7),
      appUrl: APP_URL,
      allEnvKeys: Object.keys(Deno.env.toObject())
    })
    
    if (!STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is missing!')
      throw new Error('Missing STRIPE_SECRET_KEY')
    }

    // Initialize Stripe
    console.log('💳 Initializing Stripe...')
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
    })
    console.log('✅ Stripe initialized successfully')

    // Convert amount to pence and ensure minimum
    console.log('💰 Processing amount...')
    if (!amount || isNaN(Number(amount))) {
      console.error('❌ Invalid amount:', amount)
      throw new Error(`Invalid amount: ${amount}`)
    }
    
    const amountInPence = Math.max(100, Math.round(Number(amount) * 100))
    console.log('Amount conversion:', { original: amount, pence: amountInPence })

    console.log('🛒 Creating checkout session...')
    console.log('Session type:', recurring ? 'subscription' : 'payment')
    
    let session

    if (recurring) {
      console.log('📅 Creating monthly subscription session...')
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
      console.log('✅ Subscription session created:', session.id)
    } else {
      console.log('💰 Creating one-time payment session...')
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
      console.log('✅ Payment session created:', session.id)
    }

    console.log('🎉 Checkout session created successfully!')
    console.log('Session details:', {
      id: session.id,
      url: session.url,
      mode: session.mode,
      amount_total: session.amount_total
    })

    const response = { url: session.url }
    console.log('📤 Returning response:', response)

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ DONATION CHECKOUT ERROR:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const errorResponse = {
      error: errorMessage,
      hint: 'Check STRIPE_SECRET_KEY, amount validation, and environment setup.',
      timestamp: new Date().toISOString()
    }
    
    console.log('📤 Returning error response:', errorResponse)
    
    return new Response(JSON.stringify(errorResponse), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    })
  }
})