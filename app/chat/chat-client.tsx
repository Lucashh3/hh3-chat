"use client";

import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface ChatClientProps {
  initialMessages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    created_at: string;
  }>;
}

export function ChatClient({ initialMessages }: ChatClientProps) {
  const { messages, input, setInput, submit, loading, error } = useChat({ initialMessages });

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="border-b p-4">
        <h1 className="text-xl font-semibold">Chat com DeepSeek</h1>
        <p className="text-sm text-muted-foreground">Converse em tempo real com histórico persistido.</p>
      </header>
      <ScrollArea className="flex-1 p-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              Envie sua primeira mensagem para iniciar a conversa!
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
                      ? "rounded-lg bg-muted px-4 py-2 text-sm"
                      : "rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
                  }
                >
                  {message.content}
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
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={4}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {error ? <span className="text-destructive">{error}</span> : <span>Model: DeepSeek Chat</span>}
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
