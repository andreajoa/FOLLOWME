import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CURRENCY_COOKIE, LOCALE_COOKIE, defaultCurrencyForLocale } from "@/lib/i18n";

const prefSchema = z.object({
  locale: z.enum(["pt", "en", "es"]).optional(),
  currency: z.enum(["BRL", "USD", "EUR"]).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = prefSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Preferência inválida." }, { status: 400 });
  }

  const store = await cookies();
  const cookieOpts = {
    path: "/",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 365,
  };

  const nextLocale = parsed.data.locale;
  const nextCurrency =
    parsed.data.currency ?? (nextLocale ? defaultCurrencyForLocale(nextLocale) : undefined);

  if (nextLocale) {
    store.set(LOCALE_COOKIE, nextLocale, cookieOpts);
  }
  if (nextCurrency) {
    store.set(CURRENCY_COOKIE, nextCurrency, cookieOpts);
  }

  const user = await getCurrentUser().catch(() => null);
  if (user && (nextLocale || nextCurrency)) {
    await prisma.user
      .update({
        where: { id: user.id },
        data: {
          ...(nextLocale ? { locale: nextLocale } : {}),
          ...(nextCurrency ? { currency: nextCurrency } : {}),
        },
      })
      .catch(() => null);
  }

  return NextResponse.json({
    ok: true,
    locale: nextLocale,
    currency: nextCurrency,
  });
}
