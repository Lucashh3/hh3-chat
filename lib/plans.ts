export type PlanId = "free" | "pro" | "vip";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly?: number;
  stripePriceId: string | null;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Ideal para experimentar o agente com limites reduzidos.",
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceId: null,
    features: [
      "10 mensagens por dia",
      "Histórico básico",
      "Resposta padrão do modelo"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para profissionais que precisam de um copiloto diário.",
    priceMonthly: 29,
    priceYearly: 290,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
    features: [
      "Mensagens ilimitadas",
      "Histórico persistido",
      "Respostas priorizadas"
    ]
  },
  {
    id: "vip",
    name: "VIP",
    description: "Atendimento premium com suporte dedicado.",
    priceMonthly: 79,
    priceYearly: 790,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_VIP_PRICE_ID || "price_vip_placeholder",
    features: [
      "Suporte prioritário",
      "Modelos experimentais",
      "Integrações extras"
    ]
  }
];

export const getPlanById = (planId: PlanId) => PLANS.find((plan) => plan.id === planId);

export const DEFAULT_SYSTEM_PROMPT = `Você é o DeepSeek Copilot da HH3, um assistente técnico e amistoso. Sempre produza respostas claras, concisas e contextualizadas em português brasileiro.`;
