import { redirect } from "next/navigation";

import { checkSubscriptionStatus } from "@/lib/subscription";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { ChatClient } from "./chat-client";

export default async function ChatPage() {
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

  const { data: chatHistory } = await supabase
    .from("chats")
    .select("id, role, content, created_at")
    .eq("user_id", session!.user.id)
    .order("created_at", { ascending: true });

  return <ChatClient initialMessages={chatHistory ?? []} />;
}
