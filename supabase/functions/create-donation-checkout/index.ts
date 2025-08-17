// supabase/functions/create-donation-checkout/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'https://esm.sh/stripe@16.5.0?target=deno'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: cors })

  try {
    const bodyText = await req.text()
    const payload = bodyText ? JSON.parse(bodyText) : {}
    const rawAmount = payload.amount

    // accept 5, "5", "£5", "5.00"
    const parsed = String(rawAmount ?? '25').replace(/[^\d.]/g, '')
    const amountInPence = Math.max(100, Math.round(Number(parsed) * 100))

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const APP_URL = Deno.env.get('APP_BASE_URL') || Deno.env.get('SITE_URL') || 'https://www.zamarsongs.com'
    if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY')

    const stripe = new Stripe(STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: payload.campaign_name || 'Zamar Donation' },
          unit_amount: amountInPence,
        },
        quantity: 1,
      }],
      metadata: {
        campaign_id: String(payload.campaign_id ?? ''),
        campaign_name: payload.campaign_name || 'General Fund',
        user_id: String(payload.user_id ?? ''),
      },
      customer_email: payload.email || undefined,
      success_url: `${APP_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/donate`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  } catch (e) {
    console.error('create-donation-checkout error:', e)
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    })
  }
})