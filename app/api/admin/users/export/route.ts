import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const plan = url.searchParams.get("plan")?.trim();
  const status = url.searchParams.get("status")?.trim();

  const query = supabase
    .from("profiles")
    .select("full_name, email, active_plan, subscription_status, cpf, phone, birth_date, is_blocked, created_at")
    .order("created_at", { ascending: false });

  if (q) {
    query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%,cpf.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  if (plan && ["free", "pro", "vip"].includes(plan)) {
    query.eq("active_plan", plan);
  }

  if (status) {
    if (status === "blocked") {
      query.eq("is_blocked", true);
    } else if (["active", "trialing", "past_due", "canceled"].includes(status)) {
      query.eq("subscription_status", status);
      query.eq("is_blocked", false);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível gerar o relatório" }, { status: 500 });
  }

  const rows = [
    [
      "Nome",
      "E-mail",
      "Plano",
      "Status",
      "Bloqueado",
      "CPF",
      "Celular",
      "Nascimento",
      "Criado em"
    ],
    ...(data ?? []).map((user) => [
      user.full_name ?? "",
      user.email ?? "",
      user.active_plan ?? "free",
      user.subscription_status ?? "-",
      user.is_blocked ? "sim" : "não",
      user.cpf ?? "",
      user.phone ?? "",
      user.birth_date ? new Date(user.birth_date).toLocaleDateString("pt-BR") : "",
      user.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : ""
    ])
  ];

  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=usuarios-hh3-${new Date().toISOString().slice(0, 10)}.csv`
    }
  });
}
