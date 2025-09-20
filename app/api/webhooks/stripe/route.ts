import Stripe from "stripe";
import { NextResponse } from "next/server";

import { resolvePlanFromPriceId, stripe } from "@/lib/stripe";
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string | null;
      const subscriptionId = session.subscription as string | null;
      const userId = session.metadata?.userId;
      const plan = resolvePlanFromPriceId(session.metadata?.plan ?? null);

      if (customerId && subscriptionId && userId) {
        await (supabase.from("profiles") as any)
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            active_plan: plan ?? "pro"
          })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.created":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = resolvePlanFromPriceId(priceId);

      await (supabase.from("profiles") as any)
        .update({
          active_plan: plan ?? "pro",
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status as any
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
