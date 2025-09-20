import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "HH3 Chat Copilot",
  description: "Plataforma SaaS para conversar com o agente IA DeepSeek com planos de assinatura."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return (
    <html lang="pt-BR">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <SupabaseProvider initialSession={session}>
          {children}
        </SupabaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
