import Link from "next/link";
import { ArrowUpRight, LayoutDashboard, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { AppCurrency, AppLocale, getDictionary } from "@/lib/i18n";

interface PublicHeaderProps {
  brandName: string;
  user?: { username: string; role: string } | null;
  locale?: AppLocale;
  currency?: AppCurrency;
}

export function PublicHeader({
  brandName,
  user,
  locale = "pt",
  currency = "BRL",
}: PublicHeaderProps) {
  const t = getDictionary(locale);

  const navLinks = [
    { href: "/servicos", label: t.nav.services },
    { href: "/api-docs", label: t.nav.api },
    { href: "/parcerias", label: t.nav.cooperation },
    { href: "/faq", label: t.nav.faq },
    { href: "/termos", label: t.nav.terms },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#090A0C] border-b border-[#232730]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <BrandLogo name={brandName} />

        <nav
          aria-label="Navegação principal"
          className="hidden lg:flex items-center gap-6"
        >
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#98A0AD] hover:text-[#C8FF2E] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LocaleSwitcher locale={locale} currency={currency} compact />
          </div>

          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="btn-outline inline-flex h-9 items-center gap-1.5 px-3 text-xs font-mono uppercase tracking-wider"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B2C]" />
                  {t.nav.admin}
                </Link>
              )}
              <Link
                href="/painel"
                className="btn-lime inline-flex h-9 items-center gap-1.5 px-3.5 text-xs font-mono uppercase tracking-wider"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                {t.nav.panel} (@{user.username})
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-outline inline-flex h-9 items-center px-3.5 text-xs font-mono uppercase tracking-wider"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/login?tab=register"
                className="btn-lime inline-flex h-9 items-center gap-1.5 px-3.5 text-xs font-mono uppercase tracking-wider"
              >
                {t.nav.register}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>

      <nav
        aria-label="Navegação mobile"
        className="flex lg:hidden items-center justify-between gap-2 overflow-x-auto border-t border-[#232730] bg-[#111317] px-3 py-2"
      >
        <div className="flex items-center gap-3">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-mono uppercase tracking-wider text-[#98A0AD] hover:text-[#C8FF2E] whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="sm:hidden shrink-0">
          <LocaleSwitcher locale={locale} currency={currency} compact />
        </div>
      </nav>
    </header>
  );
}
