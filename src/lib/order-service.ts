import { prisma } from "./prisma";
import { calculateOrderTotals, round4 } from "./pricing";
import {
  cancelProviderOrder,
  fetchProviderOrderStatus,
  submitProviderOrder,
} from "./smm-provider";
import { getSiteSettings } from "./settings";
import { AppCurrency, getServiceMarketRate } from "./i18n";
import { getEffectiveBrlRate, toBlackFridayConfig } from "./black-friday";
import {
  buildDispatchCandidates,
  DispatchAttemptRecord,
  executeDispatchWithFailover,
} from "./failover";
import {
  notifyOwnerOrderPlaced,
  notifyOwnerPaymentConfirmed,
} from "./owner-alerts";

export interface PlaceOrderParams {
  userId: string;
  serviceId: number;
  link: string;
  quantity: number;
  dripfeed?: boolean;
  runs?: number;
  interval?: number;
  comments?: string;
  username?: string;
  answerNumber?: string;
  billingCurrency?: AppCurrency;
  source?: "WEB" | "MASS" | "API";
}

export async function placeSingleOrder(params: PlaceOrderParams) {
  const service = await prisma.service.findUnique({
    where: { id: params.serviceId },
    include: {
      provider: true,
      category: { select: { network: true } },
      fallbacks: {
        where: { isActive: true },
        include: { provider: true },
        orderBy: { priority: "asc" },
      },
    },
  });

  if (!service || !service.isActive) {
    throw new Error("Serviço não encontrado ou indisponível no momento.");
  }

  let effectiveQuantity = Math.floor(params.quantity);
  const cleanComments = params.comments?.trim();
  const cleanUsername = params.username?.trim();
  const cleanAnswer = params.answerNumber?.trim();

  if (service.type === "PACKAGE") {
    effectiveQuantity = Math.max(service.min, 1);
  } else if (service.type === "CUSTOM_COMMENTS") {
    if (!cleanComments) {
      throw new Error("Este serviço exige ao menos 1 comentário por linha.");
    }
    const commentLines = cleanComments
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    effectiveQuantity = commentLines.length;
  } else if (service.type === "COMMENT_LIKES") {
    if (!cleanUsername) {
      throw new Error("Informe o @usuário dono do comentário.");
    }
  } else if (service.type === "POLL") {
    if (!cleanAnswer) {
      throw new Error("Informe o número da opção da enquete (answer_number).");
    }
  }

  if (
    service.type !== "PACKAGE" &&
    (effectiveQuantity < service.min || effectiveQuantity > service.max)
  ) {
    throw new Error(
      `Quantidade fora do limite permitido (${service.min} a ${service.max}).`
    );
  }

  const useDripfeed = Boolean(params.dripfeed && service.dripfeed);
  const runs = useDripfeed ? Math.max(2, Math.floor(params.runs ?? 2)) : undefined;
  const interval = useDripfeed
    ? Math.max(5, Math.floor(params.interval ?? 60))
    : undefined;

  const settings = await getSiteSettings();
  const bfConfig = toBlackFridayConfig(settings);
  const effectiveServiceRateBrl = getEffectiveBrlRate(service.rate, bfConfig);
  const billingCurrency: AppCurrency = params.billingCurrency || "BRL";
  const effectiveMarketRateBrl =
    billingCurrency === "USD"
      ? round4(
          getServiceMarketRate(service, "USD") * Math.max(0.1, settings.usdRate || 5.5)
        )
      : billingCurrency === "EUR"
        ? round4(
            getServiceMarketRate(service, "EUR") * Math.max(0.1, settings.eurRate || 6.0)
          )
        : effectiveServiceRateBrl;

  const totals =
    service.type === "PACKAGE"
      ? {
          totalQuantity: 1,
          charge: round4(effectiveMarketRateBrl),
          cost: round4(service.providerRate),
          profit: round4(effectiveMarketRateBrl - service.providerRate),
        }
      : calculateOrderTotals({
          rate: effectiveMarketRateBrl,
          providerRate: service.providerRate,
          quantity: effectiveQuantity,
          dripfeed: useDripfeed,
          runs,
        });

  const actor = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!actor || actor.status !== "ACTIVE") {
    throw new Error("Conta inativa ou não encontrada.");
  }

  const isAdminFree = actor.role === "ADMIN";
  const { totalQuantity, cost } = totals;
  const charge = isAdminFree ? 0 : totals.charge;
  const profit = isAdminFree ? 0 : totals.profit;

  if (!isAdminFree && charge <= 0) {
    throw new Error("Valor do pedido inválido.");
  }

  const createdOrder = await prisma.$transaction(async (tx) => {
    if (!isAdminFree) {
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
        throw new Error("Saldo insuficiente. Adicione saldo via Pix ou Cartão (Stripe) para continuar.");
      }
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
        username: cleanUsername || null,
        answerNumber: cleanAnswer || null,
        source: params.source ?? "WEB",
      },
      include: {
        service: { select: { id: true, name: true } },
      },
    });
  });

  // Discover compatible backup services on OTHER active LIVE providers (auto-failover pool)
  const autoCompatibleRows = await prisma.service.findMany({
    where: {
      isActive: true,
      id: { not: service.id },
      metricType: service.metricType,
      type: service.type,
      providerServiceId: { not: null },
      provider: {
        isActive: true,
        mode: "LIVE",
        ...(service.providerId ? { id: { not: service.providerId } } : {}),
      },
      category: { network: service.category.network },
      ...(service.type !== "PACKAGE"
        ? { min: { lte: effectiveQuantity }, max: { gte: effectiveQuantity } }
        : {}),
    },
    include: { provider: true },
    orderBy: [{ provider: { priority: "asc" } }, { providerRate: "asc" }],
    take: 4,
  });

  const candidates = buildDispatchCandidates({
    primary:
      service.provider && service.provider.isActive && service.providerServiceId
        ? { provider: service.provider, providerServiceId: service.providerServiceId }
        : undefined,
    explicitFallbacks: service.fallbacks
      .filter((fb) => fb.provider && fb.provider.isActive)
      .map((fb) => ({
        provider: fb.provider,
        providerServiceId: fb.providerServiceId,
        priority: fb.priority,
        isActive: fb.isActive,
      })),
    autoCompatible: autoCompatibleRows
      .filter((row) => row.provider && row.providerServiceId)
      .map((row) => ({
        provider: row.provider!,
        providerServiceId: row.providerServiceId!,
        priority: row.provider!.priority,
      })),
  });

  if (candidates.length > 0) {
    const dispatch = await executeDispatchWithFailover(candidates, {
      link: createdOrder.link,
      quantity: service.type === "PACKAGE" ? undefined : effectiveQuantity,
      runs,
      interval,
      comments: cleanComments,
      username: cleanUsername,
      answerNumber: cleanAnswer,
    });

    if (dispatch.ok) {
      const nextStatus =
        dispatch.providerMode === "SIMULATED" ? "IN_PROGRESS" : "PROCESSING";
      const updatedOrder = await prisma.order.update({
        where: { id: createdOrder.id },
        data: {
          providerId: dispatch.providerId,
          providerOrderId: dispatch.providerOrderId,
          status: nextStatus,
          failoverUsed: dispatch.failoverUsed,
          dispatchAttempts: JSON.stringify(dispatch.attempts),
          lastError: null,
        },
        include: {
          service: { select: { id: true, name: true } },
        },
      });

      void notifyOwnerOrderPlaced({
        orderId: updatedOrder.id,
        userName: actor.name,
        userEmail: actor.email,
        serviceName: updatedOrder.service.name,
        link: updatedOrder.link,
        quantity: updatedOrder.quantity,
        chargeBrl: updatedOrder.charge,
        createdAt: updatedOrder.createdAt,
        providerName: dispatch.providerName,
        status: updatedOrder.status,
        failoverUsed: dispatch.failoverUsed,
        supportEmail: settings.supportEmail,
      }).catch(() => null);

      return updatedOrder;
    }

    // All configured & backup providers failed: keep order visible as FAILED for 1-click failover in /dashboard
    const failedOrder = await prisma.order.update({
      where: { id: createdOrder.id },
      data: {
        status: "FAILED",
        failoverUsed: dispatch.attempts.length > 1,
        dispatchAttempts: JSON.stringify(dispatch.attempts),
        lastError: dispatch.lastError,
      },
      include: {
        service: { select: { id: true, name: true } },
      },
    });

    void notifyOwnerOrderPlaced({
      orderId: failedOrder.id,
      userName: actor.name,
      userEmail: actor.email,
      serviceName: failedOrder.service.name,
      link: failedOrder.link,
      quantity: failedOrder.quantity,
      chargeBrl: failedOrder.charge,
      createdAt: failedOrder.createdAt,
      providerName: dispatch.providerName,
      status: "FAILED",
      failoverUsed: false,
      lastError: dispatch.lastError,
      supportEmail: settings.supportEmail,
    }).catch(() => null);

    return failedOrder;
  }

  void notifyOwnerOrderPlaced({
    orderId: createdOrder.id,
    userName: actor.name,
    userEmail: actor.email,
    serviceName: createdOrder.service.name,
    link: createdOrder.link,
    quantity: createdOrder.quantity,
    chargeBrl: createdOrder.charge,
    createdAt: createdOrder.createdAt,
    providerName: null,
    status: createdOrder.status,
    supportEmail: settings.supportEmail,
  }).catch(() => null);

  return createdOrder;
}

