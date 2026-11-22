import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const replySchema = z.object({
  body: z.string().trim().min(2, "Digite uma mensagem.").max(2500),
  close: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const ticketId = Number.parseInt(id, 10);
  if (!Number.isInteger(ticketId)) {
    return NextResponse.json({ error: "Ticket inválido." }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || (ticket.userId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Ticket não encontrado." }, { status: 404 });
  }

  const parsed = replySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Mensagem inválida." },
      { status: 400 }
    );
  }

  const isAdmin = user.role === "ADMIN";
  const nextStatus = parsed.data.close
    ? "CLOSED"
    : isAdmin
      ? "ANSWERED"
      : "OPEN";

  const [message] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: user.id,
        isAdmin,
        body: parsed.data.body,
      },
      include: {
        sender: { select: { name: true, username: true, role: true } },
      },
    }),
    prisma.ticket.update({
      where: { id: ticketId },
      data: { status: nextStatus },
    }),
  ]);

  return NextResponse.json({ message, status: nextStatus }, { status: 201 });
}
