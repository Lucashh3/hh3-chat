"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DeepSeekMessage } from "@/lib/deepseek";

interface ChatMessage extends DeepSeekMessage {
  id: string;
  created_at: string;
}

interface UseChatProps {
  initialMessages?: ChatMessage[];
}

export function useChat({ initialMessages = [] }: UseChatProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

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
        body: JSON.stringify({ message: userMessage.content })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = (await response.json()) as { assistant: ChatMessage };

      if (data.assistant) {
        setMessages((prev) => [...prev, data.assistant]);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado");
    } finally {
      setLoading(false);
    }
  }, [input]);

  const history = useMemo(() => messages, [messages]);

  return {
    input,
    setInput,
    messages,
    history,
    loading,
    error,
    submit
  };
}
