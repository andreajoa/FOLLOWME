import Link from "next/link";
import { ArrowUpRight, LayoutDashboard, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./brand-logo";

interface PublicHeaderProps {
  brandName: string;
  user?: { username: string; role: string } | null;
}

const NAV_LINKS = [
  { href: "/servicos", label: "Serviços" },
  { href: "/api-docs", label: "API v2" },
  { href: "/faq", label: "FAQ" },
  { href: "/termos", label: "Termos" },
];

export function PublicHeader({ brandName, user }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#090A0C] border-b border-[#232730]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo name={brandName} />

        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#98A0AD] hover:text-[#C8FF2E] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="btn-outline inline-flex h-10 items-center gap-1.5 px-3 text-xs font-mono uppercase tracking-wider"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B2C]" />
                  Admin
                </Link>
              )}
              <Link
                href="/painel"
                className="btn-lime inline-flex h-10 items-center gap-1.5 px-4 text-xs font-mono uppercase tracking-wider"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Painel (@{user.username})
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-outline inline-flex h-10 items-center px-4 text-xs font-mono uppercase tracking-wider"
              >
                Entrar
              </Link>
              <Link
                href="/login?tab=register"
                className="btn-lime inline-flex h-10 items-center gap-1.5 px-4 text-xs font-mono uppercase tracking-wider"
              >
                Criar Conta
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>

      <nav
        aria-label="Navegação mobile"
        className="flex md:hidden items-center justify-around border-t border-[#232730] bg-[#111317] px-2 py-2"
      >
        {NAV_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-xs font-mono uppercase tracking-wider text-[#98A0AD] hover:text-[#C8FF2E] px-2 py-1"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
