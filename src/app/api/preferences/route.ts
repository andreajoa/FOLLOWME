import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CURRENCY_COOKIE, LOCALE_COOKIE } from "@/lib/i18n";

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

  if (parsed.data.locale) {
    store.set(LOCALE_COOKIE, parsed.data.locale, cookieOpts);
  }
  if (parsed.data.currency) {
    store.set(CURRENCY_COOKIE, parsed.data.currency, cookieOpts);
  }

  const user = await getCurrentUser().catch(() => null);
  if (user && (parsed.data.locale || parsed.data.currency)) {
    await prisma.user
      .update({
        where: { id: user.id },
        data: {
          ...(parsed.data.locale ? { locale: parsed.data.locale } : {}),
          ...(parsed.data.currency ? { currency: parsed.data.currency } : {}),
        },
      })
      .catch(() => null);
  }

  return NextResponse.json({
    ok: true,
    locale: parsed.data.locale,
    currency: parsed.data.currency,
  });
}
