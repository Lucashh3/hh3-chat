"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import type { Plan, PlanId } from "@/lib/plans";

interface SubscriptionActionsProps {
  currentPlan: PlanId;
  plans: Plan[];
}

export function SubscriptionActions({ currentPlan, plans }: SubscriptionActionsProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | "portal" | null>(null);

  const handlePlanChange = async (plan: PlanId) => {
    setLoadingPlan(plan);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível atualizar o plano");
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const openPortal = async () => {
    setLoadingPlan("portal");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível abrir o portal");
      }
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {plans.map((plan) => (
        <Button
          key={plan.id}
          variant={plan.id === currentPlan ? "default" : "outline"}
          onClick={() => handlePlanChange(plan.id)}
          disabled={loadingPlan !== null}
        >
          {loadingPlan === plan.id ? "Processando..." : plan.name}
        </Button>
      ))}
      <Button variant="ghost" onClick={openPortal} disabled={loadingPlan !== null}>
        {loadingPlan === "portal" ? "Carregando..." : "Gerenciar assinatura"}
      </Button>
    </div>
  );
}
