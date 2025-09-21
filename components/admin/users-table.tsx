"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
  chat_count: number;
  last_chat_at: string | null;
}

interface UsersTableProps {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}

export function UsersTable({ users, total, page, pageSize, query }: UsersTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(users[0]?.id ?? null);
  const [search, setSearch] = useState(query);
  const [selectedPlan, setSelectedPlan] = useState<string>(users[0]?.active_plan ?? "free");
  const [actionLoading, setActionLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [users, selectedUserId]);

  useEffect(() => {
    setSelectedPlan(selectedUser?.active_plan ?? "free");
  }, [selectedUser]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("q", search);
    } else {
      params.delete("q");
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
    params.set("page", safePage.toString());

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const performAction = async (action: string, payload?: Record<string, unknown>) => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error ?? "Ação não pôde ser concluída");
      }

      toast({ title: "Ação concluída com sucesso" });
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
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

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1.2fr]">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Lista de usuários</CardTitle>
              <CardDescription>Filtre por nome, e-mail, CPF ou telefone.</CardDescription>
            </div>
            <form className="flex w-full max-w-sm items-center gap-2" onSubmit={handleSearch}>
              <Input
                placeholder="Buscar usuário..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Button type="submit" disabled={isPending}>
                Buscar
              </Button>
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
                  const active = selectedUserId === user.id;
                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "cursor-pointer border-b last:border-0 transition hover:bg-muted/50",
                        active && "bg-muted/50"
                      )}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <td className="py-2 pr-4 font-medium">{user.full_name ?? "Sem nome"}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{user.email ?? "-"}</td>
                      <td className="py-2 pr-4 capitalize">{user.active_plan ?? "free"}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {user.subscription_status ? user.subscription_status.toLowerCase() : "-"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {user.chat_count} {user.chat_count === 1 ? "chat" : "chats"}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </td>
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

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Detalhes do usuário</CardTitle>
          <CardDescription>Resumo das informações e atividades recentes.</CardDescription>
        </CardHeader>
        {selectedUser ? (
          <CardContent className="space-y-4 text-sm">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Identificação</h3>
              <p>
                <span className="font-medium">Nome:</span> {selectedUser.full_name ?? "Sem registro"}
              </p>
              <p>
                <span className="font-medium">E-mail:</span> {selectedUser.email ?? "-"}
              </p>
              <p>
                <span className="font-medium">CPF:</span> {selectedUser.cpf ?? "-"}
              </p>
              <p>
                <span className="font-medium">Celular:</span> {selectedUser.phone ?? "-"}
              </p>
              <p>
                <span className="font-medium">Nascimento:</span>{" "}
                {selectedUser.birth_date ? new Date(selectedUser.birth_date).toLocaleDateString("pt-BR") : "-"}
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Plano e status</h3>
              <p>
                <span className="font-medium">Plano:</span> {selectedUser.active_plan ?? "free"}
              </p>
              <p>
                <span className="font-medium">Status assinatura:</span>{" "}
                {selectedUser.subscription_status ? selectedUser.subscription_status.toLowerCase() : "-"}
              </p>
              <p>
                <span className="font-medium">Criado em:</span> {new Date(selectedUser.created_at).toLocaleDateString("pt-BR")}
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Interações</h3>
              <p>
                <span className="font-medium">Total de chats:</span> {selectedUser.chat_count}
              </p>
              <p>
                <span className="font-medium">Último chat:</span>{" "}
                {selectedUser.last_chat_at
                  ? new Date(selectedUser.last_chat_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "Sem histórico"}
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
                  disabled={actionLoading}
                >
                  <option value="free">Iniciante HH3</option>
                  <option value="pro">Mentoria Pro</option>
                  <option value="vip">Mentoria Elite</option>
                </select>
                <Button variant="outline" size="sm" onClick={handleChangePlan} disabled={actionLoading}>
                  {actionLoading ? "Aplicando..." : "Atualizar plano"}
                </Button>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={actionLoading}>
                  {actionLoading ? "Processando..." : "Resetar senha"}
                </Button>
                <Button variant="destructive" size="sm" disabled>
                  Bloquear usuário (em breve)
                </Button>
              </div>
            </section>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">Selecione um usuário na tabela para ver os detalhes.</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
