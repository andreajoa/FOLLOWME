import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendWhatsAppSupportAlert } from "@/lib/support-notify";

const createTicketSchema = z.object({
  subject: z.string().trim().min(3, "Informe o assunto.").max(120),
  orderId: z.coerce.number().int().positive().optional().nullable(),
  message: z.string().trim().min(5, "Descreva seu atendimento com mais detalhes.").max(2500),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { name: true, username: true, role: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const parsed = createTicketSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const ticket = await prisma.ticket.create({
    data: {
      userId: user.id,
      subject: parsed.data.subject,
      orderId: parsed.data.orderId || null,
      status: "OPEN",
      messages: {
        create: {
          senderId: user.id,
          isAdmin: false,
          body: parsed.data.message,
        },
      },
    },
    include: {
      messages: {
        include: { sender: { select: { name: true, username: true, role: true } } },
      },
    },
  });

  await sendWhatsAppSupportAlert({
    kind: "TICKET",
    referenceId: ticket.id,
    senderName: user.name,
    senderEmail: user.email,
    senderUsername: user.username,
    senderWhatsapp: user.whatsapp,
    subject: ticket.subject,
    message: parsed.data.message,
    orderId: ticket.orderId,
  }).catch(() => null);

  return NextResponse.json({ ticket }, { status: 201 });
}
