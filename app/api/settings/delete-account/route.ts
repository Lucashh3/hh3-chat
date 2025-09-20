import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = session.user.id;

  const { error: deleteChatsError } = await supabase.from("chats").delete().eq("user_id", userId);
  if (deleteChatsError) {
    console.error(deleteChatsError);
    return NextResponse.json({ error: "Não foi possível remover os chats" }, { status: 500 });
  }

  const { error: deleteSessionsError } = await supabase.from("chat_sessions").delete().eq("user_id", userId);
  if (deleteSessionsError) {
    console.error(deleteSessionsError);
    return NextResponse.json({ error: "Não foi possível remover os históricos" }, { status: 500 });
  }

  const { error: deleteProfileError } = await supabase.from("profiles").delete().eq("id", userId);
  if (deleteProfileError) {
    console.error(deleteProfileError);
    return NextResponse.json({ error: "Não foi possível remover o perfil" }, { status: 500 });
  }

  const admin = createAdminSupabaseClient();
  const { error: userDeletionError } = await admin.auth.admin.deleteUser(userId);

  if (userDeletionError) {
    console.error(userDeletionError);
    return NextResponse.json({ error: "Não foi possível remover a conta" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
