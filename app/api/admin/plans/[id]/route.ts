import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const parseFeatures = (input: unknown): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((item) => String(item)).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const planId = params.id;
  const payload = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    priceMonthly?: number;
    priceYearly?: number | null;
    features?: string[] | string;
    isActive?: boolean;
    sortOrder?: number;
  };

  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Acesso não permitido" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    const value = payload.name.trim();
    if (!value) {
      return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
    }
    updates.name = value;
  }
  if (payload.description !== undefined) {
    const value = payload.description.trim();
    if (!value) {
      return NextResponse.json({ error: "Descrição inválida" }, { status: 400 });
    }
    updates.description = value;
  }
  if (payload.priceMonthly !== undefined) {
    const value = Number(payload.priceMonthly);
    updates.price_monthly = Number.isFinite(value) ? value : 0;
  }
  if (payload.priceYearly !== undefined) {
    if (payload.priceYearly === null) {
      updates.price_yearly = null;
    } else {
      const value = Number(payload.priceYearly);
      updates.price_yearly = Number.isFinite(value) ? value : null;
    }
  }
  if (payload.features !== undefined) updates.features = parseFeatures(payload.features);
  if (payload.isActive !== undefined) updates.is_active = payload.isActive;
  if (payload.sortOrder !== undefined) {
    const value = Number(payload.sortOrder);
    updates.sort_order = Number.isFinite(value) ? value : 0;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração fornecida" }, { status: 400 });
  }

  const { error } = await supabase
    .from("plans")
    .update(updates)
    .eq("id", planId);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message ?? "Não foi possível atualizar o plano" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const planId = params.id;
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Acesso não permitido" }, { status: 403 });
  }

  const { error } = await supabase
    .from("plans")
    .update({ is_active: false })
    .eq("id", planId);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message ?? "Não foi possível remover o plano" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
