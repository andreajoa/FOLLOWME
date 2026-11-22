"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import {
  AppCurrency,
  AppLocale,
  defaultCurrencyForLocale,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
} from "@/lib/i18n";

interface LocaleSwitcherProps {
  locale: AppLocale;
  currency: AppCurrency;
  compact?: boolean;
}

export function LocaleSwitcher({
  locale,
  currency,
  compact = false,
}: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  async function updatePref(next: { locale?: AppLocale; currency?: AppCurrency }) {
    setBusy(true);
    try {
      const resolvedCurrency =
        next.currency ??
        (next.locale ? defaultCurrencyForLocale(next.locale) : undefined);

      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: next.locale,
          currency: resolvedCurrency,
        }),
      });

      if (next.locale && (pathname.startsWith("/en") || pathname.startsWith("/pt"))) {
        const stripped = pathname.replace(/^\/(en|pt)(?=\/|$)/, "") || "";
        const targetPrefix = next.locale === "pt" ? "/pt" : "/en";
        router.push(`${targetPrefix}${stripped}`);
        router.refresh();
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
      <label className="sr-only" htmlFor="fm-locale-select">
        Language
      </label>
      <div className="inline-flex items-center border border-[#232730] bg-[#111317] px-2 h-8">
        <Globe className="h-3 w-3 text-[#C8FF2E] mr-1.5 shrink-0" />
        <select
          id="fm-locale-select"
          disabled={busy}
          value={locale}
          onChange={(e) => updatePref({ locale: e.target.value as AppLocale })}
          className="bg-transparent text-[#F4F5F6] focus:outline-none cursor-pointer uppercase"
        >
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l.code} value={l.code} className="bg-[#111317]">
              {compact ? l.short : l.label}
            </option>
          ))}
        </select>
      </div>

      <label className="sr-only" htmlFor="fm-currency-select">
        Currency
      </label>
      <div className="inline-flex items-center border border-[#232730] bg-[#111317] px-2 h-8">
        <select
          id="fm-currency-select"
          disabled={busy}
          value={currency}
          onChange={(e) => updatePref({ currency: e.target.value as AppCurrency })}
          className="bg-transparent text-[#C8FF2E] font-bold focus:outline-none cursor-pointer"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-[#111317]">
              {c.code}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
