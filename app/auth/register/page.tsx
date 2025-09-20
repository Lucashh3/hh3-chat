import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-6">
      <AuthForm
        mode="register"
        title="Criar conta"
        description="Configure seu acesso ao método HH3 de roleta europeia via chat."
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Já possui conta? <Link className="underline" href="/auth/login">Faça login</Link>.
      </p>
    </div>
  );
}
