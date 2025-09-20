import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "A senha deve possuir ao menos 6 caracteres." }, { status: 400 });
  }

  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message ?? "Não foi possível atualizar a senha" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
