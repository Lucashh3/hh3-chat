"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export interface StripeEventRow {
  stripe_event_id: string;
  type: string;
  status: string;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
}

interface StripeEventsTableProps {
  events: StripeEventRow[];
}

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const statusColor = (status: string) => {
  switch (status) {
    case "processed":
      return "text-emerald-600";
    case "error":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
};

export function StripeEventsTable({ events }: StripeEventsTableProps) {
  const [pendingEvent, setPendingEvent] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleReplay = (eventId: string) => {
    setPendingEvent(eventId);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/stripe/replay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId })
        });

        if (!response.ok) {
          const result = await response.json().catch(() => undefined);
          throw new Error(result?.error ?? "Não foi possível reenviar o webhook");
        }

        toast({ title: "Webhook reprocesado com sucesso" });
      } catch (error) {
        console.error(error);
        toast({
          title: "Erro ao reprocesar",
          description: error instanceof Error ? error.message : "Tente novamente",
          variant: "destructive"
        });
      } finally {
        setPendingEvent(null);
      }
    });
  };

  if (!events.length) {
    return <p className="text-sm text-muted-foreground">Nenhum evento recente registrado.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr className="border-b">
            <th className="py-2 pr-4 text-left">Tipo</th>
            <th className="py-2 pr-4 text-left">Status</th>
            <th className="py-2 pr-4 text-left">Recebido</th>
            <th className="py-2 pr-4 text-left">Processado</th>
            <th className="py-2 pr-4 text-left">Erro</th>
            <th className="py-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const loading = isPending && pendingEvent === event.stripe_event_id;
            return (
              <tr key={event.stripe_event_id} className="border-b last:border-0">
                <td className="py-2 pr-4 font-medium capitalize">{event.type.replace(/\./g, " ")}</td>
                <td className={`py-2 pr-4 text-xs font-semibold uppercase ${statusColor(event.status)}`}>
                  {event.status}
                </td>
                <td className="py-2 pr-4 text-muted-foreground">{formatDateTime(event.received_at)}</td>
                <td className="py-2 pr-4 text-muted-foreground">{formatDateTime(event.processed_at)}</td>
                <td className="py-2 pr-4 text-xs text-muted-foreground">
                  {event.error_message ? event.error_message.slice(0, 80) : "-"}
                </td>
                <td className="py-2 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleReplay(event.stripe_event_id)}
                  >
                    {loading ? "Reprocessando..." : "Reenviar"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
