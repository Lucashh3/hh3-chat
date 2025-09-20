import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createSupabaseRouteHandlerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message ?? "Não foi possível encerrar a sessão" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
