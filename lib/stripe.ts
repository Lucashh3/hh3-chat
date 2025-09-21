import Stripe from "stripe";

import type { Plan, PlanId } from "@/lib/plans";
import { fetchPlanById, fetchPlanByStripePrice } from "@/lib/plan-service";

const apiVersion: Stripe.LatestApiVersion = "2024-04-10";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.warn("STRIPE_SECRET_KEY is not set. Stripe client will throw if used.");
}

export const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion })
  : (undefined as unknown as Stripe);

export const getPriceIdForPlan = async (plan: PlanId, override?: Plan | null) => {
  const config = override ?? (await fetchPlanById(plan));
  if (!config?.stripePriceId) {
    throw new Error(`Stripe price id missing for plan ${plan}`);
  }
  return config.stripePriceId;
};

export const getPortalUrl = async (customerId: string, returnUrl: string) => {
  if (!stripe) {
    throw new Error("Stripe client is not initialized");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });

  return session.url;
};

export const resolvePlanFromPriceId = async (priceId: string | null | undefined): Promise<PlanId | null> => {
  if (!priceId) return null;
  const plan = await fetchPlanByStripePrice(priceId);
  return plan?.id ?? null;
};
