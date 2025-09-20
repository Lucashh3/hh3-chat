"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";

const NAV_ITEMS = [
  { label: "Método 3", href: "#features" },
  { label: "Planos", href: "#pricing" },
  { label: "Mentoria", href: "#how-it-works" }
];

export function Navbar({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          HH3 Mentor de Roleta
        </Link>
        <div className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              {NAV_ITEMS.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Planos</NavigationMenuTrigger>
                <NavigationMenuContent className="grid w-[320px] gap-3 p-4">
                  {PLANS.map((plan) => (
                    <Link
                      href={pathname === "/" ? "#pricing" : "/#pricing"}
                      key={plan.id}
                      className="block rounded-lg border bg-card p-3 text-sm transition hover:bg-accent"
                    >
                      <div className="font-semibold">{plan.name}</div>
                      <p className="text-muted-foreground">{plan.description}</p>
                    </Link>
                  ))}
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-2">
          {authenticated ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/settings">Configurações</Link>
              </Button>
              <Button asChild>
                <Link href="/chat">Falar com HH3</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Criar conta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
