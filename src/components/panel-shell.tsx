"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  Code2,
  CreditCard,
  Globe,
  Handshake,
  Layers,
  List,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { BlackFridayTopBanner } from "./black-friday-ui";
import {
  AppCurrency,
  AppLocale,
  formatMoney,
  getDictionary,
} from "@/lib/i18n";

export interface PanelUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  balance: number;
  totalSpent: number;
  apiKey: string;
  referralCode: string;
}

interface PanelShellProps {
  brandName: string;
  announcement: string;
  user: PanelUser;
  locale?: AppLocale;
  currency?: AppCurrency;
  usdRate?: number;
  eurRate?: number;
  blackFridayActive?: boolean;
  children: React.ReactNode;
}

export function PanelShell({
  brandName,
  announcement,
  user,
  locale = "pt",
  currency = "BRL",
  usdRate = 5.5,
  eurRate = 6.0,
  blackFridayActive = false,
  children,
}: PanelShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(Boolean(announcement));
  const t = getDictionary(locale);
  const rates = { usdRate, eurRate };

  const clientMenu = [
    { href: "/painel", label: t.sidebar.newOrder, icon: PlusCircle },
    { href: "/painel/massa", label: t.sidebar.massOrder, icon: Layers },
    { href: "/painel/assinaturas", label: t.sidebar.subscriptions, icon: Repeat },
    { href: "/painel/servicos", label: t.sidebar.services, icon: List },
    { href: "/painel/pedidos", label: t.sidebar.orders, icon: ShoppingBag },
    { href: "/painel/saldo", label: t.sidebar.addFunds, icon: CreditCard },
    { href: "/painel/afiliados", label: t.sidebar.affiliates, icon: Users },
    { href: "/painel/painel-filho", label: t.sidebar.childPanel, icon: Globe },
    { href: "/painel/parcerias", label: t.sidebar.cooperation, icon: Handshake },
    { href: "/painel/tickets", label: t.sidebar.tickets, icon: MessageSquare },
    { href: "/painel/atualizacoes", label: t.sidebar.updates, icon: Bell },
    { href: "/painel/conta", label: t.sidebar.account, icon: Code2 },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="panel-dark min-h-screen flex bg-[#110c21] text-[#f7f3ff]">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[#2e244d] bg-[#130d26]">
        <div className="h-16 flex items-center px-5 border-b border-[#2e244d]">
          <BrandLogo name={brandName} href="/painel" inverted />
        </div>

        <div className="p-4 border-b border-[#2e244d] bg-[#18122d]">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#b7afc9]">
            {t.sidebar.availableBalance}
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#b889ff]">
            {formatMoney(user.balance, currency, rates)}
          </div>
          {user.role === "ADMIN" && (
            <div className="mt-1.5 inline-block rounded-full border border-[#fc8ad4]/40 bg-[#fc8ad4]/12 px-2.5 py-0.5 font-mono text-[10px] uppercase text-[#fc8ad4]">
              ADMIN • USO GRÁTIS ILIMITADO
            </div>
          )}
          <Link
            href="/painel/saldo"
            className="mt-3 btn-lime flex h-9 w-full items-center justify-center font-mono text-[11px] uppercase tracking-wider"
          >
            {t.sidebar.addFundsBtn}
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Menu do painel">
          {clientMenu.map((item) => {
            const active =
              item.href === "/painel"
                ? pathname === "/painel"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium border transition-colors ${
                  active
                    ? "border-[#8c42ed] bg-[#7c3ee9]/20 text-white"
                    : "border-transparent text-[#b7afc9] hover:bg-[#1f1738] hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          {user.role === "ADMIN" && (
            <div className="pt-3 mt-3 border-t border-[#2e244d] space-y-1.5">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-mono uppercase tracking-wider border ${
                  pathname.startsWith("/dashboard")
                    ? "border-[#f8d449] bg-[#f8d449]/15 text-[#f8d449]"
                    : "border-[#f8d449]/40 text-[#f8d449] hover:bg-[#f8d449]/10"
                }`}
              >
                <Activity className="h-4 w-4 shrink-0" />
                Dashboard Dono
              </Link>
              <Link
                href="/admin"
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-mono uppercase tracking-wider border ${
                  pathname.startsWith("/admin")
                    ? "border-[#fc8ad4] bg-[#fc8ad4]/15 text-[#fc8ad4]"
                    : "border-[#fc8ad4]/40 text-[#fc8ad4] hover:bg-[#fc8ad4]/10"
                }`}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {t.sidebar.adminPanel}
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-[#2e244d] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-[#f7f3ff]">
              @{user.username}
            </div>
            <div className="truncate font-mono text-[10px] text-[#8b80a6]">
              {t.sidebar.spent}: {formatMoney(user.totalSpent, currency, rates)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title={t.sidebar.logout}
            aria-label={t.sidebar.logout}
            className="rounded-lg p-2 border border-[#2e244d] text-[#b7afc9] hover:border-[#EF4444] hover:text-[#F87171] cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Drawer Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 max-w-[85vw] bg-[#130d26] border-r border-[#2e244d] flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#2e244d]">
              <BrandLogo name={brandName} href="/painel" inverted />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 text-[#b7afc9] cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {clientMenu.map((item) => {
                const active =
                  item.href === "/painel"
                    ? pathname === "/painel"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium border ${
                      active
                        ? "border-[#8c42ed] bg-[#7c3ee9]/20 text-white"
                        : "border-transparent text-[#b7afc9]"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              {user.role === "ADMIN" && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-mono uppercase border border-[#f8d449]/40 text-[#f8d449]"
                  >
                    <Activity className="h-4 w-4" />
                    Dashboard Dono
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="mt-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-mono uppercase border border-[#fc8ad4]/40 text-[#fc8ad4]"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {t.sidebar.adminPanel}
                  </Link>
                </>
              )}
            </nav>
            <div className="p-4 border-t border-[#2e244d] space-y-3">
              <LocaleSwitcher locale={locale} currency={currency} compact dark />
              <button
                type="button"
                onClick={handleLogout}
                className="btn-outline w-full h-10 flex items-center justify-center gap-2 font-mono text-xs uppercase cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                {t.sidebar.logout}
              </button>
            </div>
          </div>
          <div
            className="flex-1 bg-black/75"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Área Principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-[#2e244d] bg-[#130d26] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-lg p-2 border border-[#2e244d] text-[#f7f3ff] cursor-pointer"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <BrandLogo name={brandName} href="/painel" compact inverted />
            </div>
            <span className="hidden md:inline font-mono text-xs uppercase tracking-widest text-[#b7afc9]">
              {t.sidebar.operationalPanel} • {user.name}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block">
              <LocaleSwitcher locale={locale} currency={currency} compact dark />
            </div>
            <Link
              href="/painel/saldo"
              className="rounded-lg border border-[#8c42ed]/50 bg-[#7c3ee9]/20 px-3 py-1.5 font-mono text-xs text-[#e3d1ff] font-bold whitespace-nowrap"
            >
              {formatMoney(user.balance, currency, rates)}
            </Link>
            <Link
              href="/api-docs"
              className="hidden sm:inline-flex btn-outline h-8 items-center px-3 font-mono text-[11px] uppercase"
            >
              {t.sidebar.apiDocs}
            </Link>
          </div>
        </header>

        {blackFridayActive && <BlackFridayTopBanner />}

        {showBanner && announcement && (
          <div className="border-b border-[#8c42ed]/35 bg-[#7c3ee9]/15 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <p className="font-mono text-xs text-[#e5d4ff]">{announcement}</p>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="text-[#c8a8ff] hover:text-white cursor-pointer shrink-0"
              aria-label="Ocultar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
