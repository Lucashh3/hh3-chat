import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-6">
      <AuthForm
        mode="login"
        title="Entrar"
        description="Conecte-se para continuar recebendo as análises exclusivas do HH3."
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Ainda não tem conta? <Link className="underline" href="/auth/register">Crie uma agora mesmo.</Link>
      </p>
    </div>
  );
}
