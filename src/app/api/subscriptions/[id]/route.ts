import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const patchSubSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "CANCELED"]),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const subId = Number.parseInt(id, 10);
  if (!Number.isInteger(subId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const parsed = patchSubSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const existing = await prisma.subscription.findUnique({ where: { id: subId } });
  if (!existing) {
    return NextResponse.json({ error: "Assinatura não encontrada." }, { status: 404 });
  }
  if (user.role !== "ADMIN" && existing.userId !== user.id) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  if (existing.status === "CANCELED" || existing.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Esta assinatura já foi encerrada." },
      { status: 400 }
    );
  }

  const updated = await prisma.subscription.update({
    where: { id: subId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ subscription: updated });
}
