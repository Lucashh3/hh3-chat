import { NextResponse } from "next/server";

import { callDeepSeek } from "@/lib/deepseek";
import { checkSubscriptionStatus } from "@/lib/subscription";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const SESSION_TITLE_MAX = 80;

const buildSessionTitle = (message?: string | null) => {
  if (!message) return "Novo chat";
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (!trimmed) return "Novo chat";
  return trimmed.length > SESSION_TITLE_MAX ? `${trimmed.slice(0, SESSION_TITLE_MAX)}…` : trimmed;
};

export async function GET(request: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");

  if (chatId) {
    const { data: sessionMatch } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!sessionMatch) {
      return NextResponse.json({ error: "Chat não encontrado" }, { status: 404 });
    }

    const { data: history, error } = await supabase
      .from("chats")
      .select("id, role, content, created_at")
      .eq("user_id", session.user.id)
      .eq("session_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Não foi possível carregar o chat" }, { status: 500 });
    }

    return NextResponse.json({ messages: history ?? [] });
  }

  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível carregar os chats" }, { status: 500 });
  }

  return NextResponse.json({ sessions: sessions ?? [] });
}

export async function POST(request: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as { message?: string; chatId?: string };
  const content = body.message?.trim();

  if (!content) {
    return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });
  }

  let chatId = body.chatId ?? null;

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

  let sessionMetadata:
    | {
        id: string;
        title: string | null;
        created_at: string;
        updated_at: string;
      }
    | null = null;

  if (chatId) {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("id", chatId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Não foi possível validar o chat" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Chat não encontrado" }, { status: 404 });
    }

    sessionMetadata = data;
  } else {
    const initialTitle = buildSessionTitle(content);
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: session.user.id,
        title: initialTitle
      })
      .select("id, title, created_at, updated_at")
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Não foi possível criar o chat" }, { status: 500 });
    }

    sessionMetadata = data;
    chatId = data.id;
  }

  // Busca o histórico recente para enviar junto ao prompt
  const { data: history } = await supabase
    .from("chats")
    .select("role, content")
    .eq("user_id", session.user.id)
    .eq("session_id", chatId!)
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
      content: userMessage.content,
      session_id: chatId!
    },
    {
      id: assistantMessage.id,
      user_id: session.user.id,
      role: assistantMessage.role,
      content: assistantMessage.content,
      session_id: chatId!
    }
  ]);

  if (insertError) {
    console.error(insertError);
  }

  const newTitle = sessionMetadata?.title ? sessionMetadata.title : buildSessionTitle(content);
  const { data: updatedSession } = await supabase
    .from("chat_sessions")
    .update({
      updated_at: new Date().toISOString(),
      title: newTitle
    })
    .eq("id", chatId!)
    .select("id, title, created_at, updated_at")
    .single();

  return NextResponse.json({
    assistant: assistantMessage,
    chatId,
    session: updatedSession ?? sessionMetadata
  });
}

export async function DELETE(request: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");

  if (!chatId) {
    return NextResponse.json({ error: "chatId é obrigatório" }, { status: 400 });
  }

  const { data: sessionMatch } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("id", chatId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!sessionMatch) {
    return NextResponse.json({ error: "Chat não encontrado" }, { status: 404 });
  }

  const { error: deleteMessagesError } = await supabase.from("chats").delete().eq("session_id", chatId);

  if (deleteMessagesError) {
    console.error(deleteMessagesError);
    return NextResponse.json({ error: "Não foi possível remover mensagens" }, { status: 500 });
  }

  const { error: deleteSessionError } = await supabase.from("chat_sessions").delete().eq("id", chatId);

  if (deleteSessionError) {
    console.error(deleteSessionError);
    return NextResponse.json({ error: "Não foi possível remover o chat" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
