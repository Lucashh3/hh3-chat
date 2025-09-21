"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Visão geral", href: "/admin" },
  { label: "Usuários", href: "/admin/users" },
  { label: "Configurações", href: "/admin/settings", disabled: true }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-card/60 p-4 md:flex md:flex-col">
      <div className="mb-6 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Navegação</div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/60"
              >
                {item.label}
                <span className="ml-2 text-xs text-muted-foreground/50">Em breve</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
