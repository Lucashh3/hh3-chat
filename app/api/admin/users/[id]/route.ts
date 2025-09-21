import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const isAdmin = (email: string | null | undefined) => ADMIN_EMAILS.includes(email?.toLowerCase() ?? "");

const ensureSession = async (supabase: ReturnType<typeof createSupabaseRouteHandlerClient>) => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) } as const;
  }

  if (!isAdmin(session.user.email)) {
    return { error: NextResponse.json({ error: "Acesso não permitido" }, { status: 403 }) } as const;
  }

  return { session } as const;
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  const supabase = createSupabaseRouteHandlerClient();
  const sessionCheck = await ensureSession(supabase);
  if ("error" in sessionCheck) {
    return sessionCheck.error;
  }

  const limitParam = new URL(request.url).searchParams.get("limit");
  const sessionLimit = Math.min(25, Math.max(5, Number(limitParam) || 8));

  const [{ data: profile, error: profileError }, { data: sessions, error: sessionsError }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, email, active_plan, subscription_status, cpf, phone, birth_date, is_blocked, created_at"
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(sessionLimit)
  ]);

  if (profileError || sessionsError) {
    console.error(profileError ?? sessionsError);
    return NextResponse.json({ error: "Não foi possível carregar o usuário" }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ profile, sessions: sessions ?? [] });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  const { action, payload } = (await request.json().catch(() => ({}))) as {
    action?: string;
    payload?: Record<string, unknown>;
  };

  const supabase = createSupabaseRouteHandlerClient();
  const sessionCheck = await ensureSession(supabase);
  if ("error" in sessionCheck) {
    return sessionCheck.error;
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
      const plan = typeof payload?.plan === "string" ? payload.plan.trim() : "";
      if (!plan) {
        return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
      }

      const { data: planRecord } = await supabase
        .from("plans")
        .select("id")
        .eq("id", plan)
        .eq("is_active", true)
        .maybeSingle();

      if (!planRecord) {
        return NextResponse.json({ error: "Plano não encontrado ou inativo" }, { status: 400 });
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

    case "toggleBlock": {
      const shouldBlock = Boolean(payload?.blocked);

      const { error: adminError } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: shouldBlock ? "indefinite" : "none"
      });

      if (adminError) {
        console.error(adminError);
        return NextResponse.json({ error: adminError.message ?? "Não foi possível atualizar o usuário" }, { status: 500 });
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_blocked: shouldBlock })
        .eq("id", userId);

      if (profileError) {
        console.error(profileError);
        return NextResponse.json({ error: "Não foi possível registrar o status" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  }
}
