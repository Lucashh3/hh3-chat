import { NextResponse } from "next/server";

import { getEnvHealth } from "@/lib/env/health";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function GET() {
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

  const statuses = getEnvHealth();
  return NextResponse.json({ env: statuses });
}
