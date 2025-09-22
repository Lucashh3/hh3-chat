import { DEFAULT_PLANS, type Plan, type PlanId } from "@/lib/plans";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const mapPlanRow = (row: {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number | null;
  features: string[] | null;
  sort_order?: number | null;
}) => {
  const plan: Plan = {
    id: row.id,
    name: row.name,
    description: row.description,
    priceMonthly: Number(row.price_monthly ?? 0),
    priceYearly: row.price_yearly !== null && row.price_yearly !== undefined ? Number(row.price_yearly) : undefined,
    features: Array.isArray(row.features) ? row.features : []
  };

  return plan;
};

export const fetchActivePlans = async (): Promise<Plan[]> => {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("active_plans")
      .select("id, name, description, price_monthly, price_yearly, features, sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Failed to fetch plans from database", error);
      return DEFAULT_PLANS;
    }

    if (!data || data.length === 0) {
      return DEFAULT_PLANS;
    }

    return data.map(mapPlanRow);
  } catch (error) {
    console.error("Unexpected error loading plans", error);
    return DEFAULT_PLANS;
  }
};

export const fetchPlanById = async (planId: PlanId): Promise<Plan | undefined> => {
  const plans = await fetchActivePlans();
  return plans.find((plan) => plan.id === planId) ?? DEFAULT_PLANS.find((plan) => plan.id === planId);
};
