import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const tickets = await prisma.ticket.findMany({
    include: {
      user: { select: { name: true, username: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true, username: true, role: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ tickets });
}