export async function redispatchOrderToProvider(params: {
  orderId: number;
  providerId: string;
  providerServiceId?: string;
}) {
  const [order, targetProvider] = await Promise.all([
    prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        service: { include: { fallbacks: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.provider.findUnique({ where: { id: params.providerId } }),
  ]);

  if (!order) throw new Error("Pedido não encontrado.");
  if (!targetProvider || !targetProvider.isActive) {
    throw new Error("Provedor de destino inativo ou não encontrado.");
  }

  const fallbackMatch = order.service.fallbacks.find(
    (fb) => fb.providerId === targetProvider.id
  );
  const resolvedProviderServiceId =
    params.providerServiceId?.trim() ||
    fallbackMatch?.providerServiceId ||
    order.service.providerServiceId ||
    "";

  if (!resolvedProviderServiceId) {
    throw new Error(
      "Informe o ID do serviço no provedor escolhido para reenviar este pedido."
    );
  }

  let existingAttempts: DispatchAttemptRecord[] = [];
  if (order.dispatchAttempts) {
    try {
      existingAttempts = JSON.parse(order.dispatchAttempts) as DispatchAttemptRecord[];
    } catch {
      existingAttempts = [];
    }
  }

  const started = Date.now();
  try {
    const dispatch = await submitProviderOrder(targetProvider, {
      providerServiceId: resolvedProviderServiceId,
      link: order.link,
      quantity: order.service.type === "PACKAGE" ? undefined : order.quantity,
      runs: order.runs ?? undefined,
      interval: order.interval ?? undefined,
      comments: order.comments ?? undefined,
      username: order.username ?? undefined,
      answerNumber: order.answerNumber ?? undefined,
    });

    const newAttempt: DispatchAttemptRecord = {
      providerId: targetProvider.id,
      providerName: targetProvider.name,
      providerServiceId: resolvedProviderServiceId,
      source: "explicit_fallback",
      ok: true,
      providerOrderId: dispatch.providerOrderId,
      durationMs: Date.now() - started,
      triedAt: new Date().toISOString(),
    };

    const nextStatus =
      targetProvider.mode === "SIMULATED" ? "IN_PROGRESS" : "PROCESSING";

    return prisma.order.update({
      where: { id: order.id },
      data: {
        providerId: targetProvider.id,
        providerOrderId: dispatch.providerOrderId,
        status: nextStatus,
        failoverUsed: true,
        lastError: null,
        dispatchAttempts: JSON.stringify([...existingAttempts, newAttempt]),
      },
      include: {
        provider: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Falha ao reenviar pedido ao provedor.";
    const failedAttempt: DispatchAttemptRecord = {
      providerId: targetProvider.id,
      providerName: targetProvider.name,
      providerServiceId: resolvedProviderServiceId,
      source: "explicit_fallback",
      ok: false,
      error: msg,
      durationMs: Date.now() - started,
      triedAt: new Date().toISOString(),
    };

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "FAILED",
        lastError: `${targetProvider.name}: ${msg}`,
        dispatchAttempts: JSON.stringify([...existingAttempts, failedAttempt]),
      },
    });
    throw new Error(`${targetProvider.name}: ${msg}`);
  }
}

export interface CreateSubscriptionParams {
  userId: string;
  serviceId: number;
  username: string;
  min: number;
  max: number;
  posts?: number;
  oldPosts?: number;
  delay?: number;
  expiry?: Date | null;
}

export async function createSubscriptionOrder(params: CreateSubscriptionParams) {
  const service = await prisma.service.findUnique({
    where: { id: params.serviceId },
    include: { provider: true },
  });

  if (!service || !service.isActive) {
    throw new Error("Serviço de assinatura não encontrado ou indisponível.");
  }

  const min = Math.floor(params.min);
  const max = Math.floor(params.max);
  if (min < service.min || max > service.max || min > max) {
    throw new Error(
      `Intervalo min/max inválido (permitido: ${service.min} a ${service.max}).`
    );
  }

  const cleanUsername = params.username.trim().replace(/^@+/, "");
  if (cleanUsername.length < 2) {
    throw new Error("Informe um nome de usuário válido.");
  }

  const postsCount = params.posts && params.posts > 0 ? Math.floor(params.posts) : null;
  const oldPostsCount = Math.max(0, Math.floor(params.oldPosts ?? 0));
  const delayMinutes = Math.max(0, Math.floor(params.delay ?? 0));

  const actor = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  if (!actor || actor.status !== "ACTIVE") {
    throw new Error("Conta inativa ou não encontrada.");
  }

  // Cobra a reserva proporcional do primeiro lote (grátis para ADMIN)
  const settings = await getSiteSettings();
  const bfConfig = toBlackFridayConfig(settings);
  const effectiveSubRateBrl = getEffectiveBrlRate(service.rate, bfConfig);
  const isAdminFree = actor.role === "ADMIN";
  const estimatedUnits = max * Math.min(postsCount ?? 1, 5);
  const estimatedCharge = isAdminFree
    ? 0
    : round4((estimatedUnits / 1000) * effectiveSubRateBrl);

  const sub = await prisma.$transaction(async (tx) => {
    if (estimatedCharge > 0) {
      const updated = await tx.user.updateMany({
        where: {
          id: params.userId,
          status: "ACTIVE",
          balance: { gte: estimatedCharge },
        },
        data: {
          balance: { decrement: estimatedCharge },
          totalSpent: { increment: estimatedCharge },
        },
      });
      if (updated.count === 0) {
        throw new Error(
          `Saldo insuficiente para ativar assinatura (mínimo estimado: R$ ${estimatedCharge.toFixed(2)}).`
        );
      }
    }

    return tx.subscription.create({
      data: {
        userId: params.userId,
        serviceId: service.id,
        providerId: service.providerId,
        username: cleanUsername,
        min,
        max,
        posts: postsCount,
        oldPosts: oldPostsCount,
        delay: delayMinutes,
        expiry: params.expiry ?? null,
        status: "ACTIVE",
      },
      include: {
        service: { select: { id: true, name: true, rate: true } },
      },
    });
  });

  if (service.provider && service.provider.isActive && service.providerServiceId) {
    try {
      const expiryStr = params.expiry
        ? `${String(params.expiry.getDate()).padStart(2, "0")}/${String(params.expiry.getMonth() + 1).padStart(2, "0")}/${params.expiry.getFullYear()}`
        : undefined;
      const dispatch = await submitProviderOrder(service.provider, {
        providerServiceId: service.providerServiceId,
        username: cleanUsername,
        min,
        max,
        posts: postsCount ?? undefined,
        oldPosts: oldPostsCount || undefined,
        delay: delayMinutes,
        expiry: expiryStr,
      });

      return prisma.subscription.update({
        where: { id: sub.id },
        data: { providerOrderId: dispatch.providerOrderId },
        include: {
          service: { select: { id: true, name: true, rate: true } },
        },
      });
    } catch (providerErr) {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "CANCELED" },
        }),
        ...(estimatedCharge > 0
          ? [
              prisma.user.update({
                where: { id: params.userId },
                data: {
                  balance: { increment: estimatedCharge },
                  totalSpent: { decrement: estimatedCharge },
                },
              }),
            ]
          : []),
      ]);
      throw new Error(
        providerErr instanceof Error
          ? `${providerErr.message} Valor estornado automaticamente.`
          : "Falha ao enviar assinatura ao provedor."
      );
    }
  }

  return sub;
}

