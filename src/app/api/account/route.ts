import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";

const updateAccountSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  locale: z.enum(["pt", "en", "es"]).optional(),
  currency: z.enum(["BRL", "USD", "EUR"]).optional(),
  timezone: z.string().trim().max(60).optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(6, "Nova senha deve ter pelo menos 6 caracteres.")
    .max(100)
    .optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const parsed = updateAccountSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.whatsapp !== undefined) data.whatsapp = parsed.data.whatsapp || null;
  if (parsed.data.locale) data.locale = parsed.data.locale;
  if (parsed.data.currency) data.currency = parsed.data.currency;
  if (parsed.data.timezone) data.timezone = parsed.data.timezone;

  if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword) {
      return NextResponse.json(
        { error: "Informe sua senha atual para alterá-la." },
        { status: 400 }
      );
    }
    const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fullUser || !(await verifyPassword(parsed.data.currentPassword, fullUser.passwordHash))) {
      return NextResponse.json(
        { error: "Senha atual incorreta." },
        { status: 401 }
      );
    }
    data.passwordHash = await hashPassword(parsed.data.newPassword);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      whatsapp: true,
      locale: true,
      currency: true,
      timezone: true,
      apiKey: true,
    },
  });

  return NextResponse.json({ user: updated });
}
