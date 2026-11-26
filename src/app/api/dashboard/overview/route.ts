import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import {
  AnalyticsRange,
  buildEmptyBrtBuckets,
  getBrtBucketKey,
  getBrtWindowBoundaries,
} from "@/lib/analytics";
import {
  DEFAULT_OWNER_WHATSAPP,
  extractProfileHandle,
  formatBrtDateTime,
} from "@/lib/owner-alerts";
import type { DispatchAttemptRecord } from "@/lib/failover";

export const dynamic = "force-dynamic";

function normalizeRange(raw: string | null): AnalyticsRange {
  if (raw === "day" || raw === "month" || raw === "year") return raw;
  return "month";
}

function toBrlAmount(
  amount: number,
  currency: string,
  rates: { usdRate: number; eurRate: number }
): number {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (currency === "USD") return Number((safe * (rates.usdRate || 5.5)).toFixed(2));
  if (currency === "EUR") return Number((safe * (rates.eurRate || 6.0)).toFixed(2));
  return Number(safe.toFixed(2));
}

function parseSourceLabel(utmSource: string | null, referrer: string | null): string {
  if (utmSource && utmSource.trim()) return `UTM · ${utmSource.trim().toLowerCase()}`;
  if (!referrer || !referrer.trim()) return "Acesso Direto";
  try {
    const u = new URL(referrer);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("followm.click") || host.includes("followme.nexaclouds.online")) {
      return "Navegação Interna";
    }
    return host || "Referência";
  } catch {
    return referrer.slice(0, 48);
  }
}

