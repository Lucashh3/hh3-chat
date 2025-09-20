import Stripe from "stripe";

import { PLANS, getPlanById, type PlanId } from "@/lib/plans";

const apiVersion: Stripe.LatestApiVersion = "2024-04-10";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.warn("STRIPE_SECRET_KEY is not set. Stripe client will throw if used.");
}

export const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion })
  : (undefined as unknown as Stripe);

export const getPriceIdForPlan = (plan: PlanId) => {
  const config = getPlanById(plan);
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

export const resolvePlanFromPriceId = (priceId: string | null | undefined): PlanId | null => {
  if (!priceId) return null;
  const plan = PLANS.find((plan) => plan.stripePriceId === priceId);
  return plan?.id ?? null;
};
