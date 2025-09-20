import { NextResponse } from "next/server";

import { callDeepSeek } from "@/lib/deepseek";
import { checkSubscriptionStatus } from "@/lib/subscription";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as { message?: string };
  const content = body.message?.trim();

  if (!content) {
    return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });
  }

  // Garantimos que o usuário possui assinatura ativa antes de conversar com a IA
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  const subscription = checkSubscriptionStatus(profile ?? null);

  if (!subscription.isActive) {
    return NextResponse.json({ error: subscription.reason ?? "Assinatura inativa" }, { status: 403 });
  }

  // Busca o histórico recente para enviar junto ao prompt
  const { data: history } = await supabase
    .from("chats")
    .select("role, content")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true })
    .limit(20);

  const messages = history?.map((message) => ({ role: message.role, content: message.content })) ?? [];

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user" as const,
    content,
    created_at: new Date().toISOString()
  };

  // Chama a API DeepSeek já com o prompt de sistema configurado em lib/deepseek
  const assistantResponse = await callDeepSeek([...messages, { role: "user", content }]);

  const assistantMessage = {
    id: assistantResponse.id,
    role: "assistant" as const,
    content: assistantResponse.content,
    created_at: new Date().toISOString()
  };

  const { error: insertError } = await supabase.from("chats").insert([
    {
      id: userMessage.id,
      user_id: session.user.id,
      role: userMessage.role,
      content: userMessage.content
    },
    {
      id: assistantMessage.id,
      user_id: session.user.id,
      role: assistantMessage.role,
      content: assistantMessage.content
    }
  ]);

  if (insertError) {
    console.error(insertError);
  }

  return NextResponse.json({ assistant: assistantMessage });
}
