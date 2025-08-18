// supabase/functions/stripe-webhook-referrals/index.ts
// Deno Edge Function — verifies Stripe webhook signatures, writes purchases,
// and creates/updates referral earnings (idempotent). Handles refunds/disputes.

import Stripe from "https://esm.sh/stripe@12.18.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// --- Environment ------------------------------------------------------------
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEFAULT_COMMISSION_RATE = parseFloat(Deno.env.get("COMMISSION_RATE") ?? "0.15");

// --- Clients ----------------------------------------------------------------
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Helpers ----------------------------------------------------------------
async function textBody(req: Request) {
  // Raw body required for Stripe signature verification
  return await req.text();
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function upsertPurchase(params: {
  provider_id: string; // Stripe session/invoice/payment_intent id
  user_id: string;
  gross_amount: number; // minor units
  currency: string; // e.g. GBP
  status: "paid" | "refunded";
}) {
  const { data, error } = await supabase
    .from("purchases")
    .upsert(
      {
        provider_id: params.provider_id,
        user_id: params.user_id,
        amount: params.gross_amount,
        currency: params.currency.toUpperCase(),
        status: params.status,
      },
      { onConflict: "provider_id" },
    )
    .select("id")
    .single();

  if (error) throw error;
  return data!.id as string;
}

async function getOrCreateReferral(referrer_id: string, referred_user_id: string) {
  // Try to find existing referral row
  const { data: exists, error: selErr } = await supabase
    .from("referrals")
    .select("id")
    .eq("referrer_id", referrer_id)
    .eq("referred_user_id", referred_user_id)
    .maybeSingle();

  if (selErr) throw selErr;
  if (exists) return exists.id as string;

  // Create if missing (historical purchases where referral row wasn't inserted at signup)
  const { data: created, error: insErr } = await supabase
    .from("referrals")
    .insert({ referrer_id, referred_user_id, generation: 1 })
    .select("id")
    .single();

  if (insErr) throw insErr;
  return created!.id as string;
}

async function createOrUpsertEarning(params: {
  referrer_id: string;
  referred_user_id: string;
  purchase_id: string;
  referral_id: string;
  amount: number; // minor units
  currency: string;
  status: "pending" | "paid" | "void";
}) {
  // Unique constraint is recommended on (user_id, referred_user_id, purchase_id)
  const { error } = await supabase
    .from("referral_earnings")
    .upsert(
      {
        user_id: params.referrer_id,
        referred_user_id: params.referred_user_id,
        purchase_id: params.purchase_id,
        referral_id: params.referral_id,
        amount: params.amount,
        generation: 1,
        status: params.status,
      },
      { onConflict: "user_id, referred_user_id, purchase_id" },
    );

  if (error) throw error;
}

async function markRefundVoidByProviderId(provider_id: string) {
  // Find purchase
  const { data: purchase, error } = await supabase
    .from("purchases")
    .select("id")
    .eq("provider_id", provider_id)
    .maybeSingle();

  if (error) throw error;
  if (!purchase) return; // nothing to do

  // Mark purchase refunded
  await supabase.from("purchases").update({ status: "refunded" }).eq("id", purchase.id);

  // Void earnings derived from this purchase
  await supabase.from("referral_earnings").update({ status: "void" }).eq("purchase_id", purchase.id);
}

function asMinorUnits(amount: unknown): number {
  const n = typeof amount === "number" ? amount : parseInt(String(amount ?? "0"), 10);
  return Number.isFinite(n) ? n : 0;
}

function extractCommissionRate(metaRate?: string | null): number {
  const r = metaRate ? parseFloat(metaRate) : DEFAULT_COMMISSION_RATE;
  return Number.isFinite(r) ? r : DEFAULT_COMMISSION_RATE;
}

// --- Core handler for a successful payment ----------------------------------
async function recordPaidTransaction(args: {
  provider_id: string; // Stripe session.id or invoice.id
  user_id: string;
  referrer_id?: string | null;
  amount_total: number; // minor units
  currency: string;
  commission_rate?: number;
}) {
  const purchase_id = await upsertPurchase({
    provider_id: args.provider_id,
    user_id: args.user_id,
    gross_amount: args.amount_total,
    currency: args.currency,
    status: "paid",
  });

  // Call the new L1/L2 referral processing function
  console.log("Processing L1/L2 referral earnings for user:", args.user_id);
  
  try {
    await supabase.rpc('record_referral_purchase_v2', {
      p_buyer_user: args.user_id,
      p_order_id: args.provider_id,
      p_gross_amount_cents: args.amount_total,
      p_currency: args.currency.toUpperCase(),
      p_locked_days: 7
    });
    
    console.log("Successfully processed L1/L2 referral earnings");
  } catch (error) {
    console.error("Error processing referral earnings:", error);
    // Don't throw - payment was successful, earnings failure shouldn't break webhook
  }
}

// --- Server -----------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return jsonResponse({ error: "Missing Stripe signature" }, 400);

  const raw = await textBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return jsonResponse({ error: "Invalid signature" }, 400);
  }

  try {
    switch (event.type) {
      // ✅ One-time payments & first-time subscription checkouts
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Ensure we have complete data (sometimes need to retrieve)
        const s = session.payment_status === "paid" && session.amount_total
          ? session
          : await stripe.checkout.sessions.retrieve(session.id);

        const user_id =
          (s.client_reference_id as string) ||
          (s.metadata?.user_id as string) ||
          "";

        if (!user_id) {
          console.warn("checkout.session.completed without user_id");
          break;
        }

        const referrer_id = (s.metadata?.referrer_id as string) || null;
        const commission_rate = extractCommissionRate(s.metadata?.commission_rate || null);
        const amount_total = asMinorUnits(s.amount_total ?? 0);
        const currency = (s.currency ?? "gbp").toUpperCase();

        await recordPaidTransaction({
          provider_id: s.id,
          user_id,
          referrer_id,
          amount_total,
          currency,
          commission_rate,
        });
        break;
      }

      // ✅ Recurring subscription charges & renewals
      case "invoice.payment_succeeded": {
        const inv = event.data.object as Stripe.Invoice;

        // Identify user/customer; we expect client_reference_id only on checkout session.
        // For renewals, rely on metadata we previously wrote on the subscription or
        // fallback to the user's saved referrer in DB.
        let user_id = (inv.metadata?.user_id as string) ?? "";
        let referrer_id = (inv.metadata?.referrer_id as string) ?? null;
        const commission_rate = extractCommissionRate(inv.metadata?.commission_rate || null);

        // If not present on invoice metadata, try to fetch the checkout session (subscription create)
        if (!user_id && inv.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(
              typeof inv.subscription === "string" ? inv.subscription : inv.subscription.id,
            );
            user_id = (sub.metadata?.user_id as string) ?? "";
            if (!referrer_id) referrer_id = (sub.metadata?.referrer_id as string) ?? null;
          } catch {
            // no-op
          }
        }

        // Fallback: read user's referrer from DB if we at least know the user
        if (!referrer_id && user_id) {
          const { data } = await supabase.from("profiles").select("referrer_id").eq("id", user_id).maybeSingle();
          if (data?.referrer_id) referrer_id = data.referrer_id as string;
        }

        if (!user_id) {
          console.warn("invoice.payment_succeeded without user_id");
          break;
        }

        const amount_total = asMinorUnits(inv.amount_paid ?? inv.amount_due ?? 0);
        const currency = (inv.currency ?? "gbp").toUpperCase();

        await recordPaidTransaction({
          provider_id: inv.id,
          user_id,
          referrer_id,
          amount_total,
          currency,
          commission_rate,
        });
        break;
      }

      // ✅ Refunds → void earnings + mark purchase refunded
      case "charge.refunded":
      case "charge.dispute.funds_withdrawn": {
        const charge = event.data.object as Stripe.Charge;
        const provider_id =
          (typeof charge.payment_intent === "string" ? charge.payment_intent : charge.id) ?? charge.id;
        await markRefundVoidByProviderId(provider_id);
        break;
      }

      default:
        // Unhandled events are fine; acknowledge
        break;
    }

    return jsonResponse({ received: true });
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return jsonResponse({ error: String(err?.message ?? err) }, 500);
  }
});