import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import "./globals.css";

import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "HH3 Mentor de Roleta",
  description: "Mentor HH3 especializado em roleta europeia, disponível via chat com o Método 3 – Estratégia de Zonas."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return (
    <html lang="pt-BR">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var key = 'hh3-theme';
                var stored = window.localStorage.getItem(key);
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (error) {
                console.warn('Falha ao aplicar o tema salvo', error);
              }
            `.replace(/\s+/g, " ")
          }}
        />
        <SupabaseProvider initialSession={session}>
          {children}
        </SupabaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
