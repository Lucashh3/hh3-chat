import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PLANS, DEFAULT_SYSTEM_PROMPT } from "@/lib/plans";
import { PromptEditor } from "@/components/admin/prompt-editor";

interface StatCardProps {
  title: string;
  value: string;
  helper?: string;
}

const StatCard = ({ title, value, helper }: StatCardProps) => (
  <Card>
    <CardHeader className="space-y-2">
      <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">{title}</CardDescription>
      <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </CardHeader>
  </Card>
);

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();

  const [{ count: totalUsers }, { count: activeSubscribers }, { count: totalSessions }, { count: totalMessages }, promptSetting] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("subscription_status", "active"),
    supabase.from("chat_sessions").select("id", { count: "exact", head: true }),
    supabase.from("chats").select("id", { count: "exact", head: true }),
    supabase
      .from("admin_settings")
      .select("value, updated_at")
      .eq("key", "system_prompt")
      .maybeSingle()
  ]);

  const planCounts: Record<string, number> = {};
  const planCountsResult = await Promise.all(
    PLANS.map((plan) =>
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("active_plan", plan.id)
    )
  );
  planCountsResult.forEach((result, index) => {
    planCounts[PLANS[index].name] = result.count ?? 0;
  });

  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, active_plan, subscription_status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: recentSessions } = await supabase
    .from("chat_sessions")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(8);

  const promptValue = promptSetting?.data?.value ?? DEFAULT_SYSTEM_PROMPT;
  const promptUpdatedAt = promptSetting?.data?.updated_at ?? null;

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Badge variant="secondary" className="w-fit">
          Painel administrativo
        </Badge>
        <h1 className="text-3xl font-semibold">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o desempenho do HH3 Mentor de Roleta em tempo real e gerencie os usuários com segurança.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Usuários" value={(totalUsers ?? 0).toLocaleString("pt-BR")} helper="Total de perfis cadastrados" />
        <StatCard
          title="Assinaturas ativas"
          value={(activeSubscribers ?? 0).toLocaleString("pt-BR")}
          helper="Usuários com assinatura em status ativo"
        />
        <StatCard
          title="Chats salvos"
          value={(totalSessions ?? 0).toLocaleString("pt-BR")}
          helper="Conversas armazenadas pelos usuários"
        />
        <StatCard
          title="Mensagens"
          value={(totalMessages ?? 0).toLocaleString("pt-BR")}
          helper="Histórico total (usuários + HH3)"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prompt do HH3</CardTitle>
          <CardDescription>
            Ajuste o comportamento do mentor diretamente por aqui. Mudanças entram em vigor imediatamente nas próximas conversas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PromptEditor initialPrompt={promptValue} updatedAt={promptUpdatedAt} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de planos</CardTitle>
            <CardDescription>Entenda onde estão seus usuários e identifique oportunidades de upsell.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {PLANS.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
                <span className="font-medium">{plan.name}</span>
                <span className="text-muted-foreground">{planCounts[plan.name]?.toLocaleString("pt-BR") ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chats recentes</CardTitle>
            <CardDescription>Principais conversas retomadas nas últimas horas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {recentSessions?.length ? (
              recentSessions.map((session) => (
                <div key={session.id} className="rounded-md border bg-muted/10 px-3 py-2">
                  <p className="font-medium">{session.title ?? "Chat sem título"}</p>
                  <p className="text-xs text-muted-foreground">
                    Atualizado em {new Date(session.updated_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum chat encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos usuários cadastrados</CardTitle>
          <CardDescription>Monitore novos clientes e seus status de assinatura.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">E-mail</th>
                <th className="py-2 pr-4">Plano</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers?.length ? (
                recentUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{user.full_name ?? "Sem nome"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{user.email}</td>
                    <td className="py-2 pr-4 capitalize">{user.active_plan ?? "free"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {user.subscription_status ? user.subscription_status.toLocaleLowerCase() : "-"}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleString("pt-BR") : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    Nenhuma informação disponível.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
