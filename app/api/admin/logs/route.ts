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

  const { data, error } = await supabase
    .from("admin_logs")
    .select("action, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível carregar os logs" }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}
