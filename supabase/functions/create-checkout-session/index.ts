// supabase/functions/create-checkout-session/index.ts
// Deno Edge Function — creates Stripe Checkout Session with referral metadata.

import Stripe from "https://esm.sh/stripe@12.18.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// --- Environment ------------------------------------------------------------
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CHECKOUT_SUCCESS_URL =
  Deno.env.get("CHECKOUT_SUCCESS_URL") ?? "https://www.zamarsongs.com/success";
const CHECKOUT_CANCEL_URL =
  Deno.env.get("CHECKOUT_CANCEL_URL") ?? "https://www.zamarsongs.com/cancel";
const DEFAULT_CURRENCY = (Deno.env.get("DEFAULT_CURRENCY") ?? "GBP").toLowerCase();
const DEFAULT_COMMISSION_RATE = parseFloat(Deno.env.get("COMMISSION_RATE") ?? "0.15");

// --- Clients ----------------------------------------------------------------
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Types ------------------------------------------------------------------
type CreateCheckoutPayload = {
  user_id: string; // required
  // Option A: pass a single price_id (+ optional quantity)
  price_id?: string;
  quantity?: number;

  // Option B: pass Stripe-style line_items
  line_items?: Array<{ price: string; quantity?: number }>;

  mode?: "payment" | "subscription";
  success_url?: string;
  cancel_url?: string;

  // Optional metadata overrides
  metadata?: Record<string, string>;
};

// --- Helpers ----------------------------------------------------------------
function cors(headers: HeadersInit = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...headers,
  };
}

async function getUserAndReferrer(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, referrer_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("User not found");
  return data as { id: string; email?: string; referrer_id?: string | null };
}

// --- Server -----------------------------------------------------------------
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors() });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json", ...cors() },
    });
  }

  try {
    const body = (await req.json()) as CreateCheckoutPayload;

    if (!body?.user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { "content-type": "application/json", ...cors() },
      });
    }

    const user = await getUserAndReferrer(body.user_id);

    // Build line items
    let line_items: Stripe.Checkout.SessionCreateParams.LineItem[] | undefined;
    if (body.price_id) {
      line_items = [{ price: body.price_id, quantity: body.quantity ?? 1 }];
    } else if (Array.isArray(body.line_items) && body.line_items.length > 0) {
      line_items = body.line_items.map((li) => ({
        price: li.price,
        quantity: li.quantity ?? 1,
      }));
    } else {
      return new Response(JSON.stringify({ error: "Provide price_id or line_items" }), {
        status: 400,
        headers: { "content-type": "application/json", ...cors() },
      });
    }

    const mode: "payment" | "subscription" = (body.mode as any) ?? "payment";

    // Metadata (propagate referral + commission rate)
    const metadata: Record<string, string> = {
      user_id: String(user.id),
      referrer_id: user.referrer_id ?? "",
      commission_rate: String(
        body?.metadata?.commission_rate ? parseFloat(body.metadata.commission_rate) : DEFAULT_COMMISSION_RATE,
      ),
      source: "zamar_app",
      ...(body.metadata ?? {}),
    };

    const session = await stripe.checkout.sessions.create({
      mode,
      client_reference_id: user.id,
      customer_email: user.email, // okay if undefined
      success_url: body.success_url ?? CHECKOUT_SUCCESS_URL,
      cancel_url: body.cancel_url ?? CHECKOUT_CANCEL_URL,
      line_items,
      currency: DEFAULT_CURRENCY, // safe default for 'payment' mode; Stripe will use price currency for price-based items
      metadata,
    });

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      status: 200,
      headers: { "content-type": "application/json", ...cors() },
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "content-type": "application/json", ...cors() },
    });
  }
});