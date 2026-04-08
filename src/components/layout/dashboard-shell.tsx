"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileStack,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  MessageSquareQuote,
  Wallet,
} from "lucide-react";
import { TenantSwitcher } from "@/components/layout/tenant-switcher";
import { NotificationBell } from "@/components/layout/notification-bell";
import { CurrencySwitcher } from "@/components/layout/currency-switcher";
import { ToastStack } from "@/components/ui/toast-stack";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { StorekeeperLogo } from "@/components/brand/storekeeper-brand";
import { DisplayCurrencyProvider } from "@/components/providers/display-currency-provider";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/documents", label: "Documents", icon: FileStack },
  { href: "/dashboard/reports/cashflow", label: "Cash flow", icon: Wallet },
  { href: "/dashboard/reports/expenses", label: "Expenses", icon: BarChart3 },
  { href: "/dashboard/reports/trends", label: "Trends", icon: LineChart },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: ListOrdered,
  },
  {
    href: "/dashboard/insights/ask",
    label: "Insights",
    icon: MessageSquareQuote,
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <DisplayCurrencyProvider>
    <div className="flex min-h-screen w-full bg-background">
      <ToastStack />
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface-2 md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
          >
            <StorekeeperLogo className="size-8" />
            Storekeeper
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/20 text-foreground shadow-[0_0_16px_rgba(108,59,255,0.12)] ring-1 ring-primary/25"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-sm md:px-6">
          <div className="font-medium text-muted-foreground md:hidden">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-foreground"
            >
              <StorekeeperLogo className="size-7" />
              Storekeeper
            </Link>
          </div>
          <div className="ms-auto flex flex-wrap items-center justify-end gap-2">
            <CurrencySwitcher />
            <ThemeToggle />
            <NotificationBell />
            <TenantSwitcher />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
    </DisplayCurrencyProvider>
  );
}
