import { DEFAULT_SYSTEM_PROMPT } from "@/lib/plans";

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekResponse {
  id: string;
  content: string;
}

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  console.warn("DEEPSEEK_API_KEY is not set. Calls to DeepSeek will fail until you provide it.");
}

export const callDeepSeek = async (messages: DeepSeekMessage[]): Promise<DeepSeekResponse> => {
  if (!apiKey) {
    throw new Error("Missing DeepSeek API key");
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: "system", content: DEFAULT_SYSTEM_PROMPT }, ...messages],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${error}`);
  }

  const data = await response.json();

  const content = data.choices?.[0]?.message?.content ?? "";

  return {
    id: data.id ?? crypto.randomUUID(),
    content
  };
};
