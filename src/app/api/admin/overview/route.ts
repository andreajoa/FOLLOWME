import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  const [
    usersCount,
    servicesCount,
    providersCount,
    openTicketsCount,
    openSupportEmailsCount,
    pendingDepositsCount,
    activeSubscriptionsCount,
    childPanelsCount,
    pendingCooperationCount,
    ordersAgg,
    depositsAgg,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.service.count({ where: { isActive: true } }),
    prisma.provider.count({ where: { isActive: true } }),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.supportEmail.count({ where: { status: "OPEN" } }),
    prisma.deposit.count({ where: { status: "PENDING" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.childPanel.count({ where: { status: { in: ["PENDING", "ACTIVE"] } } }),
    prisma.cooperationRequest.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELED" } },
      _count: { id: true },
      _sum: { charge: true, cost: true, profit: true },
    }),
    prisma.deposit.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.order.findMany({
      include: {
        user: { select: { username: true, email: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    metrics: {
      usersCount,
      servicesCount,
      providersCount,
      openTicketsCount: openTicketsCount + openSupportEmailsCount,
      pendingDepositsCount,
      activeSubscriptionsCount,
      childPanelsCount,
      pendingCooperationCount,
      ordersCount: ordersAgg._count.id,
      grossRevenue: ordersAgg._sum.charge ?? 0,
      providerCost: ordersAgg._sum.cost ?? 0,
      netProfit: ordersAgg._sum.profit ?? 0,
      totalPixDeposited: depositsAgg._sum.amount ?? 0,
      stripeConfigured: isStripeConfigured(),
    },
    recentOrders,
  });
}
