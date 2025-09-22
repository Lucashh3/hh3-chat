import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/plans";
import { fetchActivePlans } from "@/lib/plan-service";
import { PromptEditor } from "@/components/admin/prompt-editor";
import { Sparkline } from "@/components/admin/sparkline";

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

type PromptUsageDailyRow = {
  day: string;
  total_calls: number;
  avg_duration_ms: number | null;
  success_calls: number;
  failed_calls: number;
};

type SignupDailyRow = {
  day: string;
  total_signups: number;
  paid_signups: number;
};

type ChatActivityDailyRow = {
  day: string;
  user_messages: number;
  assistant_messages: number;
};

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();

  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { count: totalSessions },
    { count: totalMessages },
    promptSetting,
    promptHistorySetting
  ] = await Promise.all([
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
      .maybeSingle(),
    supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "system_prompt_history")
      .maybeSingle()
  ]);

  const plans = await fetchActivePlans();

  const planCounts: Record<string, number> = {};
  const planCountsResult = await Promise.all(
    plans.map((plan) =>
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("active_plan", plan.id)
    )
  );
  planCountsResult.forEach((result, index) => {
    planCounts[plans[index].id] = result.count ?? 0;
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

  const [
    promptUsageDailyResult,
    signupDailyResult,
    chatActivityResult
  ] = await Promise.all([
    supabase
      .from("prompt_usage_daily")
      .select("day, total_calls, avg_duration_ms, success_calls, failed_calls")
      .order("day", { ascending: false })
      .limit(14),
    supabase
      .from("profiles_signups_daily")
      .select("day, total_signups, paid_signups")
      .order("day", { ascending: false })
      .limit(14),
    supabase
      .from("chat_activity_daily")
      .select("day, user_messages, assistant_messages")
      .order("day", { ascending: false })
      .limit(14)
  ]);

  [promptUsageDailyResult.error, signupDailyResult.error, chatActivityResult.error]
    .forEach((error) => {
      if (error) {
        console.error(error);
      }
    });

  const promptUsageDaily = (promptUsageDailyResult.data as PromptUsageDailyRow[] | null) ?? [];
  const promptUsageLatest = promptUsageDaily.slice(0, 7).reverse();

  const signupsDaily = ((signupDailyResult.data as SignupDailyRow[] | null) ?? []).slice(0, 14).reverse();
  const totalSignupsLast14 = signupsDaily.reduce((sum, row) => sum + (row.total_signups ?? 0), 0);
  const totalPaidLast14 = signupsDaily.reduce((sum, row) => sum + (row.paid_signups ?? 0), 0);
  const conversionRateLast14 = totalSignupsLast14
    ? Math.round((totalPaidLast14 / totalSignupsLast14) * 100 * 10) / 10
    : 0;
  const lastSignupDay = signupsDaily.at(-1);

  const signupSeries = signupsDaily.map((row) => row.total_signups ?? 0);
  const paidSeries = signupsDaily.map((row) => row.paid_signups ?? 0);

  const chatActivityDaily = ((chatActivityResult.data as ChatActivityDailyRow[] | null) ?? [])
    .slice(0, 14)
    .reverse();
  const assistantMessageSeries = chatActivityDaily.map((row) => row.assistant_messages ?? 0);
  const userMessageSeries = chatActivityDaily.map((row) => row.user_messages ?? 0);

  const parseHistory = (value?: string | null) => {
    if (!value) return [] as { prompt: string; updatedAt: string | null }[];
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((entry) => typeof entry === "object" && entry && typeof entry.prompt === "string")
        .map((entry) => ({
          prompt: entry.prompt as string,
          updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : null
        }));
    } catch (error) {
      console.error("Falha ao interpretar histórico do prompt", error);
      return [] as { prompt: string; updatedAt: string | null }[];
    }
  };

  const promptValue = typeof promptSetting?.data?.value === "string" ? promptSetting.data.value : DEFAULT_SYSTEM_PROMPT;
  const promptUpdatedAt = promptSetting?.data?.updated_at ?? null;
  const promptHistory = parseHistory(promptHistorySetting?.data?.value ?? null);
  const formatDayLabel = (value: string) =>
    new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    });
  const promptCallsLast7 = promptUsageLatest.reduce((sum, row) => sum + (row.total_calls ?? 0), 0);
  const promptFailuresLast7 = promptUsageLatest.reduce((sum, row) => sum + (row.failed_calls ?? 0), 0);
  const promptAvgLatencyLast7 = promptUsageLatest.length
    ? Math.round(
        promptUsageLatest.reduce((sum, row) => sum + (row.avg_duration_ms ?? 0), 0) /
          promptUsageLatest.length
      )
    : null;

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
          <PromptEditor initialPrompt={promptValue} updatedAt={promptUpdatedAt} history={promptHistory} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de planos</CardTitle>
            <CardDescription>Entenda onde estão seus usuários e identifique oportunidades de upsell.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
                <span className="font-medium">{plan.name}</span>
                <span className="text-muted-foreground">{planCounts[plan.id]?.toLocaleString("pt-BR") ?? 0}</span>
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

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Novos cadastros</CardTitle>
            <CardDescription>Últimos 14 dias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Sparkline data={signupSeries} className="text-primary" />
            <div className="grid gap-2 text-sm">
              <p className="flex items-center justify-between">
                <span>Total no período</span>
                <span className="font-semibold">{totalSignupsLast14.toLocaleString("pt-BR")}</span>
              </p>
              <p className="flex items-center justify-between text-muted-foreground">
                <span>Último dia ({lastSignupDay ? formatDayLabel(lastSignupDay.day) : "-"})</span>
                <span>{(lastSignupDay?.total_signups ?? 0).toLocaleString("pt-BR")}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Conversões para planos pagos</CardTitle>
            <CardDescription>Novos clientes Pro/VIP nos últimos 14 dias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Sparkline data={paidSeries} className="text-emerald-500" />
            <div className="grid gap-2 text-sm">
              <p className="flex items-center justify-between">
                <span>Total pagos no período</span>
                <span className="font-semibold">{totalPaidLast14.toLocaleString("pt-BR")}</span>
              </p>
              <p className="flex items-center justify-between text-muted-foreground">
                <span>Taxa de conversão (14 dias)</span>
                <span>{conversionRateLast14.toLocaleString("pt-BR")}%</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Mensagens por dia</CardTitle>
            <CardDescription>Comparativo usuários vs HH3 (14 dias)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="mb-1 text-xs uppercase text-muted-foreground">Usuários</p>
              <Sparkline data={userMessageSeries} className="text-sky-500" />
            </div>
            <div>
              <p className="mb-1 text-xs uppercase text-muted-foreground">HH3</p>
              <Sparkline data={assistantMessageSeries} className="text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uso do prompt DeepSeek</CardTitle>
            <CardDescription>Resumo das últimas 7 janelas diárias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-xs">
              <span className="flex items-center justify-between">
                <span>Chamadas</span>
                <span className="font-semibold">{promptCallsLast7.toLocaleString("pt-BR")}</span>
              </span>
              <span className="flex items-center justify-between">
                <span>Falhas</span>
                <span>{promptFailuresLast7.toLocaleString("pt-BR")}</span>
              </span>
              <span className="flex items-center justify-between">
                <span>Latência média</span>
                <span>{promptAvgLatencyLast7 !== null ? `${promptAvgLatencyLast7} ms` : "-"}</span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-xs">
                <thead className="text-left uppercase text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-4">Dia</th>
                    <th className="py-2 pr-4">Chamadas</th>
                    <th className="py-2 pr-4">Sucesso</th>
                    <th className="py-2 pr-4">Falhas</th>
                    <th className="py-2">Latência média</th>
                  </tr>
                </thead>
                <tbody>
                  {promptUsageLatest.length ? (
                    promptUsageLatest.map((row) => (
                      <tr key={row.day} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{formatDayLabel(row.day)}</td>
                        <td className="py-2 pr-4">{row.total_calls.toLocaleString("pt-BR")}</td>
                        <td className="py-2 pr-4 text-emerald-600">{row.success_calls.toLocaleString("pt-BR")}</td>
                        <td className="py-2 pr-4 text-destructive">{row.failed_calls.toLocaleString("pt-BR")}</td>
                        <td className="py-2 text-muted-foreground">
                          {row.avg_duration_ms !== null ? `${Math.round(row.avg_duration_ms)} ms` : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-muted-foreground">
                        Nenhum dado registrado nos últimos dias.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
