"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/plans";

export interface AdminUserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  active_plan: string | null;
  subscription_status: string | null;
  cpf: string | null;
  phone: string | null;
  birth_date: string | null;
  created_at: string;
  is_blocked: boolean;
  chat_count: number;
  last_chat_at: string | null;
}

interface UsersTableProps {
  users: AdminUserRow[];
  total: number;
  blocked: number;
  active: number;
  paying: number;
  plans: Plan[];
  page: number;
  pageSize: number;
  query: string;
  planFilter: string;
  statusFilter: string;
}

interface AdminUserDetail {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    active_plan: string | null;
    subscription_status: string | null;
    cpf: string | null;
    phone: string | null;
    birth_date: string | null;
    created_at: string | null;
    is_blocked: boolean | null;
  };
  sessions: Array<{ id: string; title: string | null; updated_at: string }>;
}

export function UsersTable({
  users,
  total,
  blocked: blockedCount,
  active,
  paying,
  plans,
  page,
  pageSize,
  query,
  planFilter,
  statusFilter
}: UsersTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(users[0]?.id ?? null);
  const [search, setSearch] = useState(query);
  const [plan, setPlan] = useState(planFilter);
  const [status, setStatus] = useState(statusFilter);
  const [selectedPlan, setSelectedPlan] = useState<string>(users[0]?.active_plan ?? "free");
  const [selectedBlocked, setSelectedBlocked] = useState<boolean>(users[0]?.is_blocked ?? false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(Boolean(users[0]));
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedUserIdRef = useRef<string | null>(selectedUserId);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const planNameMap = useMemo(() => {
    const map = new Map<string, string>();
    plans.forEach((plan) => map.set(plan.id, plan.name));
    if (selectedPlan && !map.has(selectedPlan)) {
      map.set(selectedPlan, selectedPlan);
    }
    return map;
  }, [plans, selectedPlan]);

  const planOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    plans.forEach((plan) => map.set(plan.id, { id: plan.id, name: plan.name }));
    const current = selectedPlan ?? "";
    if (current && !map.has(current)) {
      map.set(current, { id: current, name: current });
    }
    return Array.from(map.values());
  }, [plans, selectedPlan]);

  useEffect(() => {
    if (plan && !plans.some((item) => item.id === plan)) {
      setPlan("");
    }
  }, [plan, plans]);

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [users, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) {
      setDrawerOpen(false);
      setDetail(null);
      return;
    }
    setDrawerOpen(true);
  }, [selectedUserId]);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;
    if (!users.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(users[0]?.id ?? null);
    }
  }, [selectedUserId, users]);

  const fetchUserDetail = useCallback(
    async (userId: string) => {
      setDetailLoading(true);
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Não foi possível carregar o usuário");
        }
        const data = (await response.json()) as AdminUserDetail;
        if (selectedUserIdRef.current !== userId) {
          return;
        }
        setDetail(data);
        setSelectedPlan(data.profile.active_plan ?? "free");
        setSelectedBlocked(Boolean(data.profile.is_blocked));
      } catch (error) {
        console.error(error);
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Não foi possível carregar os detalhes.",
          variant: "destructive"
        });
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedUserId) {
      fetchUserDetail(selectedUserId);
    }
  }, [fetchUserDetail, selectedUserId]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("q", search);
    } else {
      params.delete("q");
    }
    if (plan) {
      params.set("plan", plan);
    } else {
      params.delete("plan");
    }
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const goToPage = (nextPage: number) => {
    const safePage = Math.min(Math.max(1, nextPage), totalPages);
    const params = new URLSearchParams(searchParams);
    if (search) params.set("q", search);
    if (plan) params.set("plan", plan);
    else params.delete("plan");
    if (status) params.set("status", status);
    else params.delete("status");
    params.set("page", safePage.toString());

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams(searchParams);
      if (search) params.set("q", search);
      if (plan) params.set("plan", plan);
      if (status) params.set("status", status);
      const response = await fetch(`/api/admin/users/export?${params.toString()}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Não foi possível gerar o CSV");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `usuarios-hh3-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível gerar o CSV.",
        variant: "destructive"
      });
    }
  };

  const refreshDetail = useCallback(async () => {
    if (selectedUserId) {
      await fetchUserDetail(selectedUserId);
    }
  }, [fetchUserDetail, selectedUserId]);

  const performAction = async (action: string, payload?: Record<string, unknown>) => {
    if (!selectedUserId) return false;
    setActionLoading(action);
    let succeeded = false;
    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error ?? "Ação não pôde ser concluída");
      }

      toast({ title: "Ação concluída com sucesso" });
      succeeded = true;
      router.refresh();
      await refreshDetail();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
    return succeeded;
  };

  const handleChangePlan = () => {
    performAction("updatePlan", { plan: selectedPlan });
  };

  const handleResetPassword = () => {
    const newPassword = window.prompt("Informe uma senha temporária (mínimo 6 caracteres)");
    if (!newPassword) return;
    if (newPassword.trim().length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }
    performAction("resetPassword", { newPassword });
  };

  const handleToggleBlock = () => {
    const nextBlocked = !selectedBlocked;
    performAction("toggleBlock", { blocked: nextBlocked }).then((success) => {
      if (success) {
        setSelectedBlocked(nextBlocked);
      }
    });
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setDetail(null);
    setSelectedUserId(null);
  };

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase text-muted-foreground">Total</CardDescription>
            <CardTitle className="text-2xl">{total.toLocaleString("pt-BR")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase text-muted-foreground">Ativos</CardDescription>
            <CardTitle className="text-2xl">{active.toLocaleString("pt-BR")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase text-muted-foreground">Bloqueados</CardDescription>
            <CardTitle className="text-2xl">{blockedCount.toLocaleString("pt-BR")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase text-muted-foreground">Planos pagos</CardDescription>
            <CardTitle className="text-2xl">{paying.toLocaleString("pt-BR")}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Lista de usuários</CardTitle>
              <CardDescription>Filtre por nome, e-mail, CPF ou telefone.</CardDescription>
            </div>
            <form className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row" onSubmit={handleSearch}>
              <Input
                placeholder="Buscar usuário..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="sm:flex-1"
              />
              <select
                value={plan}
                onChange={(event) => setPlan(event.target.value)}
                className="rounded-md border bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Todos os planos</option>
                {plans.map((planOption) => (
                  <option key={planOption.id} value={planOption.id}>
                    {planOption.name}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-md border bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Todos os status</option>
                <option value="active">Ativa</option>
                <option value="trialing">Teste</option>
                <option value="past_due">Pagamento em atraso</option>
                <option value="canceled">Cancelada</option>
                <option value="blocked">Bloqueada</option>
              </select>
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  Buscar
                </Button>
                <Button type="button" variant="outline" onClick={exportCsv}>
                  Exportar CSV
                </Button>
              </div>
            </form>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">E-mail</th>
                <th className="py-2 pr-4">Plano</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Chats</th>
                <th className="py-2">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((user) => {
                  const activeRow = selectedUserId === user.id;
                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "cursor-pointer border-b last:border-0 transition hover:bg-muted/50",
                        activeRow && "bg-muted/50"
                      )}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <td className="py-2 pr-4 font-medium">{user.full_name ?? "Sem nome"}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{user.email ?? "-"}</td>
                      <td className="py-2 pr-4">
                        {planNameMap.get(user.active_plan ?? "") ?? user.active_plan ?? "free"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {user.is_blocked
                          ? "bloqueado"
                          : user.subscription_status
                          ? user.subscription_status.toLowerCase()
                          : "-"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {user.chat_count} {user.chat_count === 1 ? "chat" : "chats"}
                      </td>
                      <td className="py-2 text-muted-foreground">{formatDate(user.created_at)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Mostrando {users.length} de {total.toLocaleString("pt-BR")} usuários
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1 || isPending}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || isPending}
            >
              Próxima
            </Button>
          </div>
        </CardFooter>
      </Card>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={handleCloseDrawer} />
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col border-l bg-card shadow-xl">
            <header className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Detalhes do usuário</h2>
                {selectedUser && (
                  <p className="text-xs text-muted-foreground">{selectedUser.email ?? "Sem e-mail"}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseDrawer}>
                Fechar
              </Button>
            </header>
            <div className="flex-1 overflow-y-auto p-5 text-sm">
              {detailLoading ? (
                <p className="text-muted-foreground">Carregando dados...</p>
              ) : detail ? (
                <div className="space-y-5">
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Identificação</h3>
                    <p>
                      <span className="font-medium">Nome:</span> {detail.profile.full_name ?? "Sem registro"}
                    </p>
                    <p>
                      <span className="font-medium">CPF:</span> {detail.profile.cpf ?? "-"}
                    </p>
                    <p>
                      <span className="font-medium">Celular:</span> {detail.profile.phone ?? "-"}
                    </p>
                    <p>
                      <span className="font-medium">Nascimento:</span> {formatDate(detail.profile.birth_date)}
                    </p>
                    <p>
                      <span className="font-medium">Conta criada em:</span> {formatDate(detail.profile.created_at)}
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Plano e status</h3>
                    <p>
                      <span className="font-medium">Plano atual:</span> {planNameMap.get(detail.profile.active_plan ?? "") ?? detail.profile.active_plan ?? "free"}
                    </p>
                    <p>
                      <span className="font-medium">Status assinatura:</span>{" "}
                      {detail.profile.is_blocked
                        ? "bloqueado"
                        : detail.profile.subscription_status
                        ? detail.profile.subscription_status.toLowerCase()
                        : "-"}
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Ações</h3>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Plano do usuário</label>
                    <select
                      value={selectedPlan ?? "free"}
                      onChange={(event) => setSelectedPlan(event.target.value)}
                      className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                      disabled={Boolean(actionLoading)}
                    >
                      {planOptions.map((planOption) => (
                        <option key={planOption.id} value={planOption.id}>
                          {planOption.name}
                        </option>
                      ))}
                    </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleChangePlan}
                        disabled={Boolean(actionLoading) || !selectedUserId}
                      >
                        {actionLoading === "updatePlan" ? "Aplicando..." : "Atualizar plano"}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetPassword}
                        disabled={Boolean(actionLoading) || !selectedUserId}
                      >
                        {actionLoading === "resetPassword" ? "Processando..." : "Resetar senha"}
                      </Button>
                      <Button
                        variant={selectedBlocked ? "outline" : "destructive"}
                        size="sm"
                        disabled={Boolean(actionLoading) || !selectedUserId}
                        onClick={handleToggleBlock}
                      >
                        {actionLoading === "toggleBlock"
                          ? "Processando..."
                          : selectedBlocked
                          ? "Desbloquear usuário"
                          : "Bloquear usuário"}
                      </Button>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Chats recentes</h3>
                    {detail.sessions.length ? (
                      <div className="space-y-2">
                        {detail.sessions.map((session) => (
                          <div key={session.id} className="rounded border bg-muted/20 px-3 py-2">
                            <p className="font-medium">{session.title ?? "Chat sem título"}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(session.updated_at)}</p>
                            <Button asChild variant="outline" size="sm" className="mt-2">
                              <Link href={`/chat?chatId=${session.id}`}>Abrir no chat</Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sem conversas registradas.</p>
                    )}
                  </section>
                </div>
              ) : (
                <p className="text-muted-foreground">Selecione um usuário na tabela para visualizar os detalhes.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
