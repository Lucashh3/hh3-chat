import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

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

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  const query = supabase
    .from("plans")
    .select("id, name, description, price_monthly, price_yearly, features, is_active, sort_order, updated_at")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (!includeInactive) {
    query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível carregar os planos" }, { status: 500 });
  }

  return NextResponse.json({ plans: data ?? [] });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    id?: string;
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

  const name = payload.name?.trim();
  const description = payload.description?.trim();

  if (!name || !description) {
    return NextResponse.json({ error: "Nome e descrição são obrigatórios" }, { status: 400 });
  }

  const id = (payload.id?.trim() || slugify(name) || `plan-${Date.now()}`).slice(0, 40);
  const features = parseFeatures(payload.features);

  const priceMonthly = Number(payload.priceMonthly ?? 0);
  const priceYearly =
    payload.priceYearly === null || payload.priceYearly === undefined ? null : Number(payload.priceYearly);
  const sortOrder = payload.sortOrder !== undefined ? Number(payload.sortOrder) : 0;
  const { error } = await supabase.from("plans").insert({
    id,
    name,
    description,
    price_monthly: Number.isFinite(priceMonthly) ? priceMonthly : 0,
    price_yearly: priceYearly !== null && Number.isFinite(priceYearly) ? priceYearly : null,
    features,
    is_active: payload.isActive ?? true,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message ?? "Não foi possível criar o plano" }, { status: 500 });
  }

  return NextResponse.json({ success: true, id });
}
