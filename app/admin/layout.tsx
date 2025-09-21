import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/sidebar";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/admin");
  }

  const email = session.user.email?.toLowerCase() ?? "";
  if (!ADMIN_EMAILS.includes(email)) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", session.user.id);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div>
            <p className="text-sm font-semibold tracking-tight">Painel HH3</p>
            <p className="text-xs text-muted-foreground">Gerencie usuários, planos e comportamento do mentor</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{session.user.email}</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/chat">Voltar ao chat</Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