export async function confirmDepositAndCredit(
  depositId: string,
  note?: string
) {
  const settings = await getSiteSettings();

  const txResult = await prisma.$transaction(async (tx) => {
    const deposit = await tx.deposit.findUnique({
      where: { id: depositId },
      include: {
        user: { select: { id: true, name: true, email: true, referredById: true } },
      },
    });

    if (!deposit) {
      throw new Error("Depósito não encontrado.");
    }

    if (deposit.status === "PAID") {
      return { deposit, user: deposit.user, alreadyPaid: true };
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

    const creditLedgerAmount =
      deposit.currency === "USD"
        ? round4(deposit.amount * Math.max(0.1, settings.usdRate || 5.5))
        : deposit.currency === "EUR"
          ? round4(deposit.amount * Math.max(0.1, settings.eurRate || 6.0))
          : deposit.amount;

    await tx.user.update({
      where: { id: deposit.userId },
      data: {
        balance: { increment: creditLedgerAmount },
      },
    });

    if (deposit.user.referredById && settings.affiliateRate > 0) {
      const commission = round4((creditLedgerAmount * settings.affiliateRate) / 100);
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
            depositAmount: creditLedgerAmount,
            commissionRate: settings.affiliateRate,
            amount: commission,
            status: "AVAILABLE",
          },
        });
      }
    }

    const paidDeposit = await tx.deposit.findUnique({ where: { id: depositId } });
    return { deposit: paidDeposit, user: deposit.user, alreadyPaid: false };
  });

  if (!txResult.alreadyPaid && txResult.deposit) {
    const latestOrder = await prisma.order
      .findFirst({
        where: { userId: txResult.deposit.userId },
        include: { service: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => null);

    void notifyOwnerPaymentConfirmed({
      depositId: txResult.deposit.id,
      userName: txResult.user.name,
      userEmail: txResult.user.email,
      amount: txResult.deposit.amount,
      currency: txResult.deposit.currency,
      method: txResult.deposit.method,
      paidAt: txResult.deposit.paidAt ?? new Date(),
      latestOrderSummary: latestOrder
        ? `#${latestOrder.id} · ${latestOrder.quantity.toLocaleString("pt-BR")}x ${latestOrder.service.name} (${latestOrder.link})`
        : null,
      supportEmail: settings.supportEmail,
    }).catch(() => null);
  }

  return { deposit: txResult.deposit, alreadyPaid: txResult.alreadyPaid };
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
        totalSpent: { decrement: order.charge },
      },
    });

    return tx.order.findUnique({ where: { id: orderId } });
  });
}

