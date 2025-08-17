// supabase/functions/create-donation-checkout/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'https://esm.sh/stripe@16.5.0?target=deno'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const { amount, campaign_id, campaign_name, user_id, email } = await req.json().catch(() => ({}))

    // Basic input guard – default to £25 if not provided
    const amountInPence = Number.isFinite(amount) ? Math.max(100, Math.round(Number(amount) * 100)) : 2500

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const APP_URL = Deno.env.get('APP_BASE_URL') || Deno.env.get('SITE_URL') || 'https://www.zamarsongs.com'
    if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY')

    const stripe = new Stripe(STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() })

    // Create a one-off payment Checkout Session with dynamic amount
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: campaign_name || 'Zamar Donation',
              metadata: { campaign_id: String(campaign_id || ''), app: 'zamar' },
            },
            unit_amount: amountInPence, // e.g., 2500 = £25.00
          },
          quantity: 1,
        },
      ],
      metadata: {
        campaign_id: String(campaign_id || ''),
        campaign_name: campaign_name || 'General Fund',
        user_id: String(user_id || ''),
      },
      customer_email: email || undefined,
      success_url: `${APP_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/donate`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  } catch (e) {
    console.error('create-donation-checkout error:', e)
    return new Response(JSON.stringify({ error: (e as Error).message ?? 'Unknown error' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  }
})