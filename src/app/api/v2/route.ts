import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/auth";
import {
  cancelAndRefundOrder,
  createSubscriptionOrder,
  placeSingleOrder,
} from "@/lib/order-service";
import { requestProviderRefill, toExternalSmmStatus } from "@/lib/smm-provider";

function mapExternalServiceType(type: string): string {
  switch (type) {
    case "PACKAGE":
      return "Package";
    case "CUSTOM_COMMENTS":
      return "Custom Comments";
    case "COMMENT_LIKES":
      return "Comment Likes";
    case "POLL":
      return "Poll";
    case "SUBSCRIPTIONS":
      return "Subscriptions";
    default:
      return "Default";
  }
}

function parseExpiryDate(raw?: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const dmy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}T23:59:59Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function extractParams(req: NextRequest): Promise<Record<string, string>> {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      for (const [k, v] of Object.entries(json)) {
        if (v !== undefined && v !== null) params[k] = String(v);
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const sp = new URLSearchParams(text);
      sp.forEach((value, key) => {
        params[key] = value;
      });
    } else {
      const text = await req.text();
      if (text.trim().startsWith("{")) {
        try {
          const json = JSON.parse(text) as Record<string, unknown>;
          for (const [k, v] of Object.entries(json)) {
            if (v !== undefined && v !== null) params[k] = String(v);
          }
        } catch {
          // ignore malformed fallback
        }
      } else if (text.includes("=")) {
        const sp = new URLSearchParams(text);
        sp.forEach((value, key) => {
          params[key] = value;
        });
      }
    }
  }
  return params;
}

