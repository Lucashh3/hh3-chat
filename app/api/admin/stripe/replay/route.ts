import { NextResponse } from "next/server";

import { applyStripeEvent } from "@/lib/stripe-events";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: Request) {
  const { eventId } = (await request.json().catch(() => ({}))) as { eventId?: string };

  if (!eventId) {
    return NextResponse.json({ error: "eventId é obrigatório" }, { status: 400 });
  }

  const supabaseRoute = createSupabaseRouteHandlerClient();
  const {
    data: { session }
  } = await supabaseRoute.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Acesso não permitido" }, { status: 403 });
  }

  const adminClient = createAdminSupabaseClient();

  const { data: record, error } = (await adminClient
    .from("stripe_webhook_events")
    .select("payload")
    .eq("stripe_event_id", eventId)
    .maybeSingle<{
      payload: Database["public"]["Tables"]["stripe_webhook_events"]["Row"]["payload"];
    }>();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível carregar o evento" }, { status: 500 });
  }

  const payload = record?.payload as unknown;

  if (!payload) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  let status: "processed" | "error" = "processed";
  let errorMessage: string | null = null;

  try {
    await applyStripeEvent(payload as any, adminClient);
  } catch (replayError) {
    status = "error";
    errorMessage = replayError instanceof Error ? replayError.message : String(replayError);
    console.error("Falha ao reprocesar evento Stripe", replayError);
  }

  try {
    await adminClient
      .from("stripe_webhook_events")
      .upsert(
        {
          stripe_event_id: eventId,
          status,
          error_message: errorMessage,
          processed_at: status === "processed" ? new Date().toISOString() : null
        },
        { onConflict: "stripe_event_id" }
      );
  } catch (logError) {
    console.error("Não foi possível atualizar status do webhook", logError);
  }

  if (status === "error") {
    return NextResponse.json({ error: errorMessage ?? "Falha ao reprocesar evento" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
