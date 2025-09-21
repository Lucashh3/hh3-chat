import { NextResponse } from "next/server";

import { DEFAULT_SYSTEM_PROMPT } from "@/lib/plans";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

interface PromptHistoryEntry {
  prompt: string;
  updatedAt: string | null;
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const SETTINGS_KEY = "system_prompt";
const HISTORY_KEY = `${SETTINGS_KEY}_history`;
const HISTORY_LIMIT = 10;

const parseHistory = (value?: string | null): PromptHistoryEntry[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((entry): entry is PromptHistoryEntry =>
          typeof entry === "object" && entry !== null && typeof entry.prompt === "string"
        )
        .map((entry) => ({ prompt: entry.prompt, updatedAt: entry.updatedAt ?? null }));
    }
    return [];
  } catch (error) {
    console.error("Falha ao interpretar histórico do prompt", error);
    return [];
  }
};

const serializeHistory = (history: PromptHistoryEntry[]) => JSON.stringify(history);

const asISOString = (date: Date | string | null | undefined) => {
  if (!date) return null;
  if (typeof date === "string") {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return date.toISOString();
};

const upsertSetting = async (
  supabase: ReturnType<typeof createSupabaseRouteHandlerClient>,
  key: string,
  value: string,
  updatedAt: string
) =>
  supabase
    .from("admin_settings")
    .upsert({
      key,
      value,
      updated_at: updatedAt
    });

export async function PATCH(request: Request) {
  const { prompt } = (await request.json().catch(() => ({}))) as { prompt?: string };

  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt inválido" }, { status: 400 });
  }

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

  const now = new Date().toISOString();

  const [{ data: currentSetting }, { data: historySetting }] = await Promise.all([
    supabase.from("admin_settings").select("value, updated_at").eq("key", SETTINGS_KEY).maybeSingle(),
    supabase.from("admin_settings").select("value").eq("key", HISTORY_KEY).maybeSingle()
  ]);

  const history = parseHistory(historySetting?.value);

  const previousPrompt = typeof currentSetting?.value === "string" ? currentSetting.value : null;
  const previousUpdatedAt = asISOString(currentSetting?.updated_at) ?? now;

  if (previousPrompt && previousPrompt !== prompt) {
    history.unshift({ prompt: previousPrompt, updatedAt: previousUpdatedAt });
  }

  const trimmedHistory = history.slice(0, HISTORY_LIMIT);

  const [{ error: promptError }, { error: historyError }] = await Promise.all([
    upsertSetting(supabase, SETTINGS_KEY, prompt, now),
    upsertSetting(supabase, HISTORY_KEY, serializeHistory(trimmedHistory), now)
  ]);

  if (promptError || historyError) {
    console.error(promptError ?? historyError);
    return NextResponse.json({ error: "Não foi possível atualizar o prompt" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const { action } = (await request.json().catch(() => ({}))) as { action?: string };

  if (action !== "reset") {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

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

  const now = new Date().toISOString();

  const [{ data: currentSetting }, { data: historySetting }] = await Promise.all([
    supabase.from("admin_settings").select("value, updated_at").eq("key", SETTINGS_KEY).maybeSingle(),
    supabase.from("admin_settings").select("value").eq("key", HISTORY_KEY).maybeSingle()
  ]);

  const history = parseHistory(historySetting?.value);
  const previousPrompt = typeof currentSetting?.value === "string" ? currentSetting.value : null;
  const previousUpdatedAt = asISOString(currentSetting?.updated_at) ?? now;

  if (previousPrompt && previousPrompt !== DEFAULT_SYSTEM_PROMPT) {
    history.unshift({ prompt: previousPrompt, updatedAt: previousUpdatedAt });
  }

  const trimmedHistory = history.slice(0, HISTORY_LIMIT);

  const [{ error: promptError }, { error: historyError }] = await Promise.all([
    upsertSetting(supabase, SETTINGS_KEY, DEFAULT_SYSTEM_PROMPT, now),
    upsertSetting(supabase, HISTORY_KEY, serializeHistory(trimmedHistory), now)
  ]);

  if (promptError || historyError) {
    console.error(promptError ?? historyError);
    return NextResponse.json({ error: "Não foi possível restaurar o prompt" }, { status: 500 });
  }

  return NextResponse.json({ success: true, prompt: DEFAULT_SYSTEM_PROMPT, updatedAt: now });
}

export async function GET() {
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

  const [{ data: promptSetting, error: promptError }, { data: historySetting, error: historyError }] = await Promise.all([
    supabase
      .from("admin_settings")
      .select("value, updated_at")
      .eq("key", SETTINGS_KEY)
      .maybeSingle(),
    supabase
      .from("admin_settings")
      .select("value")
      .eq("key", HISTORY_KEY)
      .maybeSingle()
  ]);

  if (promptError || historyError) {
    console.error(promptError ?? historyError);
    return NextResponse.json({ error: "Não foi possível carregar o prompt" }, { status: 500 });
  }

  const history = parseHistory(historySetting?.value);
  const prompt = typeof promptSetting?.value === "string" ? promptSetting.value : DEFAULT_SYSTEM_PROMPT;
  const updatedAt = promptSetting?.updated_at ?? null;

  return NextResponse.json({ prompt, updatedAt, history, defaultPrompt: DEFAULT_SYSTEM_PROMPT });
}
