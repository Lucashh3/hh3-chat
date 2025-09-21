"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

interface PromptHistoryEntry {
  prompt: string;
  updatedAt: string | null;
}

interface PromptEditorProps {
  initialPrompt: string;
  updatedAt: string | null;
  history: PromptHistoryEntry[];
}

export function PromptEditor({ initialPrompt, updatedAt, history }: PromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(updatedAt);
  const [historyEntries, setHistoryEntries] = useState<PromptHistoryEntry[]>(history);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    setLastUpdated(updatedAt);
  }, [updatedAt]);

  useEffect(() => {
    setHistoryEntries(history);
  }, [history]);

  const refreshPrompt = useCallback(async () => {
    setFetching(true);
    try {
      const response = await fetch("/api/admin/prompt");
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Não foi possível atualizar o estado do prompt");
      }
      const data = (await response.json()) as {
        prompt?: string;
        updatedAt?: string | null;
        history?: PromptHistoryEntry[];
      };

      if (typeof data.prompt === "string") {
        setPrompt(data.prompt);
      }
      setLastUpdated(data.updatedAt ?? null);
      setHistoryEntries(Array.isArray(data.history) ? data.history : []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível atualizar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setFetching(false);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!prompt || !prompt.trim()) {
      toast({
        title: "Prompt inválido",
        description: "Informe um texto antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/admin/prompt", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Erro ao salvar prompt");
      }

      toast({ title: "Prompt atualizado" });
      await refreshPrompt();
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível salvar",
        description: error instanceof Error ? error.message : "Tente novamente em instantes",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      const response = await fetch("/api/admin/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Erro ao restaurar o prompt padrão");
      }

      const data = (await response.json()) as { prompt?: string; updatedAt?: string | null };
      if (typeof data.prompt === "string") {
        setPrompt(data.prompt);
      }
      setLastUpdated(data.updatedAt ?? null);
      toast({ title: "Prompt padrão restaurado" });
      await refreshPrompt();
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível restaurar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setResetting(false);
    }
  };

  const handleLoadHistory = (entry: PromptHistoryEntry) => {
    setPrompt(entry.prompt);
    toast({ title: "Versão carregada", description: "Revise o conteúdo e salve para aplicar." });
  };

  const formatDate = (value: string | null) => {
    if (!value) return "Sem registro";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Sem registro";
    return parsed.toLocaleString("pt-BR");
  };

  const disableActions = saving || resetting || fetching;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        className="min-h-[260px] whitespace-pre-wrap"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Cole aqui o prompt que o HH3 deve utilizar"
      />
      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{lastUpdated ? `Última atualização: ${formatDate(lastUpdated)}` : "Nunca atualizado"}</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={disableActions}>
            {resetting ? "Restaurando..." : "Voltar ao padrão"}
          </Button>
          <Button type="submit" size="sm" disabled={disableActions}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Histórico recente</h3>
        {historyEntries.length ? (
          <div className="space-y-2">
            {historyEntries.map((entry, index) => (
              <div key={`${entry.updatedAt ?? "sem-data"}-${index}`} className="rounded-md border bg-muted/20 p-3 text-xs">
                <p className="mb-2 font-medium text-muted-foreground">{formatDate(entry.updatedAt)}</p>
                <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-background p-2 text-[11px]">
                  {entry.prompt}
                </pre>
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLoadHistory(entry)}
                    disabled={disableActions}
                  >
                    Carregar versão
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma versão anterior registrada ainda.</p>
        )}
      </div>
    </form>
  );
}
