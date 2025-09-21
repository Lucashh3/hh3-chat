import Link from "next/link";
import { redirect } from "next/navigation";

import { SubscriptionActions } from "@/components/dashboard/subscription-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchActivePlans } from "@/lib/plan-service";
import { checkSubscriptionStatus } from "@/lib/subscription";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  const subscription = checkSubscriptionStatus(profile ?? null);

  const { data: recentMessages } = await supabase
    .from("chats")
    .select("id, role, content, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const currentPlan = profile?.active_plan ?? "free";
  const plans = await fetchActivePlans();
  const planDetails = plans.find((plan) => plan.id === currentPlan);

  return (
    <div className="container grid gap-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Bem-vindo, {profile?.full_name ?? session.user.email}</h1>
        <p className="text-muted-foreground">
          Acompanhe sua jornada com o mentor HH3: planos, histórico de sequências e o chat de estratégia.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Seu plano atual</CardTitle>
            <CardDescription>
              Status: {subscription.isActive ? "Ativo" : "Inativo"}
              {searchParams?.subscription === "inactive" && "  Assine um plano para usar o chat."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-lg font-semibold capitalize">{planDetails?.name ?? currentPlan}</p>
              <p className="text-sm text-muted-foreground">{planDetails?.description}</p>
            </div>
            <SubscriptionActions currentPlan={currentPlan} plans={plans} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mentoria com HH3</CardTitle>
            <CardDescription>Gerencie sua assinatura ou retome a última análise de roleta.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/chat">Abrir chat com HH3</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Revisar o método</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico recente</CardTitle>
          <CardDescription>Leituras registradas pelo HH3 para suas últimas sequências.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-80">
            <div className="space-y-4">
              {recentMessages?.length ? (
                recentMessages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      {new Date(message.created_at).toLocaleString("pt-BR")}
                    </div>
                    <div className="rounded-md border bg-muted/40 p-3 text-sm">
                      <span className="font-semibold capitalize">{message.role}:</span> {message.content}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem mensagens ainda.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