function safeParseAttempts(raw: string | null): DispatchAttemptRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DispatchAttemptRecord[]) : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const range = normalizeRange(req.nextUrl.searchParams.get("range"));
  const search = (req.nextUrl.searchParams.get("q") || "").trim();
  const statusFilter = (req.nextUrl.searchParams.get("status") || "ALL").trim().toUpperCase();

  const now = new Date();
  const { dayStart, monthStart, yearStart } = getBrtWindowBoundaries(now);
  const rangeStart =
    range === "day" ? dayStart : range === "month" ? monthStart : yearStart;

  const [settings, rawAlertSecrets] = await Promise.all([
    getSiteSettings().catch(() => null),
    prisma.siteSetting
      .findUnique({
        where: { id: "default" },
        select: { atenzaMcpToken: true },
      })
      .catch(() => null),
  ]);
  const fxRates = {
    usdRate: settings?.usdRate || 5.5,
    eurRate: settings?.eurRate || 6.0,
  };

  // Build order search filter
  const parsedNumericSearch = /^\d+$/.test(search) ? Number(search) : null;
  const orderWhere: Record<string, unknown> = {};
  if (statusFilter && statusFilter !== "ALL") {
    orderWhere.status = statusFilter;
  }
  if (search) {
    orderWhere.OR = [
      ...(parsedNumericSearch ? [{ id: parsedNumericSearch }] : []),
      { link: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { username: { contains: search, mode: "insensitive" } } },
      { service: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [
    yearEvents,
    yearOrders,
    yearDeposits,
    rangeNewUsersCount,
    filteredOrders,
    recentDeposits,
    providers,
    fallbacks,
    services,
    notifications,
    totalUsersCount,
  ] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        isBot: false,
        createdAt: { gte: yearStart },
      },
      select: {
        eventType: true,
        visitorId: true,
        path: true,
        targetLabel: true,
        targetHref: true,
        targetArea: true,
        referrer: true,
        utmSource: true,
        deviceType: true,
        country: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30000,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: yearStart } },
      select: {
        id: true,
        charge: true,
        profit: true,
        status: true,
        failoverUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 15000,
    }),
    prisma.deposit.findMany({
      where: {
        status: "PAID",
        OR: [{ paidAt: { gte: yearStart } }, { createdAt: { gte: yearStart } }],
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        paidAt: true,
        createdAt: true,
      },
      take: 10000,
    }),
    prisma.user.count({
      where: { createdAt: { gte: rangeStart }, role: { not: "ADMIN" } },
    }),
    prisma.order.findMany({
      where: orderWhere,
      include: {
        user: { select: { id: true, name: true, username: true, email: true } },
        service: {
          select: {
            id: true,
            name: true,
            providerServiceId: true,
            category: { select: { network: true } },
          },
        },
        provider: { select: { id: true, name: true, mode: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    prisma.deposit.findMany({
      include: {
        user: { select: { id: true, name: true, username: true, email: true } },
      },
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      take: 80,
    }),
    prisma.provider.findMany({
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      include: {
        _count: { select: { services: true, orders: true, fallbacks: true } },
      },
    }),
    prisma.serviceFallback.findMany({
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: { select: { network: true } },
          },
        },
        provider: { select: { id: true, name: true, mode: true, isActive: true } },
      },
      orderBy: [{ serviceId: "asc" }, { priority: "asc" }],
    }),
    prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        providerId: true,
        providerServiceId: true,
        category: { select: { network: true } },
        provider: { select: { name: true } },
      },
      orderBy: [{ id: "asc" }],
      take: 250,
    }),
    prisma.ownerNotificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.user.count({ where: { role: { not: "ADMIN" } } }),
  ]);

  // Attach latest PAID deposit to each user shown in orders
  const orderUserIds = Array.from(new Set(filteredOrders.map((o) => o.userId)));
  const paidDepositsForOrderUsers =
    orderUserIds.length > 0
      ? await prisma.deposit.findMany({
          where: { userId: { in: orderUserIds }, status: "PAID" },
          orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
          select: {
            userId: true,
            amount: true,
            currency: true,
            method: true,
            paidAt: true,
            createdAt: true,
          },
        })
      : [];

  const latestPaidByUser = new Map<
    string,
    {
      amount: number;
      currency: string;
      method: string;
      paidAt: Date;
    }
  >();
  for (const dep of paidDepositsForOrderUsers) {
    if (!latestPaidByUser.has(dep.userId)) {
      latestPaidByUser.set(dep.userId, {
        amount: dep.amount,
        currency: dep.currency,
        method: dep.method,
        paidAt: dep.paidAt ?? dep.createdAt,
      });
    }
  }

  // Attach latest order to each user shown in recent deposits
  const depositUserIds = Array.from(new Set(recentDeposits.map((d) => d.userId)));
  const ordersForDepositUsers =
    depositUserIds.length > 0
      ? await prisma.order.findMany({
          where: { userId: { in: depositUserIds } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            userId: true,
            link: true,
            quantity: true,
            status: true,
            service: { select: { name: true } },
          },
          take: 300,
        })
      : [];

  const latestOrderByUser = new Map<
    string,
    {
      id: number;
      serviceName: string;
      link: string;
      profileHandle: string;
      quantity: number;
      status: string;
    }
  >();
  for (const ord of ordersForDepositUsers) {
    if (!latestOrderByUser.has(ord.userId)) {
      latestOrderByUser.set(ord.userId, {
        id: ord.id,
        serviceName: ord.service.name,
        link: ord.link,
        profileHandle: extractProfileHandle(ord.link),
        quantity: ord.quantity,
        status: ord.status,
      });
    }
  }

  // ── Compute Visitor & Click Analytics (Day / Month / Year + Selected Range) ──
  const dayVisitors = new Set<string>();
  const monthVisitors = new Set<string>();
  const yearVisitors = new Set<string>();
  const rangeVisitors = new Set<string>();
  const rangeClickers = new Set<string>();

  let dayViews = 0;
  let dayClicks = 0;
  let monthViews = 0;
  let monthClicks = 0;
  let yearViews = 0;
  let yearClicks = 0;
  let rangeViews = 0;
  let rangeClicks = 0;

  const bucketKeys = buildEmptyBrtBuckets(range, now);
  const bucketVisitorsMap = new Map<string, Set<string>>();
  const bucketClicksMap = new Map<string, number>();
  const bucketOrdersMap = new Map<string, number>();
  const bucketRevenueMap = new Map<string, number>();
  for (const k of bucketKeys) {
    bucketVisitorsMap.set(k, new Set<string>());
    bucketClicksMap.set(k, 0);
    bucketOrdersMap.set(k, 0);
    bucketRevenueMap.set(k, 0);
  }

  const clickMap = new Map<
    string,
    {
      label: string;
      area: string;
      path: string;
      href: string | null;
      clicks: number;
      visitors: Set<string>;
    }
  >();
  const pageMap = new Map<
    string,
    { path: string; views: number; clicks: number; visitors: Set<string> }
  >();
  const sourceMap = new Map<
    string,
    { source: string; views: number; visitors: Set<string> }
  >();
  const deviceMap = new Map<string, Set<string>>();
  const countryMap = new Map<string, { country: string; views: number; visitors: Set<string> }>();

  for (const ev of yearEvents) {
    const ts = ev.createdAt.getTime();
    const isView = ev.eventType === "PAGE_VIEW";
    const isClick = ev.eventType === "CLICK";

    yearVisitors.add(ev.visitorId);
    if (isView) yearViews++;
    if (isClick) yearClicks++;

    if (ts >= monthStart.getTime()) {
      monthVisitors.add(ev.visitorId);
      if (isView) monthViews++;
      if (isClick) monthClicks++;
    }
    if (ts >= dayStart.getTime()) {
      dayVisitors.add(ev.visitorId);
      if (isView) dayViews++;
      if (isClick) dayClicks++;
    }

    if (ts >= rangeStart.getTime()) {
      rangeVisitors.add(ev.visitorId);
      const bKey = getBrtBucketKey(ev.createdAt, range);
      bucketVisitorsMap.get(bKey)?.add(ev.visitorId);

      if (isView) {
        rangeViews++;
        const pEntry = pageMap.get(ev.path) || {
          path: ev.path,
          views: 0,
          clicks: 0,
          visitors: new Set<string>(),
        };
        pEntry.views++;
        pEntry.visitors.add(ev.visitorId);
        pageMap.set(ev.path, pEntry);

        const srcLabel = parseSourceLabel(ev.utmSource, ev.referrer);
        const sEntry = sourceMap.get(srcLabel) || {
          source: srcLabel,
          views: 0,
          visitors: new Set<string>(),
        };
        sEntry.views++;
        sEntry.visitors.add(ev.visitorId);
        sourceMap.set(srcLabel, sEntry);

        const countryCode = (ev.country || "BR/ND").toUpperCase();
        const cEntry = countryMap.get(countryCode) || {
          country: countryCode,
          views: 0,
          visitors: new Set<string>(),
        };
        cEntry.views++;
        cEntry.visitors.add(ev.visitorId);
        countryMap.set(countryCode, cEntry);
      }

      if (isClick) {
        rangeClicks++;
        rangeClickers.add(ev.visitorId);
        bucketClicksMap.set(bKey, (bucketClicksMap.get(bKey) || 0) + 1);

        const pEntry = pageMap.get(ev.path) || {
          path: ev.path,
          views: 0,
          clicks: 0,
          visitors: new Set<string>(),
        };
        pEntry.clicks++;
        pEntry.visitors.add(ev.visitorId);
        pageMap.set(ev.path, pEntry);

        const cleanLabel = (ev.targetLabel || "Clique").trim();
        const cleanArea = (ev.targetArea || "pagina").trim();
        const key = `${cleanLabel}__${cleanArea}__${ev.path}`;
        const existing = clickMap.get(key) || {
          label: cleanLabel,
          area: cleanArea,
          path: ev.path,
          href: ev.targetHref,
          clicks: 0,
          visitors: new Set<string>(),
        };
        existing.clicks++;
        existing.visitors.add(ev.visitorId);
        clickMap.set(key, existing);
      }

      const dev = ev.deviceType || "desktop";
      if (!deviceMap.has(dev)) deviceMap.set(dev, new Set<string>());
      deviceMap.get(dev)!.add(ev.visitorId);
    }
  }

  // ── Revenue & Order Aggregations (Day / Month / Year + Range) ──
  let revenueDayBrl = 0;
  let revenueMonthBrl = 0;
  let revenueYearBrl = 0;
  let revenueRangeBrl = 0;
  let paidCountDay = 0;
  let paidCountMonth = 0;
  let paidCountYear = 0;
  let paidCountRange = 0;

  for (const dep of yearDeposits) {
    const dt = dep.paidAt ?? dep.createdAt;
    const ts = dt.getTime();
    const brl = toBrlAmount(dep.amount, dep.currency, fxRates);

    if (ts >= yearStart.getTime()) {
      revenueYearBrl += brl;
      paidCountYear++;
    }
    if (ts >= monthStart.getTime()) {
      revenueMonthBrl += brl;
      paidCountMonth++;
    }
    if (ts >= dayStart.getTime()) {
      revenueDayBrl += brl;
      paidCountDay++;
    }
    if (ts >= rangeStart.getTime()) {
      revenueRangeBrl += brl;
      paidCountRange++;
      const bKey = getBrtBucketKey(dt, range);
      bucketRevenueMap.set(bKey, Number(((bucketRevenueMap.get(bKey) || 0) + brl).toFixed(2)));
    }
  }

  let ordersRangeCount = 0;
  let ordersDayCount = 0;
  let ordersMonthCount = 0;
  let ordersYearCount = 0;
  let profitRangeBrl = 0;
  let failoverSavedCount = 0;
  let failedOrdersCount = 0;

  for (const ord of yearOrders) {
    const ts = ord.createdAt.getTime();
    ordersYearCount++;
    if (ord.status === "FAILED") failedOrdersCount++;
    if (ord.failoverUsed && ord.status !== "FAILED") failoverSavedCount++;

    if (ts >= monthStart.getTime()) ordersMonthCount++;
    if (ts >= dayStart.getTime()) ordersDayCount++;
    if (ts >= rangeStart.getTime()) {
      ordersRangeCount++;
      profitRangeBrl += ord.profit;
      const bKey = getBrtBucketKey(ord.createdAt, range);
      bucketOrdersMap.set(bKey, (bucketOrdersMap.get(bKey) || 0) + 1);
    }
  }

  const series = bucketKeys.map((bucket) => ({
    bucket,
    visitors: bucketVisitorsMap.get(bucket)?.size || 0,
    clicks: bucketClicksMap.get(bucket) || 0,
    orders: bucketOrdersMap.get(bucket) || 0,
    revenueBrl: Number((bucketRevenueMap.get(bucket) || 0).toFixed(2)),
  }));

  const clickHotspots = Array.from(clickMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 25)
    .map((item) => ({
      label: item.label,
      area: item.area,
      path: item.path,
      href: item.href,
      clicks: item.clicks,
      uniqueVisitors: item.visitors.size,
      sharePercent:
        rangeClicks > 0 ? Number(((item.clicks / rangeClicks) * 100).toFixed(1)) : 0,
    }));

  const topPages = Array.from(pageMap.values())
    .sort((a, b) => b.views - a.views)
    .slice(0, 15)
    .map((p) => ({
      path: p.path,
      views: p.views,
      clicks: p.clicks,
      uniqueVisitors: p.visitors.size,
    }));

  const topSources = Array.from(sourceMap.values())
    .sort((a, b) => b.visitors.size - a.visitors.size)
    .slice(0, 10)
    .map((s) => ({
      source: s.source,
      views: s.views,
      visitors: s.visitors.size,
    }));

  const totalDeviceVisitors = Math.max(1, rangeVisitors.size);
  const devices = ["mobile", "desktop", "tablet"].map((name) => {
    const count = deviceMap.get(name)?.size || 0;
    return {
      device: name,
      visitors: count,
      percent: Number(((count / totalDeviceVisitors) * 100).toFixed(1)),
    };
  });

  const countries = Array.from(countryMap.values())
    .sort((a, b) => b.visitors.size - a.visitors.size)
    .slice(0, 10)
    .map((c) => ({
      country: c.country,
      views: c.views,
      visitors: c.visitors.size,
    }));

  const conversionRate =
    rangeVisitors.size > 0
      ? Number(((paidCountRange / rangeVisitors.size) * 100).toFixed(2))
      : 0;

  const avgTicketBrl =
    paidCountRange > 0 ? Number((revenueRangeBrl / paidCountRange).toFixed(2)) : 0;

  const ownerEmails = (process.env.OWNER_ALERT_EMAIL || process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.includes("@"));

  const ownerPhone =
    (
      process.env.OWNER_ALERT_WHATSAPP ||
      process.env.SUPPORT_ALERT_WHATSAPP ||
      DEFAULT_OWNER_WHATSAPP
    ).replace(/\D/g, "") || DEFAULT_OWNER_WHATSAPP;

  return NextResponse.json({
    range,
    generatedAtBrt: formatBrtDateTime(now),
    traffic: {
      day: { visitors: dayVisitors.size, pageviews: dayViews, clicks: dayClicks },
      month: { visitors: monthVisitors.size, pageviews: monthViews, clicks: monthClicks },
      year: { visitors: yearVisitors.size, pageviews: yearViews, clicks: yearClicks },
      range: {
        visitors: rangeVisitors.size,
        pageviews: rangeViews,
        clicks: rangeClicks,
        clickers: rangeClickers.size,
      },
    },
    revenue: {
      dayBrl: Number(revenueDayBrl.toFixed(2)),
      monthBrl: Number(revenueMonthBrl.toFixed(2)),
      yearBrl: Number(revenueYearBrl.toFixed(2)),
      rangeBrl: Number(revenueRangeBrl.toFixed(2)),
      paidCountDay,
      paidCountMonth,
      paidCountYear,
      paidCountRange,
      avgTicketBrl,
      conversionRate,
      profitRangeBrl: Number(profitRangeBrl.toFixed(2)),
    },
    operations: {
      ordersDayCount,
      ordersMonthCount,
      ordersYearCount,
      ordersRangeCount,
      failoverSavedCount,
      failedOrdersCount,
      totalUsersCount,
      activeProvidersCount: providers.filter((p) => p.isActive).length,
      fallbackRoutesCount: fallbacks.filter((f) => f.isActive).length,
    },
    funnel: [
      { step: "Visitantes Únicos", value: rangeVisitors.size },
      { step: "Clicaram no Site", value: rangeClickers.size },
      { step: "Novas Contas", value: rangeNewUsersCount },
      { step: "Pagamentos Confirmados", value: paidCountRange },
      { step: "Solicitações / Pedidos", value: ordersRangeCount },
    ],
    series,
    clickHotspots,
    topPages,
    topSources,
    devices,
    countries,
    orders: filteredOrders.map((ord) => {
      const latestPaid = latestPaidByUser.get(ord.userId) || null;
      return {
        id: ord.id,
        userId: ord.user.id,
        userName: ord.user.name,
        username: ord.user.username,
        userEmail: ord.user.email,
        link: ord.link,
        profileHandle: extractProfileHandle(ord.link),
        serviceId: ord.service.id,
        serviceName: ord.service.name,
        network: ord.service.category.network,
        quantity: ord.quantity,
        charge: ord.charge,
        cost: ord.cost,
        profit: ord.profit,
        status: ord.status,
        createdAt: ord.createdAt.toISOString(),
        createdAtBrt: formatBrtDateTime(ord.createdAt),
        paidAt: latestPaid ? latestPaid.paidAt.toISOString() : null,
        paidAtBrt: latestPaid ? formatBrtDateTime(latestPaid.paidAt) : null,
        paidAmount: latestPaid ? latestPaid.amount : null,
        paidCurrency: latestPaid ? latestPaid.currency : null,
        paidMethod: latestPaid ? latestPaid.method : null,
        providerId: ord.provider?.id ?? null,
        providerName: ord.provider?.name ?? null,
        providerMode: ord.provider?.mode ?? null,
        providerOrderId: ord.providerOrderId,
        failoverUsed: ord.failoverUsed,
        lastError: ord.lastError,
        dispatchAttempts: safeParseAttempts(ord.dispatchAttempts),
      };
    }),
    payments: recentDeposits.map((dep) => {
      const effectivePaidAt = dep.paidAt ?? null;
      return {
        id: dep.id,
        txid: dep.txid,
        userName: dep.user.name,
        username: dep.user.username,
        userEmail: dep.user.email,
        amount: dep.amount,
        amountBrl: toBrlAmount(dep.amount, dep.currency, fxRates),
        currency: dep.currency,
        method: dep.method,
        status: dep.status,
        paidAt: effectivePaidAt ? effectivePaidAt.toISOString() : null,
        paidAtBrt: effectivePaidAt ? formatBrtDateTime(effectivePaidAt) : null,
        createdAt: dep.createdAt.toISOString(),
        createdAtBrt: formatBrtDateTime(dep.createdAt),
        latestOrder: latestOrderByUser.get(dep.userId) ?? null,
      };
    }),
    providers: providers.map((p) => ({
      id: p.id,
      name: p.name,
      mode: p.mode,
      priority: p.priority,
      cachedBalance: p.cachedBalance,
      cachedCurrency: p.cachedCurrency,
      isActive: p.isActive,
      lastSyncedAt: p.lastSyncedAt ? formatBrtDateTime(p.lastSyncedAt) : null,
      servicesCount: p._count.services,
      ordersCount: p._count.orders,
      fallbacksCount: p._count.fallbacks,
    })),
    fallbacks: fallbacks.map((f) => ({
      id: f.id,
      serviceId: f.serviceId,
      serviceName: f.service.name,
      network: f.service.category.network,
      providerId: f.providerId,
      providerName: f.provider.name,
      providerMode: f.provider.mode,
      providerActive: f.provider.isActive,
      providerServiceId: f.providerServiceId,
      priority: f.priority,
      isActive: f.isActive,
    })),
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      network: s.category.network,
      providerId: s.providerId,
      providerName: s.provider?.name ?? null,
      providerServiceId: s.providerServiceId,
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      kind: n.kind,
      referenceId: n.referenceId,
      recipientEmail: n.recipientEmail,
      recipientPhone: n.recipientPhone,
      emailOk: n.emailOk,
      emailError: n.emailError,
      whatsappOk: n.whatsappOk,
      whatsappProvider: n.whatsappProvider,
      whatsappError: n.whatsappError,
      summary: n.summary,
      createdAtBrt: formatBrtDateTime(n.createdAt),
    })),
    channels: {
      ownerPhone,
      ownerEmails,
      hasResend: Boolean(process.env.RESEND_API_KEY?.trim()),
      hasWaha: Boolean(
        process.env.WAHA_API_BASE_URL?.trim() && process.env.WAHA_API_KEY?.trim()
      ),
      hasAtenzaMcp: Boolean(
        process.env.ATENZA_MCP_TOKEN?.trim() || rawAlertSecrets?.atenzaMcpToken?.trim()
      ),
    },
  });
}
