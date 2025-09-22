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

  return { isActive: true };
};
