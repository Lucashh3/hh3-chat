"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DeepSeekMessage } from "@/lib/deepseek";

interface ChatMessage extends DeepSeekMessage {
  id: string;
  created_at: string;
}

interface UseChatProps {
  initialMessages?: ChatMessage[];
  initialChatId?: string | null;
  initialSessions?: ChatSession[];
}

export interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export function useChat({ initialMessages = [], initialChatId = null, initialSessions = [] }: UseChatProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setChatId(initialChatId);
  }, [initialChatId]);

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  const upsertSession = useCallback((session: ChatSession) => {
    setSessions((prev) => {
      const filtered = prev.filter((item) => item.id !== session.id);
      const next = [session, ...filtered];
      return next.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    });
  }, []);

  const submit = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, chatId })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = (await response.json()) as {
        assistant: ChatMessage;
        chatId?: string;
        session?: ChatSession;
      };

      if (data.assistant) {
        setMessages((prev) => [...prev, data.assistant]);
      }

      if (data.chatId) {
        setChatId(data.chatId);
      }

      if (data.session) {
        upsertSession(data.session);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado");
    } finally {
      setLoading(false);
    }
  }, [chatId, input, upsertSession]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setChatId(null);
    setError(null);
  }, []);

  const loadChat = useCallback(
    async (sessionId: string) => {
      if (!sessionId) return;
      setSwitching(true);
      setError(null);
      try {
        const response = await fetch(`/api/chat?chatId=${sessionId}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Não foi possível carregar o chat");
        }
        const data = (await response.json()) as { messages: ChatMessage[] };
        setMessages(data.messages ?? []);
        setChatId(sessionId);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Não foi possível carregar o chat");
      } finally {
        setSwitching(false);
      }
    },
    []
  );

  const refreshSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/chat");
      if (!response.ok) {
        throw new Error("Não foi possível atualizar os chats");
      }
      const data = (await response.json()) as { sessions: ChatSession[] };
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Não foi possível atualizar os chats");
    }
  }, []);

  const history = useMemo(() => messages, [messages]);

  return {
    input,
    setInput,
    messages,
    history,
    chatId,
    sessions,
    switching,
    loading,
    error,
    submit,
    startNewChat,
    loadChat,
    refreshSessions
  };
}
