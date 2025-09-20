import { NextResponse } from "next/server";

import { getPriceIdForPlan, stripe } from "@/lib/stripe";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import type { PlanId } from "@/lib/plans";

export async function POST(request: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { plan }: { plan: PlanId } = await request.json();

  if (!plan) {
    return NextResponse.json({ error: "Plano não informado" }, { status: 400 });
  }

  // Plano free não passa pelo Stripe, apenas atualiza o perfil no Supabase
  if (plan === "free") {
    await supabase
      .from("profiles")
      .update({
        active_plan: "free",
        subscription_status: "active",
        stripe_subscription_id: null
      })
      .eq("id", session.user.id);

    return NextResponse.json({ redirectUrl: "/dashboard?status=free" });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe não configurado" }, { status: 500 });
  }

  const priceId = getPriceIdForPlan(plan);

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", session.user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({ email: session.user.email ?? undefined });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", session.user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?status=success`,
    cancel_url: `${appUrl}/dashboard?status=cancelled`,
    metadata: {
      userId: session.user.id,
      plan
    }
  });

  return NextResponse.json({ redirectUrl: checkoutSession.url });
}