export async function syncActiveOrdersWithProviders(limit = 50) {
  const activeOrders = await prisma.order.findMany({
    where: {
      status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] },
      providerOrderId: { not: null },
      provider: { isActive: true, mode: "LIVE" },
    },
    include: { provider: true },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  let updatedCount = 0;
  let refundedCount = 0;
  let errorsCount = 0;

  for (const order of activeOrders) {
    if (!order.provider || !order.providerOrderId) continue;
    try {
      const remote = await fetchProviderOrderStatus(
        order.provider,
        order.providerOrderId
      );

      if (remote.status === "CANCELED") {
        await prisma.$transaction(async (tx) => {
          const claimed = await tx.order.updateMany({
            where: {
              id: order.id,
              status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] },
            },
            data: {
              status: "CANCELED",
              startCount: remote.startCount,
              remains: order.quantity,
            },
          });
          if (claimed.count > 0) {
            await tx.user.update({
              where: { id: order.userId },
              data: {
                balance: { increment: order.charge },
                totalSpent: { decrement: order.charge },
              },
            });
            refundedCount += 1;
          }
        });
        updatedCount += 1;
      } else if (remote.status === "PARTIAL") {
        const safeRemains = Math.max(0, Math.min(order.quantity, remote.remains));
        const refundAmount =
          order.quantity > 0
            ? round4((safeRemains / order.quantity) * order.charge)
            : 0;
        await prisma.$transaction(async (tx) => {
          const claimed = await tx.order.updateMany({
            where: {
              id: order.id,
              status: { in: ["PENDING", "PROCESSING", "IN_PROGRESS"] },
            },
            data: {
              status: "PARTIAL",
              startCount: remote.startCount,
              remains: safeRemains,
            },
          });
          if (claimed.count > 0 && refundAmount > 0) {
            await tx.user.update({
              where: { id: order.userId },
              data: {
                balance: { increment: refundAmount },
                totalSpent: { decrement: refundAmount },
              },
            });
            refundedCount += 1;
          }
        });
        updatedCount += 1;
      } else {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: remote.status,
            startCount: remote.startCount,
            remains: remote.remains,
          },
        });
        updatedCount += 1;
      }
    } catch {
      errorsCount += 1;
    }
  }

  return {
    scanned: activeOrders.length,
    updated: updatedCount,
    refunded: refundedCount,
    errors: errorsCount,
  };
}
