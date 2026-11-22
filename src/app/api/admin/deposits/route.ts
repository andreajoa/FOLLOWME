import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { confirmDepositAndCredit } from "@/lib/order-service";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const deposits = await prisma.deposit.findMany({
    include: {
      user: { select: { username: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ deposits });
}

const patchDepositSchema = z.object({
  depositId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const parsed = patchDepositSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (parsed.data.action === "approve") {
    const res = await confirmDepositAndCredit(
      parsed.data.depositId,
      `Aprovado pelo admin @${admin.username}`
    );
    return NextResponse.json({ deposit: res.deposit });
  }

  const deposit = await prisma.deposit.update({
    where: { id: parsed.data.depositId },
    data: { status: "REJECTED", note: `Recusado por @${admin.username}` },
  });
  return NextResponse.json({ deposit });
}
