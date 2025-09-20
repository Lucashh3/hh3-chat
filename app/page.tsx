import Link from "next/link";

import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLANS } from "@/lib/plans";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const FEATURE_ITEMS = [
  {
    title: "Copiloto em tempo real",
    description: "Obtenha respostas consistentes usando o modelo DeepSeek com prompt otimizado para o seu negócio."
  },
  {
    title: "Histórico inteligente",
    description: "Cada usuário possui histórico isolado com persistência no Supabase e busca contextual."
  },
  {
    title: "Planos flexíveis",
    description: "Monetize com planos mensais integrados ao Stripe para upgrade, downgrade e cancelamento."
  }
];

export default async function LandingPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar authenticated={Boolean(session)} />
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-8 py-20 text-center">
          <Badge variant="secondary">Seu copiloto de IA com monetização pronta</Badge>
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Construa um agente de IA com assinatura em minutos
            </h1>
            <p className="text-lg text-muted-foreground">
              Ofereça um chat alimentado pelo DeepSeek com autenticação Supabase e pagamentos Stripe. Gestão de planos e histórico isolado para cada usuário.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/register">Criar conta gratuita</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/login">Já tenho conta</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="border-t bg-muted/30 py-16">
          <div className="container grid gap-6 md:grid-cols-3">
            {FEATURE_ITEMS.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="pricing" className="container py-20">
          <div className="text-center">
            <Badge variant="secondary">Planos para todos os estágios</Badge>
            <h2 className="mt-4 text-3xl font-semibold">Escolha o plano ideal</h2>
            <p className="mt-2 text-muted-foreground">
              Assinaturas recorrentes via Stripe com upgrade e downgrade instantâneo.
            </p>
          </div>
          <Tabs defaultValue="monthly" className="mt-10 flex flex-col gap-6">
            <TabsList className="self-center">
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="yearly">Anual</TabsTrigger>
            </TabsList>
            <TabsContent value="monthly" className="grid gap-6 md:grid-cols-3">
              {PLANS.map((plan) => (
                <PlanCard key={plan.id} plan={plan} billingCycle="monthly" />
              ))}
            </TabsContent>
            <TabsContent value="yearly" className="grid gap-6 md:grid-cols-3">
              {PLANS.map((plan) => (
                <PlanCard key={plan.id} plan={plan} billingCycle="yearly" />
              ))}
            </TabsContent>
          </Tabs>
        </section>

        <section id="how-it-works" className="border-t py-16">
          <div className="container grid gap-8 md:grid-cols-3">
            {[
              {
                title: "1. Crie sua conta",
                description: "Autenticação Supabase com magic link ou email e senha."
              },
              {
                title: "2. Assine um plano",
                description: "Stripe Checkout garante cobrança segura e atualização em tempo real."
              },
              {
                title: "3. Converse com a IA",
                description: "Chat estilo ChatGPT com streaming e histórico salvo."
              }
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} HH3. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link className="hover:text-foreground" href="#pricing">
              Planos
            </Link>
            <Link className="hover:text-foreground" href="mailto:contato@hh3.com">
              Contato
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface PlanCardProps {
  plan: (typeof PLANS)[number];
  billingCycle: "monthly" | "yearly";
}

function PlanCard({ plan, billingCycle }: PlanCardProps) {
  const price = billingCycle === "yearly" && plan.priceYearly ? plan.priceYearly : plan.priceMonthly * (billingCycle === "yearly" ? 10 : 1);

  return (
    <Card className={plan.id === "pro" ? "border-primary shadow-lg" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-2xl">
          {plan.name}
          {plan.id === "pro" && <Badge>Popular</Badge>}
        </CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {plan.priceMonthly === 0 && billingCycle === "monthly"
            ? "Gratuito"
            : `R$ ${price.toFixed(0)}/${billingCycle === "monthly" ? "mês" : "ano"}`}
        </div>
        <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
          {plan.features.map((feature) => (
            <li key={feature}> {feature}</li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href={`/auth/register?plan=${plan.id}`}>Começar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
