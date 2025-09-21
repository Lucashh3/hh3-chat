import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface PageProps {
  params: { id: string };
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const userId = params.id;

  const [{ data: profile }, { data: sessions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, active_plan, subscription_status, cpf, phone, birth_date, is_blocked, created_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
  ]);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resumo do usuário</h1>
          {profile && <p className="text-sm text-muted-foreground">{profile.email}</p>}
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/users">← Voltar para a lista</Link>
        </Button>
      </div>

      {profile ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados pessoais</CardTitle>
              <CardDescription>Informações sincronizadas com o cadastro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Nome:</span> {profile.full_name ?? "-"}
              </p>
              <p>
                <span className="font-medium">CPF:</span> {profile.cpf ?? "-"}
              </p>
              <p>
                <span className="font-medium">Celular:</span> {profile.phone ?? "-"}
              </p>
              <p>
                <span className="font-medium">Nascimento:</span>{" "}
                {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString("pt-BR") : "-"}
              </p>
              <p>
                <span className="font-medium">Conta criada em:</span>{" "}
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR") : "-"}
              </p>
              <p>
                <span className="font-medium">Status assinatura:</span>{" "}
                {profile.is_blocked
                  ? "bloqueado"
                  : profile.subscription_status
                  ? profile.subscription_status.toLowerCase()
                  : "-"}
              </p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>Chats recentes</CardTitle>
              <CardDescription>Últimas conversas registradas pelo usuário.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-80 pr-4 text-sm">
                {sessions?.length ? (
                  <div className="space-y-2">
                    {sessions.map((sessionItem) => (
                      <div key={sessionItem.id} className="rounded border bg-muted/20 px-3 py-2">
                        <p className="font-medium">{sessionItem.title ?? "Chat sem título"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sessionItem.updated_at).toLocaleString("pt-BR")}
                        </p>
                        <Button asChild variant="outline" size="sm" className="mt-2">
                          <Link href={`/chat?chatId=${sessionItem.id}`}>Abrir no chat</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem conversas registradas.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Usuário não encontrado.</CardContent>
        </Card>
      )}
    </div>
  );
}
