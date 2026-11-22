import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendSupportEmailReply } from "@/lib/support-notify";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const [tickets, supportEmails] = await Promise.all([
    prisma.ticket.findMany({
      include: {
        user: { select: { name: true, username: true, email: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { name: true, username: true, role: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.supportEmail.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({ tickets, supportEmails });
}

const replyEmailSchema = z.object({
  supportEmailId: z.coerce.number().int().positive(),
  body: z.string().trim().min(2, "Digite a resposta para o cliente.").max(8000),
  close: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const parsed = replyEmailSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const emailRecord = await prisma.supportEmail.findUnique({
    where: { id: parsed.data.supportEmailId },
  });
  if (!emailRecord) {
    return NextResponse.json(
      { error: "E-mail de suporte não encontrado." },
      { status: 404 }
    );
  }

  const sent = await sendSupportEmailReply({
    toEmail: emailRecord.fromEmail,
    toName: emailRecord.fromName,
    subject: emailRecord.subject,
    replyBody: parsed.data.body,
    originalMessage: emailRecord.bodyText,
  });

  if (!sent.ok) {
    return NextResponse.json(
      { error: sent.error || "Não foi possível enviar o e-mail de resposta." },
      { status: 502 }
    );
  }

  const updated = await prisma.supportEmail.update({
    where: { id: emailRecord.id },
    data: {
      replyText: parsed.data.body,
      repliedAt: new Date(),
      status: parsed.data.close ? "CLOSED" : "ANSWERED",
    },
  });

  return NextResponse.json({ ok: true, supportEmail: updated });
}
