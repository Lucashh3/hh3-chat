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
    title: "Leitura de zonas em segundos",
    description: "HH3 identifica o setor mais quente da roleta europeia analisando suas últimas jogadas."
  },
  {
    title: "Mentoria contextual contínua",
    description: "Receba justificativas claras do Método 3 diretamente no chat, 24 horas por dia."
  },
  {
    title: "Gestão disciplinada de banca",
    description: "Acompanhe entradas, histórico e lembretes para seguir o método HH3 sem desvios."
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
        <section className="container flex flex-col items-center justify-center gap-8 px-4 py-16 text-center sm:px-6 sm:py-20">
          <Badge variant="secondary">Mentoria HH3 de Roleta Europeia</Badge>
          <div className="max-w-3xl space-y-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Transforme cada giro com o mentor HH3 no seu chat
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              HH3, especialista em roleta europeia, compartilha o Método 3 – Estratégia de Zonas diretamente no chat.
              Envie a sequência mais recente e receba o alvo ideal com cobertura, vizinhos e avaliação do sinal.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/auth/register">Liberar acesso gratuito</Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/auth/login">Já estudo com o HH3</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="border-t bg-muted/30 py-12 sm:py-16">
          <div className="container grid gap-6 px-4 sm:px-6 md:grid-cols-3">
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

        <section id="pricing" className="container px-4 py-16 sm:px-6 sm:py-20">
          <div className="space-y-2 text-center">
            <Badge variant="secondary">Escolha o nível de mentoria</Badge>
            <h2 className="mt-4 text-3xl font-semibold">Planos do método HH3</h2>
            <p className="mt-2 text-muted-foreground">Assinaturas recorrentes com upgrade instantâneo para liberar mais análises e suporte.</p>
          </div>
          <Tabs defaultValue="monthly" className="mt-10 flex flex-col gap-6">
            <TabsList className="self-center flex-wrap gap-2">
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="yearly">Anual</TabsTrigger>
            </TabsList>
            <TabsContent value="monthly" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <PlanCard key={plan.id} plan={plan} billingCycle="monthly" />
              ))}
            </TabsContent>
            <TabsContent value="yearly" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <PlanCard key={plan.id} plan={plan} billingCycle="yearly" />
              ))}
            </TabsContent>
          </Tabs>
        </section>

        <section id="how-it-works" className="border-t py-12 sm:py-16">
          <div className="container grid gap-8 px-4 sm:px-6 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                title: "1. Ative seu acesso HH3",
                description: "Crie a conta e confirme o e-mail para desbloquear a mentoria guiada."
              },
              {
                title: "2. Selecione o nível de acompanhamento",
                description: "Escolha o plano que libera sequências ilimitadas, histórico e suporte dedicado."
              },
              {
                title: "3. Envie a sequência e execute",
                description: "Cole os últimos resultados e receba alvo, vizinhos e leitura do sinal em segundos."
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
        <div className="container flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:px-6 md:flex-row">
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
        <CardTitle className="flex flex-col items-start justify-between gap-2 text-left text-2xl sm:flex-row sm:items-center">
          <span>{plan.name}</span>
          {plan.id === "pro" && <Badge className="w-fit">Popular</Badge>}
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
            <li key={feature}>- {feature}</li>
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
