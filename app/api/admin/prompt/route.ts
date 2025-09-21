import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const SETTINGS_KEY = "system_prompt";

export async function PATCH(request: Request) {
  const { prompt } = (await request.json().catch(() => ({}))) as { prompt?: string };

  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt inválido" }, { status: 400 });
  }

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

  const { error } = await supabase
    .from("admin_settings")
    .upsert({
      key: SETTINGS_KEY,
      value: prompt,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível atualizar o prompt" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

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

  const { data, error } = await supabase
    .from("admin_settings")
    .select("value, updated_at")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível carregar o prompt" }, { status: 500 });
  }

  return NextResponse.json({ prompt: data?.value ?? null, updatedAt: data?.updated_at ?? null });
}
