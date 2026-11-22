import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateTxId } from "@/lib/pix";
import { round2 } from "@/lib/pricing";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      status: true,
      balance: true,
      totalSpent: true,
      affiliateBalance: true,
      createdAt: true,
      _count: { select: { orders: true, deposits: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

const patchUserSchema = z.object({
  userId: z.string().min(1),
  balanceDelta: z.coerce.number().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  note: z.string().max(200).optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const parsed = patchUserSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { userId, balanceDelta, status, role, note } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (role && userId !== admin.id) data.role = role;
    if (balanceDelta && balanceDelta !== 0) {
      const delta = round2(balanceDelta);
      data.balance = { increment: delta };
      await tx.deposit.create({
        data: {
          userId,
          amount: delta,
          method: "MANUAL_ADMIN",
          gateway: "ADMIN",
          txid: generateTxId(),
          status: "PAID",
          paidAt: new Date(),
          note: note || `Ajuste manual por @${admin.username}`,
        },
      });
    }

    return tx.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        balance: true,
        status: true,
        role: true,
      },
    });
  });

  return NextResponse.json({ user: updated });
}
