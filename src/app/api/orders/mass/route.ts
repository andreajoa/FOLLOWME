import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { parseMassOrderText } from "@/lib/pricing";
import { placeSingleOrder } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";

const massSchema = z.object({
  lines: z.string().min(3, "Cole ao menos um pedido no formato: ID | link | quantidade"),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const parsed = massSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Entrada inválida." },
      { status: 400 }
    );
  }

  const { valid, errors: parseErrors } = parseMassOrderText(parsed.data.lines);
  if (valid.length === 0) {
    return NextResponse.json(
      {
        error: "Nenhuma linha válida encontrada.",
        parseErrors,
      },
      { status: 400 }
    );
  }

  if (valid.length > 50) {
    return NextResponse.json(
      { error: "Limite de 50 pedidos por envio em massa." },
      { status: 400 }
    );
  }

  const created: Array<{ lineNumber: number; orderId: number; charge: number }> = [];
  const failed: Array<{ lineNumber: number; reason: string }> = parseErrors.map((e) => ({
    lineNumber: e.lineNumber,
    reason: e.reason,
  }));

  for (const item of valid) {
    try {
      const order = await placeSingleOrder({
        userId: user.id,
        serviceId: item.serviceId,
        link: item.link,
        quantity: item.quantity,
        source: "MASS",
      });
      created.push({
        lineNumber: item.lineNumber,
        orderId: order.id,
        charge: order.charge,
      });
    } catch (err) {
      failed.push({
        lineNumber: item.lineNumber,
        reason: err instanceof Error ? err.message : "Falha ao processar linha.",
      });
    }
  }

  const refreshed = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });

  return NextResponse.json({
    createdCount: created.length,
    failedCount: failed.length,
    created,
    failed,
    balance: refreshed?.balance ?? user.balance,
  });
}
