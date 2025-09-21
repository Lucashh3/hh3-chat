"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

interface PlanSummary {
  id: string;
  name: string;
  description: string;
  features: string[];
}

interface ProfileSummary {
  full_name: string | null;
  active_plan: string | null;
  subscription_status: string | null;
  email: string | null;
  cpf: string | null;
  phone: string | null;
  birth_date: string | null;
}

interface SettingsClientProps {
  plan: PlanSummary | null;
  profile: ProfileSummary | null;
  userEmail: string | null;
  userCreatedAt: string | null;
}

const THEME_STORAGE_KEY = "hh3-theme";

type ThemeOption = "light" | "dark";

export function SettingsClient({ plan, profile, userEmail, userCreatedAt }: SettingsClientProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeOption>("light");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const applyTheme = useCallback((value: ThemeOption) => {
    const root = document.documentElement;
    if (value === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_STORAGE_KEY, value);
    setTheme(value);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      applyTheme(stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  }, [applyTheme]);

  const subscriptionLabel = useMemo(() => {
    if (!profile?.subscription_status) return "Sem assinatura";
    const map: Record<string, string> = {
      active: "Ativa",
      trialing: "Em período de teste",
      past_due: "Pagamento em atraso",
      canceled: "Cancelada"
    };
    return map[profile.subscription_status] ?? profile.subscription_status;
  }, [profile?.subscription_status]);

  const handleThemeChange = (value: ThemeOption) => {
    applyTheme(value);
    toast({
      title: "Preferência atualizada",
      description: `Tema alterado para modo ${value === "dark" ? "escuro" : "claro"}.`
    });
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || password.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A nova senha deve possuir ao menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "As senhas não coincidem",
        description: "Verifique os campos e tente novamente.",
        variant: "destructive"
      });
      return;
    }

    try {
      setPasswordLoading(true);
      const response = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Erro ao atualizar senha");
      }

      toast({ title: "Senha atualizada com sucesso" });
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível alterar a senha",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "Tem certeza de que deseja apagar sua conta? Esta ação é irreversível e removerá todos os chats salvos."
    );

    if (!confirmation) return;

    try {
      setDeleteLoading(true);
      const response = await fetch("/api/settings/delete-account", { method: "DELETE" });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Erro ao apagar conta");
      }

      toast({
        title: "Conta removida",
        description: "Esperamos vê-lo novamente em breve!"
      });

      router.replace("/auth/register");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível apagar a conta",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold sm:text-3xl">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus dados, preferências e segurança da conta.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/chat">← Voltar para o chat</Link>
        </Button>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="plano">Plano</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados do usuário</CardTitle>
              <CardDescription>Informações sincronizadas com seu cadastro no HH3.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="font-medium">Nome completo</p>
                <p className="text-muted-foreground">{profile?.full_name ?? "Atualize seu nome no cadastro."}</p>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="font-medium">E-mail</p>
                <p className="text-muted-foreground">{userEmail ?? "Não informado"}</p>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="font-medium">CPF</p>
                <p className="text-muted-foreground">{profile?.cpf ?? "-"}</p>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="font-medium">Celular</p>
                <p className="text-muted-foreground">{profile?.phone ?? "-"}</p>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="font-medium">Data de nascimento</p>
                <p className="text-muted-foreground">
                  {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString("pt-BR") : "-"}
                </p>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <p className="font-medium">Conta criada em</p>
                <p className="text-muted-foreground">
                  {userCreatedAt ? new Date(userCreatedAt).toLocaleDateString("pt-BR") : "Não disponível"}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Para atualizar nome, e-mail ou CPF, entre em contato com o suporte HH3.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="plano" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seu plano atual</CardTitle>
              <CardDescription>Revise o que está incluído e faça upgrades quando quiser.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-semibold capitalize">
                  {plan?.name ?? "Plano gratuito"}
                </p>
                <p className="text-sm text-muted-foreground">{plan?.description ?? "Acesso inicial ao método HH3."}</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p>
                  <span className="font-medium">Status da assinatura:</span> {subscriptionLabel}
                </p>
                <p>
                  <span className="font-medium">Plano configurado:</span> {plan?.name ?? profile?.active_plan ?? "free"}
                </p>
              </div>
              {plan?.features?.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Benefícios incluídos:</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline">
                <a href="/dashboard">Gerenciar planos</a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de tema</CardTitle>
              <CardDescription>Escolha a aparência que combina com você.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {(["light", "dark"] as ThemeOption[]).map((mode) => (
                <Button
                  key={mode}
                  variant={theme === mode ? "default" : "outline"}
                  onClick={() => handleThemeChange(mode)}
                >
                  {mode === "light" ? "Modo claro" : "Modo escuro"}
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alterar senha</CardTitle>
              <CardDescription>Defina uma senha forte para manter sua conta protegida.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handlePasswordSubmit}>
                <Input
                  type="password"
                  placeholder="Nova senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <Button type="submit" disabled={passwordLoading} className="w-full">
                  {passwordLoading ? "Atualizando..." : "Salvar nova senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conta" className="space-y-4">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Apagar conta</CardTitle>
              <CardDescription>
                Remova definitivamente sua conta HH3 e todos os chats salvos. Esta ação não pode ser desfeita.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Ao confirmar, todos os chats, sessões e dados associados serão apagados e você será desconectado.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading}>
                {deleteLoading ? "Apagando conta..." : "Apagar conta"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
