"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import type { EnvStatus } from "@/lib/env/health";

interface AdminPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number | null;
  stripe_price_id: string | null;
  features: string[] | null;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
}

interface PlanSettingsProps {
  initialPlans: AdminPlan[];
  initialEnv: EnvStatus[];
}

interface PlanFormValues {
  id?: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number | null;
  stripePriceId: string | null;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

const mapFormValues = (plan?: AdminPlan): PlanFormValues => ({
  id: plan?.id,
  name: plan?.name ?? "",
  description: plan?.description ?? "",
  priceMonthly: plan?.price_monthly ?? 0,
  priceYearly: plan?.price_yearly ?? null,
  stripePriceId: plan?.stripe_price_id ?? null,
  features: plan?.features ?? [],
  isActive: plan?.is_active ?? true,
  sortOrder: plan?.sort_order ?? 0
});

function PlanForm({
  mode,
  initialValues,
  submitting,
  onSubmit,
  onCancel
}: {
  mode: "create" | "edit";
  initialValues?: AdminPlan;
  submitting: boolean;
  onSubmit: (values: PlanFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<PlanFormValues>(mapFormValues(initialValues));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: PlanFormValues = {
      id: values.id?.trim() || undefined,
      name: values.name.trim(),
      description: values.description.trim(),
      priceMonthly: Number(values.priceMonthly) || 0,
      priceYearly:
        values.priceYearly === null || values.priceYearly === undefined
          ? null
          : Number(values.priceYearly) || 0,
      stripePriceId: values.stripePriceId ? values.stripePriceId.trim() || null : null,
      features: values.features ?? [],
      isActive: values.isActive,
      sortOrder: Number(values.sortOrder) || 0
    };

    if (!payload.name || !payload.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe nome e descrição do plano",
        variant: "destructive"
      });
      return;
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "create" && (
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="plan-id">
            Identificador (opcional)
          </label>
          <Input
            id="plan-id"
            placeholder="ex.: plano-super-pro"
            value={values.id ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, id: event.target.value }))}
          />
        </div>
      )}

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="plan-name">
          Nome
        </label>
        <Input
          id="plan-name"
          required
          value={values.name}
          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Mentoria Pro"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="plan-description">
          Descrição
        </label>
        <Textarea
          id="plan-description"
          required
          value={values.description}
          onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="plan-price-monthly">
            Preço mensal (R$)
          </label>
          <Input
            id="plan-price-monthly"
            type="number"
            min={0}
            step="0.01"
            value={values.priceMonthly}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, priceMonthly: Number(event.target.value) || 0 }))
            }
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="plan-price-yearly">
            Preço anual (R$)
          </label>
          <Input
            id="plan-price-yearly"
            type="number"
            min={0}
            step="0.01"
            value={values.priceYearly ?? ""}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                priceYearly: event.target.value === "" ? null : Number(event.target.value) || 0
              }))
            }
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="plan-stripe">
          Stripe price ID (opcional)
        </label>
        <Input
          id="plan-stripe"
          value={values.stripePriceId ?? ""}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, stripePriceId: event.target.value ? event.target.value : null }))
          }
          placeholder="price_123"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="plan-features">
          Benefícios (1 por linha)
        </label>
        <Textarea
          id="plan-features"
          value={(values.features ?? []).join("\n")}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, features: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) }))
          }
          rows={4}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase text-muted-foreground" htmlFor="plan-sort-order">
          Ordem de exibição
        </label>
        <Input
          id="plan-sort-order"
          type="number"
          value={values.sortOrder}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))
          }
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) => setValues((prev) => ({ ...prev, isActive: event.target.checked }))}
        />
        Plano ativo
      </label>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : mode === "create" ? "Adicionar plano" : "Salvar alterações"}
        </Button>
        <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

const STATUS_LABEL: Record<EnvStatus["status"], { label: string; className: string }> = {
  ok: { label: "OK", className: "text-emerald-600" },
  warning: { label: "Atenção", className: "text-amber-600" },
  missing: { label: "Ausente", className: "text-destructive" }
};

