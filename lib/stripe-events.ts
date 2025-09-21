import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { resolvePlanFromPriceId } from "@/lib/stripe";

export async function applyStripeEvent(event: Stripe.Event, supabase: SupabaseClient<Database>) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string | null;
      const subscriptionId = session.subscription as string | null;
      const userId = session.metadata?.userId;
      const plan = await resolvePlanFromPriceId(session.metadata?.plan ?? null);

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
      const plan = await resolvePlanFromPriceId(priceId);

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
}
