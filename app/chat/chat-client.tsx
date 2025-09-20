"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useChat, type ChatSession } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface ChatClientProps {
  initialMessages: ChatMessage[];
  initialChatId: string | null;
  sessions: ChatSession[];
  userName: string | null;
  userEmail: string | null;
  planName: string | null;
}

export function ChatClient({ initialMessages, initialChatId, sessions, userName, userEmail, planName }: ChatClientProps) {
  const {
    messages,
    input,
    setInput,
    submit,
    loading,
    error,
    chatId,
    sessions: sessionList,
    startNewChat,
    loadChat,
    switching
  } = useChat({ initialMessages, initialChatId, initialSessions: sessions });

  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const currentSessionTitle = useMemo(() => {
    if (!chatId) return "Novo chat";
    const active = sessionList.find((session) => session.id === chatId);
    return active?.title ?? "Chat sem título";
  }, [chatId, sessionList]);

  const userInitials = useMemo(() => {
    if (userName && userName.trim().length > 0) {
      return userName
        .trim()
        .split(" ")
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
    }
    if (userEmail && userEmail.length > 0) {
      return userEmail.charAt(0).toUpperCase();
    }
    return "HH";
  }, [userEmail, userName]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  const formatTimestamp = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleSelectSession = (id: string) => {
    setMobileSessionsOpen(false);
    setUserMenuOpen(false);
    loadChat(id);
  };

  const handleStartNewChat = () => {
    setMobileSessionsOpen(false);
    setUserMenuOpen(false);
    startNewChat();
  };

  const handleSignOut = async () => {
    try {
      setUserMenuOpen(false);
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Falha ao encerrar sessão");
      }
    } catch (error) {
      console.error(error);
    } finally {
      window.location.href = "/auth/login";
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:h-[calc(100vh-4rem)] md:flex-row md:overflow-hidden">
      <aside className="hidden w-72 flex-shrink-0 border-b border-r bg-muted/30 p-4 md:flex md:h-full md:flex-col md:border-b-0">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Seus chats</h2>
        </div>
        <ScrollArea className="mt-4 flex-1">
          <div className="space-y-2 pr-2">
            {sessionList.length === 0 && <p className="text-sm text-muted-foreground">Nenhum chat salvo ainda.</p>}
            {sessionList.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => handleSelectSession(session.id)}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left text-sm transition",
                  chatId === session.id ? "border-primary bg-primary/10" : "border-transparent bg-background hover:bg-muted"
                )}
              >
                <div className="line-clamp-1 font-medium">{session.title ?? "Chat sem título"}</div>
                <div className="text-xs text-muted-foreground">{formatTimestamp(session.updated_at)}</div>
              </button>
            ))}
          </div>
        </ScrollArea>
        {sessionList.length > 0 && (
          <div className="mt-4 rounded-md border border-dashed bg-background p-3 text-xs text-muted-foreground">
            As conversas mais recentes aparecem primeiro. Clique para retomar onde parou.
          </div>
        )}
        <Button className="mt-4" variant="outline" onClick={handleStartNewChat}>
          Criar novo chat
        </Button>
      </aside>
      <div className="flex flex-1 flex-col md:h-full md:overflow-hidden">
        <header className="border-b bg-background/80 p-4 backdrop-blur md:sticky md:top-0 md:z-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">Chat com HH3</h1>
              <p className="text-sm text-muted-foreground">{currentSessionTitle}</p>
              {sessionList.length > 0 && (
                <div className="flex items-center gap-2 md:hidden">
                  <Button variant="outline" size="sm" onClick={() => setMobileSessionsOpen(true)}>
                    Ver chats salvos
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={handleStartNewChat} disabled={loading}>
                Novo chat
              </Button>
              <div className="relative" ref={userMenuRef}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-2 border-primary/40 bg-card"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                >
                  {userInitials}
                </Button>
                {userMenuOpen && (
                  <div className="absolute right-0 z-20 mt-3 w-64 rounded-lg border bg-card p-3 text-sm shadow-lg">
                    <div className="border-b pb-2">
                      <p className="font-semibold">{userName ?? userEmail ?? "Usuário HH3"}</p>
                      {planName && <p className="text-xs text-muted-foreground">Plano: {planName}</p>}
                      {userEmail && <p className="text-xs text-muted-foreground">{userEmail}</p>}
                    </div>
                    <div className="mt-2 flex flex-col gap-1">
                      <Button variant="ghost" className="justify-start" asChild onClick={() => setUserMenuOpen(false)}>
                        <a href="/settings">Configurações</a>
                      </Button>
                      <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                        Sair
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        {mobileSessionsOpen && (
          <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden">
            <div className="absolute inset-x-4 top-20 max-h-[70vh] overflow-hidden rounded-lg border bg-card shadow-lg">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold">Chats salvos</p>
                <Button variant="ghost" size="sm" onClick={() => setMobileSessionsOpen(false)}>
                  Fechar
                </Button>
              </div>
              <ScrollArea className="h-[50vh] px-4 py-3">
                <div className="space-y-2">
                  {sessionList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum chat salvo ainda.</p>
                  ) : (
                    sessionList.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => handleSelectSession(session.id)}
                        className={cn(
                          "w-full rounded-md border px-3 py-2 text-left text-sm transition",
                          chatId === session.id ? "border-primary bg-primary/10" : "border-transparent bg-background hover:bg-muted"
                        )}
                      >
                        <div className="line-clamp-1 font-medium">{session.title ?? "Chat sem título"}</div>
                        <div className="text-xs text-muted-foreground">{formatTimestamp(session.updated_at)}</div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="border-t px-4 py-3">
                <Button className="w-full" onClick={handleStartNewChat}>
                  Criar novo chat
                </Button>
              </div>
            </div>
          </div>
        )}
        <ScrollArea className="flex-1 p-6 md:h-[calc(100vh-4rem)]">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {switching && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            )}
            {messages.length === 0 && !loading && !switching ? (
              <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-muted-foreground">
                <p className="text-sm">
                  Cole abaixo os últimos resultados da roleta europeia para que HH3 identifique o alvo principal usando o Método 3.
                </p>
                <Button className="mt-4" variant="outline" onClick={handleStartNewChat}>
                  Começar agora
                </Button>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "assistant"
                      ? "ml-0 flex w-full justify-start"
                      : "ml-auto flex w-full justify-end"
                  }
                >
                  <div
                    className={
                      message.role === "assistant"
                        ? "whitespace-pre-wrap rounded-lg bg-muted px-4 py-3 text-sm shadow"
                        : "whitespace-pre-wrap rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground shadow"
                    }
                  >
                    {message.content}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {message.role === "assistant" ? "HH3" : "Você"} · {formatTimestamp(message.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            )}
          </div>
        </ScrollArea>
        <form
          className="border-t bg-background"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4">
            <Textarea
              placeholder="Cole aqui os últimos resultados (ex: 17, 8, 32...)"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={4}
            />
            <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              {error ? <span className="text-destructive">{error}</span> : <span>Mentor: HH3 · DeepSeek</span>}
              <Button type="submit" disabled={loading} className="md:w-auto">
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
