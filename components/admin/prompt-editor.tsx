"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

interface PromptEditorProps {
  initialPrompt: string;
  updatedAt: string | null;
}

export function PromptEditor({ initialPrompt, updatedAt }: PromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [saving, setSaving] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        className="min-h-[260px] whitespace-pre-wrap"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Cole aqui o prompt que o HH3 deve utilizar"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {updatedAt ? <span>Última atualização: {new Date(updatedAt).toLocaleString("pt-BR")}</span> : <span>Nunca atualizado</span>}
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
