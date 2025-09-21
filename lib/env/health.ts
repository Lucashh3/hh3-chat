interface EnvCheck {
  key: string;
  label: string;
  required: boolean;
  placeholderTokens?: string[];
}

export type EnvStatus = {
  key: string;
  label: string;
  status: "ok" | "warning" | "missing";
  message?: string;
  valuePreview?: string;
  required: boolean;
};

const CRITICAL_ENVS: EnvCheck[] = [
  { key: "DEEPSEEK_API_KEY", label: "DeepSeek API Key", required: true },
  { key: "STRIPE_SECRET_KEY", label: "Stripe Secret Key", required: true },
  { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe Webhook Secret", required: true },
  { key: "NEXT_PUBLIC_APP_URL", label: "App URL", required: true },
  { key: "ADMIN_EMAILS", label: "Admin Emails", required: true },
  {
    key: "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID",
    label: "Stripe Price ID (Pro)",
    required: false,
    placeholderTokens: ["placeholder"]
  },
  {
    key: "NEXT_PUBLIC_STRIPE_VIP_PRICE_ID",
    label: "Stripe Price ID (VIP)",
    required: false,
    placeholderTokens: ["placeholder"]
  }
];

const normalizeValue = (value: string | undefined | null) => value?.trim() ?? "";

const isPlaceholder = (value: string, tokens: string[] = []) => {
  if (!value) return false;
  const lowered = value.toLowerCase();
  return tokens.some((token) => lowered.includes(token));
};

export const getEnvHealth = (): EnvStatus[] => {
  return CRITICAL_ENVS.map((env) => {
    const raw = process.env[env.key];
    const value = normalizeValue(raw);
    const preview = value ? (value.length > 6 ? `${value.slice(0, 6)}…` : value) : undefined;

    if (!value) {
      return {
        key: env.key,
        label: env.label,
        status: env.required ? "missing" : "warning",
        message: env.required
          ? "Configuração obrigatória ausente"
          : "Recomendado preencher para integrações completas",
        valuePreview: undefined,
        required: env.required
      } satisfies EnvStatus;
    }

    if (env.placeholderTokens && isPlaceholder(value, env.placeholderTokens)) {
      return {
        key: env.key,
        label: env.label,
        status: "warning",
        message: "Valor ainda utiliza placeholder",
        valuePreview: preview,
        required: env.required
      } satisfies EnvStatus;
    }

    if (env.key === "ADMIN_EMAILS") {
      const emails = value.split(",").map((item) => item.trim()).filter(Boolean);
      if (!emails.length) {
        return {
          key: env.key,
          label: env.label,
          status: "missing",
          message: "Informe ao menos um e-mail administrador",
          required: env.required
        } satisfies EnvStatus;
      }
    }

    return {
      key: env.key,
      label: env.label,
      status: "ok",
      valuePreview: preview,
      required: env.required
    } satisfies EnvStatus;
  });
};
