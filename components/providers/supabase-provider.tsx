"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import type { Session } from "@supabase/supabase-js";
import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface SupabaseProviderProps {
  initialSession: Session | null;
  children: React.ReactNode;
}

export function SupabaseProvider({ initialSession, children }: SupabaseProviderProps) {
  const [supabase] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}
