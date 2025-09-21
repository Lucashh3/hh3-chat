"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { isValidCpf, sanitizeCpf } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().optional(),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  birthdate: z.string().optional()
});

interface AuthFormProps {
  mode: "login" | "register";
  title: string;
  description: string;
}

export function AuthForm({ mode, title, description }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const plan = searchParams.get("plan") ?? undefined;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema)
  });

  const [loading, setLoading] = useState(false);
  const [supabase] = useState(createBrowserSupabaseClient);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      if (mode === "register") {
        if (!values.cpf || !values.phone || !values.birthdate) {
          toast({
            title: "Complete os dados",
            description: "Informe CPF, celular e data de nascimento para criar sua conta.",
            variant: "destructive"
          });
          throw new Error("Dados obrigatórios ausentes");
        }

        const sanitizedCpf = sanitizeCpf(values.cpf);
        if (!isValidCpf(sanitizedCpf)) {
          toast({
            title: "CPF inválido",
            description: "Verifique o número informado e tente novamente.",
            variant: "destructive"
          });
          throw new Error("CPF inválido");
        }

        const sanitizedPhone = values.phone.replace(/\D/g, "");

        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.name,
              active_plan: plan ?? "free",
              cpf: sanitizedCpf,
              phone: sanitizedPhone,
              birth_date: values.birthdate
            }
          }
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password
        });
        if (error) throw error;
        toast({ title: "Login efetuado" });
      }
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast({
        title: "Ops",
        description: error instanceof Error ? error.message : "Não foi possível concluir a ação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-lg border bg-card p-8 shadow">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === "register" && (
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="name">
              Nome completo
            </label>
            <Input id="name" placeholder="Maria Silva" {...register("name")} />
          </div>
        )}
        {mode === "register" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="cpf">
                CPF
              </label>
              <Input id="cpf" placeholder="000.000.000-00" {...register("cpf")} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="phone">
                Celular
              </label>
              <Input id="phone" placeholder="(11) 91234-5678" {...register("phone")} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="birthdate">
                Data de nascimento
              </label>
              <Input id="birthdate" type="date" {...register("birthdate")} />
            </div>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            E-mail
          </label>
          <Input id="email" type="email" placeholder="apostador@exemplo.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            Senha
          </label>
          <Input id="password" type="password" placeholder="******" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta"}
        </Button>
      </form>
    </div>
  );
}
