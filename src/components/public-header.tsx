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
  routePrefix?: "" | "/en" | "/pt";
}

export function PublicHeader({
  brandName,
  user,
  locale = "en",
  currency = "USD",
  routePrefix = "",
}: PublicHeaderProps) {
  const t = getDictionary(locale);

  const navLinks = [
    { href: `${routePrefix}/instagram`, label: t.nav.instagram },
    { href: `${routePrefix}/tiktok`, label: t.nav.tiktok },
    { href: `${routePrefix}/youtube`, label: t.nav.youtube },
    { href: "/servicos", label: t.nav.services },
    { href: "/api-docs", label: t.nav.api },
  ];

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="mx-auto max-w-[1120px] rounded-[17px] border border-[#ece5f2] bg-white/92 backdrop-blur-md shadow-[0_12px_32px_rgba(52,27,76,0.07)]">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo name={brandName} />

          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-6"
          >
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-[#3f3947] hover:text-[#7c3ee9] transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block">
              <LocaleSwitcher locale={locale} currency={currency} compact />
            </div>

            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="btn-outline inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold whitespace-nowrap"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-[#7c3ee9]" />
                    {t.nav.admin}
                  </Link>
                )}
                <Link
                  href="/painel"
                  className="btn-lime inline-flex h-9 items-center gap-1.5 px-4 text-xs font-bold whitespace-nowrap"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {t.nav.panel}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex h-9 items-center px-3 text-sm font-semibold text-[#18141d] hover:text-[#7c3ee9] transition-colors whitespace-nowrap"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/login?tab=register"
                  className="btn-lime inline-flex h-9 items-center gap-1.5 px-4 text-xs sm:text-sm font-bold whitespace-nowrap"
                >
                  {t.nav.register}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="flex lg:hidden items-center justify-between gap-2 overflow-x-auto border-t border-[#ece5f2] bg-[#faf8fd]/90 px-4 py-2 rounded-b-[17px]"
        >
          <div className="flex items-center gap-4">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-semibold text-[#554e5f] hover:text-[#7c3ee9] whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="sm:hidden shrink-0">
            <LocaleSwitcher locale={locale} currency={currency} compact />
          </div>
        </nav>
      </div>
    </header>
  );
}
