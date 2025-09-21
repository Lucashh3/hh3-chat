import Stripe from "stripe";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { applyStripeEvent } from "@/lib/stripe-events";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook signature missing" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    if (!stripe) {
      throw new Error("Stripe client not initialized");
    }
    // Verifica a assinatura do webhook para garantir que o evento veio do Stripe
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const eventPayload = JSON.parse(JSON.stringify(event));

  let status: "processed" | "error" = "processed";
  let errorMessage: string | null = null;

  try {
    await applyStripeEvent(event, supabase);
  } catch (error) {
    status = "error";
    errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Stripe webhook processing failed", error);
  }

  try {
    await supabase
      .from("stripe_webhook_events")
      .upsert(
        {
          stripe_event_id: event.id,
          type: event.type,
          status,
          error_message: errorMessage,
          payload: eventPayload,
          processed_at: status === "processed" ? new Date().toISOString() : null
        },
        { onConflict: "stripe_event_id" }
      );
  } catch (logError) {
    console.error("Failed to persist Stripe webhook event", logError);
  }

  if (status === "error") {
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
