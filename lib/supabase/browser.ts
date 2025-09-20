"use client";

import { createBrowserSupabaseClient as createSupabaseBrowserClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/types/database";

export const createBrowserSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase browser env vars");
  }

  return createSupabaseBrowserClient<Database>({ supabaseUrl: url, supabaseKey: anonKey });
};
