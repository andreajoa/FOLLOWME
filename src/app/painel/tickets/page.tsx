import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TicketsClient } from "@/components/tickets-client";

export const dynamic = "force-dynamic";

export default async function PanelTicketsPage() {
  const user = (await getCurrentUser())!;
  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true, username: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <TicketsClient
      initialTickets={tickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        orderId: t.orderId,
        status: t.status,
        updatedAt: t.updatedAt.toISOString(),
        messages: t.messages.map((m) => ({
          id: m.id,
          isAdmin: m.isAdmin,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          sender: m.sender,
        })),
      }))}
    />
  );
}
