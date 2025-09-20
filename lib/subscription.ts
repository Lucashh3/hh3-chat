import type { Database } from "@/types/database";

export type SubscriptionStatus = Database["public"]["Tables"]["profiles"]["Row"]["subscription_status"];

export interface SubscriptionGateResult {
  isActive: boolean;
  reason?: string;
}

const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "trialing"];

export const checkSubscriptionStatus = (profile: Database["public"]["Tables"]["profiles"]["Row"] | null): SubscriptionGateResult => {
  if (!profile) {
    return { isActive: false, reason: "Nenhum perfil encontrado" };
  }

  if (profile.active_plan === "free") {
    return { isActive: true };
  }

  if (!profile.subscription_status) {
    return { isActive: false, reason: "Assinatura não encontrada" };
  }

  return {
    isActive: ACTIVE_STATUSES.includes(profile.subscription_status),
    reason: ACTIVE_STATUSES.includes(profile.subscription_status)
      ? undefined
      : "Assinatura inativa"
  };
};