async function handleApiV2(req: NextRequest) {
  const params = await extractParams(req);
  const key = params.key?.trim();
  const action = params.action?.trim().toLowerCase();

  if (!key) {
    return NextResponse.json({ error: "API key is required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { apiKey: key } });
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (user.role !== "ADMIN" && !checkRateLimit(`apiv2:${key.slice(0, 16)}`, 120, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  if (action === "balance") {
    return NextResponse.json({
      balance: user.balance.toFixed(4),
      currency: "BRL",
    });
  }

  if (action === "services") {
    const services = await prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: { category: { select: { name: true } } },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(
      services.map((s) => ({
        service: s.id,
        name: s.name,
        type: mapExternalServiceType(s.type),
        category: s.category.name,
        rate: s.rate.toFixed(2),
        min: String(s.min),
        max: String(s.max),
        refill: s.refill,
        cancel: s.cancel,
        dripfeed: s.dripfeed,
      }))
    );
  }

  if (action === "add") {
    const serviceId = Number.parseInt(params.service || "", 10);
    if (!Number.isInteger(serviceId)) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
    }

    const svc = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!svc || !svc.isActive) {
      return NextResponse.json({ error: "Service not found or inactive" }, { status: 400 });
    }

    // Subscriptions (FonteSMM API v2 compatible)
    if (svc.type === "SUBSCRIPTIONS" || (params.username && params.min && params.max && !params.link)) {
      const username = params.username?.trim() || "";
      const min = Number.parseInt(params.min || "0", 10);
      const max = Number.parseInt(params.max || "0", 10);
      const posts = params.posts ? Number.parseInt(params.posts, 10) : undefined;
      const oldPosts = params.old_posts ? Number.parseInt(params.old_posts, 10) : 0;
      const delay = params.delay ? Number.parseInt(params.delay, 10) : 0;
      const expiry = parseExpiryDate(params.expiry);

      try {
        const sub = await createSubscriptionOrder({
          userId: user.id,
          serviceId,
          username,
          min,
          max,
          posts,
          oldPosts,
          delay,
          expiry,
        });
        return NextResponse.json({ order: sub.id, subscription: sub.id });
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Subscription rejected" },
          { status: 400 }
        );
      }
    }

    const link = params.link?.trim() || "";
    const quantity = Number.parseInt(params.quantity || "1", 10);
    const runs = params.runs ? Number.parseInt(params.runs, 10) : undefined;
    const interval = params.interval ? Number.parseInt(params.interval, 10) : undefined;
    const comments = params.comments;
    const username = params.username;
    const answerNumber = params.answer_number;

    if (!link) {
      return NextResponse.json({ error: "Missing link parameter" }, { status: 400 });
    }

    try {
      const order = await placeSingleOrder({
        userId: user.id,
        serviceId,
        link,
        quantity,
        dripfeed: Boolean(runs && interval),
        runs,
        interval,
        comments,
        username,
        answerNumber,
        source: "API",
      });

      return NextResponse.json({ order: order.id });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Order rejected" },
        { status: 400 }
      );
    }
  }

  if (action === "status") {
    if (params.orders) {
      const ids = params.orders
        .split(",")
        .map((n) => Number.parseInt(n.trim(), 10))
        .filter((n) => Number.isInteger(n))
        .slice(0, 100);

      const orders = await prisma.order.findMany({
        where: { userId: user.id, id: { in: ids } },
      });
      const byId = new Map(orders.map((o) => [o.id, o]));
      const result: Record<string, unknown> = {};

      for (const id of ids) {
        const order = byId.get(id);
        if (!order) {
          result[String(id)] = { error: "Incorrect order ID" };
        } else {
          result[String(id)] = {
            charge: order.charge.toFixed(4),
            start_count: String(order.startCount),
            status: toExternalSmmStatus(order.status),
            remains: String(order.remains),
            currency: "BRL",
          };
        }
      }
      return NextResponse.json(result);
    }

    const orderId = Number.parseInt(params.order || "", 10);
    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: "Incorrect order ID" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
    });
    if (!order) {
      return NextResponse.json({ error: "Incorrect order ID" }, { status: 404 });
    }

    return NextResponse.json({
      charge: order.charge.toFixed(4),
      start_count: String(order.startCount),
      status: toExternalSmmStatus(order.status),
      remains: String(order.remains),
      currency: "BRL",
    });
  }

  if (action === "refill") {
    // Multiple refill (FonteSMM API v2)
    if (params.orders) {
      const ids = params.orders
        .split(",")
        .map((n) => Number.parseInt(n.trim(), 10))
        .filter((n) => Number.isInteger(n))
        .slice(0, 100);

      const orders = await prisma.order.findMany({
        where: { userId: user.id, id: { in: ids } },
        include: { service: true, provider: true },
      });
      const byId = new Map(orders.map((o) => [o.id, o]));
      const results = [];

      for (const id of ids) {
        const order = byId.get(id);
        if (!order || !order.service.refill) {
          results.push({ order: id, refill: { error: "Refill not available" } });
          continue;
        }
        if (order.provider && order.providerOrderId && order.provider.isActive) {
          await requestProviderRefill(order.provider, order.providerOrderId).catch(() => null);
        }
        await prisma.order.update({
          where: { id: order.id },
          data: { refillStatus: "REQUESTED", refillRequestedAt: new Date() },
        });
        results.push({ order: id, refill: String(order.id) });
      }
      return NextResponse.json(results);
    }

    const orderId = Number.parseInt(params.order || "", 10);
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { service: true, provider: true },
    });

    if (!order || !order.service.refill) {
      return NextResponse.json({ error: "Refill not available for this order" }, { status: 400 });
    }

    if (order.provider && order.providerOrderId && order.provider.isActive) {
      await requestProviderRefill(order.provider, order.providerOrderId).catch(() => null);
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { refillStatus: "REQUESTED", refillRequestedAt: new Date() },
    });

    return NextResponse.json({ refill: String(order.id) });
  }

  if (action === "refill_status") {
    // Multiple refill status (FonteSMM API v2)
    if (params.refills) {
      const ids = params.refills
        .split(",")
        .map((n) => Number.parseInt(n.trim(), 10))
        .filter((n) => Number.isInteger(n))
        .slice(0, 100);

      const orders = await prisma.order.findMany({
        where: { userId: user.id, id: { in: ids } },
      });
      const byId = new Map(orders.map((o) => [o.id, o]));
      const results = ids.map((id) => {
        const order = byId.get(id);
        if (!order || !order.refillStatus) {
          return { refill: id, status: { error: "Refill not found" } };
        }
        return {
          refill: id,
          status: order.refillStatus === "COMPLETED" ? "Completed" : "In progress",
        };
      });
      return NextResponse.json(results);
    }

    const orderId = Number.parseInt(params.refill || "", 10);
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
    });
    if (!order) {
      return NextResponse.json({ error: "Incorrect refill ID" }, { status: 404 });
    }
    return NextResponse.json({
      status: order.refillStatus === "COMPLETED" ? "Completed" : "In progress",
    });
  }

  if (action === "cancel") {
    const ids = (params.orders || params.order || "")
      .split(",")
      .map((n) => Number.parseInt(n.trim(), 10))
      .filter((n) => Number.isInteger(n))
      .slice(0, 50);

    const results = [];
    for (const id of ids) {
      try {
        await cancelAndRefundOrder(id, user.id, false);
        results.push({ order: id, cancel: 1 });
      } catch (err) {
        results.push({
          order: id,
          cancel: { error: err instanceof Error ? err.message : "Cancel failed" },
        });
      }
    }
    return NextResponse.json(results);
  }

  return NextResponse.json({ error: "Incorrect action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  return handleApiV2(req);
}

export async function GET(req: NextRequest) {
  return handleApiV2(req);
}
