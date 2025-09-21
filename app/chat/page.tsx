import { redirect } from "next/navigation";

import { checkSubscriptionStatus } from "@/lib/subscription";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchPlanById } from "@/lib/plan-service";

import { ChatClient } from "./chat-client";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

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
  const plan = profile?.active_plan ? await fetchPlanById(profile.active_plan) : null;
  const planName = plan?.name ?? (profile?.active_plan ? profile.active_plan.charAt(0).toUpperCase() + profile.active_plan.slice(1) : null);
  const isAdmin = ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? "");

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
      userName={profile?.full_name ?? (typeof session.user.user_metadata?.full_name === "string" ? (session.user.user_metadata.full_name as string) : null)}
      userEmail={session.user.email ?? null}
      planName={planName}
      isAdmin={isAdmin}
    />
  );
}
