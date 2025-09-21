import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/plans";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  const { action, payload } = (await request.json().catch(() => ({}))) as {
    action?: string;
    payload?: Record<string, unknown>;
  };

  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Acesso não permitido" }, { status: 403 });
  }

  if (!action) {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const adminClient = createAdminSupabaseClient();

  switch (action) {
    case "resetPassword": {
      const newPassword = typeof payload?.newPassword === "string" ? payload.newPassword.trim() : "";
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Senha deve conter ao menos 6 caracteres" }, { status: 400 });
      }

      const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) {
        console.error(error);
        return NextResponse.json({ error: error.message ?? "Não foi possível atualizar a senha" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    case "updatePlan": {
      const plan = typeof payload?.plan === "string" ? payload.plan : "";
      if (!PLANS.some((item) => item.id === plan)) {
        return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
      }

      const { error } = await supabase
        .from("profiles")
        .update({ active_plan: plan })
        .eq("id", userId);

      if (error) {
        console.error(error);
        return NextResponse.json({ error: "Não foi possível atualizar o plano" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  }
}
