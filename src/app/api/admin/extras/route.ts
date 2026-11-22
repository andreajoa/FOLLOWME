import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const patchExtraSchema = z.object({
  kind: z.enum(["subscription", "childPanel", "cooperation"]),
  id: z.coerce.number().int().positive(),
  status: z.string().trim().min(2).max(30),
  adminNote: z.string().trim().max(500).optional(),
});

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const [subscriptions, childPanels, cooperationRequests] = await Promise.all([
    prisma.subscription.findMany({
      include: {
        user: { select: { username: true, email: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.childPanel.findMany({
      include: {
        user: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.cooperationRequest.findMany({
      include: {
        user: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({
    subscriptions,
    childPanels: childPanels.map((p) => ({
      id: p.id,
      domain: p.domain,
      currency: p.currency,
      adminUsername: p.adminUsername,
      monthlyPrice: p.monthlyPrice,
      status: p.status,
      nextBillingAt: p.nextBillingAt,
      createdAt: p.createdAt,
      user: p.user,
    })),
    cooperationRequests,
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const parsed = patchExtraSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { kind, id, status, adminNote } = parsed.data;

  if (kind === "subscription") {
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ updated });
  }

  if (kind === "childPanel") {
    const updated = await prisma.childPanel.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ updated });
  }

  const updated = await prisma.cooperationRequest.update({
    where: { id },
    data: {
      status,
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
  });
  return NextResponse.json({ updated });
}
