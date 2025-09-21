import { notFound } from "next/navigation";

import { PlanSettings } from "@/components/admin/plan-settings";
import { getEnvHealth } from "@/lib/env/health";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminSettingsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    notFound();
  }

  const { data: plans, error } = await supabase
    .from("plans")
    .select("id, name, description, price_monthly, price_yearly, stripe_price_id, features, is_active, sort_order, updated_at")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) {
    console.error(error);
    notFound();
  }

  const envStatuses = getEnvHealth();

  return <PlanSettings initialPlans={plans ?? []} initialEnv={envStatuses} />;
}