export function PlanSettings({ initialPlans, initialEnv }: PlanSettingsProps) {
  const [plans, setPlans] = useState<AdminPlan[]>(initialPlans);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [envStatuses, setEnvStatuses] = useState<EnvStatus[]>(initialEnv ?? []);
  const [envLoading, setEnvLoading] = useState(false);

  const refreshPlans = async () => {
    try {
      const response = await fetch("/api/admin/plans?includeInactive=true");
      if (!response.ok) {
        throw new Error("Não foi possível atualizar os planos");
      }
      const data = (await response.json()) as { plans?: AdminPlan[] };
      setPlans(data.plans ?? []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao carregar os planos",
        variant: "destructive"
      });
    }
  };

  const refreshEnvStatuses = async () => {
    setEnvLoading(true);
    try {
      const response = await fetch("/api/admin/env");
      if (!response.ok) {
        const result = await response.json().catch(() => undefined);
        throw new Error(result?.error ?? "Não foi possível atualizar as variáveis");
      }
      const data = (await response.json()) as { env?: EnvStatus[] };
      if (Array.isArray(data.env)) {
        setEnvStatuses(data.env);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao consultar variáveis de ambiente",
        variant: "destructive"
      });
    } finally {
      setEnvLoading(false);
    }
  };

  const handleCreate = async (values: PlanFormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: values.id,
          name: values.name,
          description: values.description,
          priceMonthly: values.priceMonthly,
          priceYearly: values.priceYearly,
          stripePriceId: values.stripePriceId,
          features: values.features,
          isActive: values.isActive,
          sortOrder: values.sortOrder
        })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => undefined);
        throw new Error(result?.error ?? "Não foi possível criar o plano");
      }

      toast({ title: "Plano criado com sucesso" });
      setCreating(false);
      await refreshPlans();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar o plano",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (planId: string, values: PlanFormValues) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          priceMonthly: values.priceMonthly,
          priceYearly: values.priceYearly,
          stripePriceId: values.stripePriceId,
          features: values.features,
          isActive: values.isActive,
          sortOrder: values.sortOrder
        })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => undefined);
        throw new Error(result?.error ?? "Não foi possível atualizar o plano");
      }

      toast({ title: "Plano atualizado" });
      setEditingPlanId(null);
      await refreshPlans();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o plano",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (plan: AdminPlan) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.is_active })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => undefined);
        throw new Error(result?.error ?? "Não foi possível alterar o status");
      }

      toast({ title: !plan.is_active ? "Plano reativado" : "Plano desativado" });
      await refreshPlans();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível alterar o status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async (plan: AdminPlan) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json().catch(() => undefined);
        throw new Error(result?.error ?? "Não foi possível remover o plano");
      }
      toast({ title: "Plano desativado" });
      await refreshPlans();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível remover o plano",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = useMemo(
    () => envStatuses.filter((status) => status.status === "missing").length,
    [envStatuses]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Ajuste os planos ofertados no HH3 e mantenha o catálogo alinhado com o Stripe.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={creating || loading}>
          Novo plano
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Variáveis críticas</CardTitle>
            <CardDescription>Monitore chaves sensíveis necessárias para integrações e alertas.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshEnvStatuses} disabled={envLoading}>
            {envLoading ? "Recarregando..." : "Recarregar"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {criticalCount > 0 ? (
            <p className="text-destructive">
              {criticalCount === 1
                ? "1 variável obrigatória pendente."
                : `${criticalCount} variáveis obrigatórias pendentes.`}
            </p>
          ) : (
            <p className="text-emerald-600">Todas as variáveis obrigatórias estão configuradas.</p>
          )}
          <div className="space-y-2">
            {envStatuses.map((status) => {
              const config = STATUS_LABEL[status.status];
              const helper = status.message ?? (status.status === "ok" ? "Configuração presente" : undefined);
              return (
                <div
                  key={status.key}
                  className="flex flex-col rounded-md border bg-muted/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{status.label}</p>
                    {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
                  </div>
                  <div className="mt-2 flex items-center gap-3 sm:mt-0">
                    {status.valuePreview && (
                      <span className="text-xs text-muted-foreground">{status.valuePreview}</span>
                    )}
                    <Badge variant="outline" className={config.className}>
                      {config.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>Novo plano</CardTitle>
            <CardDescription>Preencha os campos abaixo para adicionar um novo plano ao catálogo.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanForm mode="create" submitting={loading} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => {
          const editing = editingPlanId === plan.id;
          const priceMonthly = Number(plan.price_monthly ?? 0);
          const priceYearly = plan.price_yearly !== null && plan.price_yearly !== undefined ? Number(plan.price_yearly) : null;

          return (
            <Card key={plan.id} className={!plan.is_active ? "opacity-70" : undefined}>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>ID: {plan.id}</CardDescription>
                  </div>
                  <Badge variant={plan.is_active ? "secondary" : "outline"}>{plan.is_active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <span className="font-semibold">Mensal:</span> R$ {priceMonthly.toFixed(2)}
                </p>
                <p>
                  <span className="font-semibold">Anual:</span> {priceYearly !== null ? `R$ ${priceYearly.toFixed(2)}` : "Não definido"}
                </p>
                <p>
                  <span className="font-semibold">Stripe price ID:</span> {plan.stripe_price_id ?? "-"}
                </p>
                <p>
                  <span className="font-semibold">Ordem:</span> {plan.sort_order ?? 0}
                </p>
                <div>
                  <span className="font-semibold">Benefícios:</span>
                  <ul className="ml-4 mt-2 list-disc space-y-1 text-muted-foreground">
                    {(plan.features ?? []).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                {editing ? (
                  <PlanForm
                    mode="edit"
                    initialValues={plan}
                    submitting={loading}
                    onSubmit={(values) => handleUpdate(plan.id, values)}
                    onCancel={() => setEditingPlanId(null)}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingPlanId(plan.id)} disabled={loading}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={plan.is_active ? "outline" : "secondary"}
                      onClick={() => handleToggleActive(plan)}
                      disabled={loading}
                    >
                      {plan.is_active ? "Desativar" : "Reativar"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleSoftDelete(plan)} disabled={loading}>
                      Remover
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Última atualização: {new Date(plan.updated_at).toLocaleString("pt-BR")}
                </p>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
