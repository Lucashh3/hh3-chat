import { redirect } from "next/navigation";

import { checkSubscriptionStatus } from "@/lib/subscription";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";

import { ChatClient } from "./chat-client";

interface ChatPageProps {
  searchParams?: Record<string, string | string[]>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/chat");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session!.user.id)
    .single();

  const subscription = checkSubscriptionStatus(profile ?? null);

  if (!subscription.isActive) {
    redirect("/dashboard?subscription=inactive");
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("user_id", session!.user.id)
    .order("updated_at", { ascending: false });

  if (sessionsError) {
    console.error(sessionsError);
  }

  const sessionList = sessions ?? [];
  const plan = PLANS.find((item) => item.id === profile?.active_plan);

  const requestedChatId = typeof searchParams?.chatId === "string" ? searchParams.chatId : null;
  let activeChatId: string | null = null;

  if (requestedChatId && sessionList.some((item) => item.id === requestedChatId)) {
    activeChatId = requestedChatId;
  } else if (sessionList.length > 0) {
    activeChatId = sessionList[0].id;
  }

  let chatHistory: Array<{ id: string; role: "user" | "assistant" | "system"; content: string; created_at: string }> = [];

  if (activeChatId) {
    const { data: history, error: historyError } = await supabase
      .from("chats")
      .select("id, role, content, created_at")
      .eq("user_id", session!.user.id)
      .eq("session_id", activeChatId)
      .order("created_at", { ascending: true });

    if (historyError) {
      console.error(historyError);
    } else {
      chatHistory = history ?? [];
    }
  }

  return (
    <ChatClient
      initialMessages={chatHistory}
      initialChatId={activeChatId}
      sessions={sessionList}
      userName={profile?.full_name ?? session.user.user_metadata?.full_name ?? null}
      userEmail={session.user.email ?? null}
      planName={plan?.name ?? "Iniciante HH3"}
    />
  );
}
