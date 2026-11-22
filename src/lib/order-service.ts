import { prisma } from "./prisma";
import { calculateOrderTotals, round4 } from "./pricing";
import {
  cancelProviderOrder,
  submitProviderOrder,
} from "./smm-provider";
import { getSiteSettings } from "./settings";

export interface PlaceOrderParams {
  userId: string;
  serviceId: number;
  link: string;
  quantity: number;
  dripfeed?: boolean;
  runs?: number;
  interval?: number;
  comments?: string;
  source?: "WEB" | "MASS" | "API";
}

export async function placeSingleOrder(params: PlaceOrderParams) {
  const service = await prisma.service.findUnique({
    where: { id: params.serviceId },
    include: { provider: true },
  });

  if (!service || !service.isActive) {
    throw new Error("Serviço não encontrado ou indisponível no momento.");
  }

  let effectiveQuantity = Math.floor(params.quantity);
  const cleanComments = params.comments?.trim();

  if (service.type === "CUSTOM_COMMENTS") {
    if (!cleanComments) {
      throw new Error("Este serviço exige ao menos 1 comentário por linha.");
    }
    const commentLines = cleanComments
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    effectiveQuantity = commentLines.length;
  }

  if (effectiveQuantity < service.min || effectiveQuantity > service.max) {
    throw new Error(
      `Quantidade fora do limite permitido (${service.min} a ${service.max}).`
    );
  }

  const useDripfeed = Boolean(params.dripfeed && service.dripfeed);
  const runs = useDripfeed ? Math.max(2, Math.floor(params.runs ?? 2)) : undefined;
  const interval = useDripfeed
    ? Math.max(5, Math.floor(params.interval ?? 60))
    : undefined;

  const { totalQuantity, charge, cost, profit } = calculateOrderTotals({
    rate: service.rate,
    providerRate: service.providerRate,
    quantity: effectiveQuantity,
    dripfeed: useDripfeed,
    runs,
  });

  if (charge <= 0) {
    throw new Error("Valor do pedido inválido.");
  }

  const createdOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: params.userId,
        status: "ACTIVE",
        balance: { gte: charge },
      },
      data: {
        balance: { decrement: charge },
        totalSpent: { increment: charge },
      },
    });

    if (updated.count === 0) {
      throw new Error("Saldo insuficiente. Adicione saldo via Pix para continuar.");
    }

    return tx.order.create({
      data: {
        userId: params.userId,
        serviceId: service.id,
        providerId: service.providerId,
        link: params.link.trim(),
        quantity: totalQuantity,
        charge,
        cost,
        profit,
        remains: totalQuantity,
        status: "PENDING",
        dripfeed: useDripfeed,
        runs,
        interval,
        comments: cleanComments || null,
        source: params.source ?? "WEB",
      },
      include: {
        service: { select: { id: true, name: true } },
      },
    });
  });

  if (service.provider && service.provider.isActive && service.providerServiceId) {
    try {
      const dispatch = await submitProviderOrder(service.provider, {
        providerServiceId: service.providerServiceId,
        link: createdOrder.link,
        quantity: effectiveQuantity,
        runs,
        interval,
        comments: cleanComments,
      });

      return prisma.order.update({
        where: { id: createdOrder.id },
        data: {
          providerOrderId: dispatch.providerOrderId,
          status:
            service.provider.mode === "SIMULATED" ? "IN_PROGRESS" : "PROCESSING",
        },
        include: {
          service: { select: { id: true, name: true } },
        },
      });
    } catch (providerErr) {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: createdOrder.id },
          data: { status: "CANCELED", remains: createdOrder.quantity },
        }),
        prisma.user.update({
          where: { id: params.userId },
          data: {
            balance: { increment: charge },
            totalSpent: { decrement: charge },
          },
        }),
      ]);
      const msg =
        providerErr instanceof Error
          ? providerErr.message
          : "Falha ao enviar pedido ao fornecedor.";
      throw new Error(`${msg} Seu saldo foi estornado automaticamente.`);
    }
  }

  return createdOrder;
}

export async function confirmDepositAndCredit(
  depositId: string,
  note?: string
) {
  const settings = await getSiteSettings();

  return prisma.$transaction(async (tx) => {
    const deposit = await tx.deposit.findUnique({
      where: { id: depositId },
      include: {
        user: { select: { id: true, referredById: true } },
      },
    });

    if (!deposit) {
      throw new Error("Depósito não encontrado.");
    }

    if (deposit.status === "PAID") {
      return { deposit, alreadyPaid: true };
    }

    const updated = await tx.deposit.updateMany({
      where: { id: depositId, status: "PENDING" },
      data: {
        status: "PAID",
        paidAt: new Date(),
        note: note ?? deposit.note,
      },
    });

    if (updated.count === 0) {
      throw new Error("Este depósito não pode mais ser confirmado.");
    }

    await tx.user.update({
      where: { id: deposit.userId },
      data: {
        balance: { increment: deposit.amount },
      },
    });

    if (
      deposit.user.referredById &&
      deposit.method === "PIX" &&
      settings.affiliateRate > 0
    ) {
      const commission = round4((deposit.amount * settings.affiliateRate) / 100);
      if (commission > 0) {
        await tx.user.update({
          where: { id: deposit.user.referredById },
          data: {
            affiliateBalance: { increment: commission },
          },
        });

        await tx.affiliateEarning.create({
          data: {
            referrerId: deposit.user.referredById,
            referredUserId: deposit.userId,
            depositId: deposit.id,
            depositAmount: deposit.amount,
            commissionRate: settings.affiliateRate,
            amount: commission,
            status: "AVAILABLE",
          },
        });
      }
    }

    const paidDeposit = await tx.deposit.findUnique({ where: { id: depositId } });
    return { deposit: paidDeposit, alreadyPaid: false };
  });
}

export async function cancelAndRefundOrder(
  orderId: number,
  actorUserId: string,
  isAdmin: boolean
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { service: true, provider: true },
  });

  if (!order) {
    throw new Error("Pedido não encontrado.");
  }

  if (!isAdmin && order.userId !== actorUserId) {
    throw new Error("Sem permissão para cancelar este pedido.");
  }

  if (!isAdmin && !order.service.cancel) {
    throw new Error("Este serviço não permite cancelamento automático.");
  }

  if (order.status === "COMPLETED" || order.status === "CANCELED") {
    throw new Error("Este pedido já foi finalizado ou cancelado.");
  }

  if (order.provider && order.providerOrderId && order.provider.isActive) {
    try {
      await cancelProviderOrder(order.provider, order.providerOrderId);
    } catch {
      if (!isAdmin) {
        throw new Error(
          "O fornecedor não aceitou cancelamento automático. Abra um ticket informando o ID do pedido."
        );
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: {
        id: orderId,
        status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] },
      },
      data: {
        status: "CANCELED",
        remains: order.quantity,
      },
    });

    if (claimed.count === 0) {
      throw new Error("Pedido já atualizado por outro processo.");
    }

    await tx.user.update({
      where: { id: order.userId },
      data: {
        balance: { increment: order.charge },
        totalSpent: { decrement: Math.min(order.charge, order.charge) },
      },
    });

    return tx.order.findUnique({ where: { id: orderId } });
  });
}
