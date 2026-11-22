"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Code2,
  CreditCard,
  Layers,
  List,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { formatBRL } from "@/lib/format";

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
  children: React.ReactNode;
}

const CLIENT_MENU = [
  { href: "/painel", label: "Novo Pedido", icon: PlusCircle },
  { href: "/painel/massa", label: "Pedido em Massa", icon: Layers },
  { href: "/painel/servicos", label: "Serviços", icon: List },
  { href: "/painel/pedidos", label: "Meus Pedidos", icon: ShoppingBag },
  { href: "/painel/saldo", label: "Adicionar Saldo", icon: CreditCard },
  { href: "/painel/afiliados", label: "Afiliados", icon: Users },
  { href: "/painel/tickets", label: "Tickets", icon: MessageSquare },
  { href: "/painel/atualizacoes", label: "Atualizações", icon: Bell },
  { href: "/painel/conta", label: "Conta & API", icon: Code2 },
];

export function PanelShell({
  brandName,
  announcement,
  user,
  children,
}: PanelShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(Boolean(announcement));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-[#090A0C] text-[#F4F5F6]">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[#232730] bg-[#0D0F13]">
        <div className="h-16 flex items-center px-5 border-b border-[#232730]">
          <BrandLogo name={brandName} href="/painel" />
        </div>

        <div className="p-4 border-b border-[#232730] bg-[#111317]">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#98A0AD]">
            Saldo Disponível
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#C8FF2E]">
            {formatBRL(user.balance)}
          </div>
          <Link
            href="/painel/saldo"
            className="mt-3 btn-lime flex h-9 w-full items-center justify-center font-mono text-[11px] uppercase tracking-wider"
          >
            + Recarregar Pix
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Menu do painel">
          {CLIENT_MENU.map((item) => {
            const active =
              item.href === "/painel"
                ? pathname === "/painel"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium border transition-colors ${
                  active
                    ? "border-[#C8FF2E] bg-[#C8FF2E]/10 text-[#C8FF2E]"
                    : "border-transparent text-[#98A0AD] hover:bg-[#171A20] hover:text-[#F4F5F6]"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          {user.role === "ADMIN" && (
            <div className="pt-3 mt-3 border-t border-[#232730]">
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-mono uppercase tracking-wider border ${
                  pathname.startsWith("/admin")
                    ? "border-[#FF6B2C] bg-[#FF6B2C]/15 text-[#FF8A58]"
                    : "border-[#FF6B2C]/40 text-[#FF8A58] hover:bg-[#FF6B2C]/10"
                }`}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Painel Admin
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-[#232730] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-[#F4F5F6]">
              @{user.username}
            </div>
            <div className="truncate font-mono text-[10px] text-[#68707E]">
              Gasto: {formatBRL(user.totalSpent)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sair"
            aria-label="Sair"
            className="p-2 border border-[#232730] text-[#98A0AD] hover:border-[#EF4444] hover:text-[#F87171] cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Drawer Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 max-w-[85vw] bg-[#0D0F13] border-r border-[#232730] flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#232730]">
              <BrandLogo name={brandName} href="/painel" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 text-[#98A0AD] cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {CLIENT_MENU.map((item) => {
                const active =
                  item.href === "/painel"
                    ? pathname === "/painel"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium border ${
                      active
                        ? "border-[#C8FF2E] bg-[#C8FF2E]/10 text-[#C8FF2E]"
                        : "border-transparent text-[#98A0AD]"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="mt-3 flex items-center gap-3 px-3 py-2.5 text-sm font-mono uppercase border border-[#FF6B2C]/40 text-[#FF8A58]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Painel Admin
                </Link>
              )}
            </nav>
            <div className="p-4 border-t border-[#232730]">
              <button
                type="button"
                onClick={handleLogout}
                className="btn-outline w-full h-10 flex items-center justify-center gap-2 font-mono text-xs uppercase cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sair da Conta
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
        <header className="h-16 border-b border-[#232730] bg-[#0D0F13] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 border border-[#232730] text-[#F4F5F6] cursor-pointer"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <BrandLogo name={brandName} href="/painel" compact />
            </div>
            <span className="hidden sm:inline font-mono text-xs uppercase tracking-widest text-[#98A0AD]">
              Painel Operacional • {user.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/painel/saldo"
              className="border border-[#C8FF2E]/40 bg-[#C8FF2E]/10 px-3 py-1.5 font-mono text-xs text-[#C8FF2E] font-bold"
            >
              Saldo: {formatBRL(user.balance)}
            </Link>
            <Link
              href="/api-docs"
              className="hidden sm:inline-flex btn-outline h-9 items-center px-3 font-mono text-[11px] uppercase"
            >
              Docs API
            </Link>
          </div>
        </header>

        {showBanner && announcement && (
          <div className="border-b border-[#FF6B2C]/30 bg-[#FF6B2C]/10 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
            <p className="font-mono text-xs text-[#FFB393]">{announcement}</p>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="text-[#FF8A58] hover:text-[#F4F5F6] cursor-pointer shrink-0"
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
