import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { toBlackFridayConfig } from "@/lib/black-friday";
import { applyEffectiveBrlPricing } from "@/lib/black-friday-server";
import { SubscriptionsClient } from "@/components/subscriptions-client";

export const dynamic = "force-dynamic";

export default async function PanelSubscriptionsPage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
  ]);

  const [rawServices, subscriptions] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ type: "desc" }, { id: "asc" }],
      take: 60,
    }),
    prisma.subscription.findMany({
      where: { userId: user!.id },
      include: {
        service: { select: { id: true, name: true, rate: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  const services = applyEffectiveBrlPricing(
    rawServices,
    toBlackFridayConfig(settings)
  );

  const prioritized = [
    ...services.filter((s) => s.type === "SUBSCRIPTIONS"),
    ...services.filter((s) => s.type !== "SUBSCRIPTIONS"),
  ];

  return (
    <SubscriptionsClient
      services={prioritized.map((s) => ({
        id: s.id,
        name: s.name,
        rate: s.rate,
        min: s.min,
        max: s.max,
        description: s.description,
      }))}
      initialSubscriptions={subscriptions.map((sub) => ({
        id: sub.id,
        username: sub.username,
        min: sub.min,
        max: sub.max,
        posts: sub.posts,
        oldPosts: sub.oldPosts,
        delay: sub.delay,
        expiry: sub.expiry ? sub.expiry.toISOString() : null,
        postsDelivered: sub.postsDelivered,
        status: sub.status,
        createdAt: sub.createdAt.toISOString(),
        service: sub.service,
      }))}
    />
  );
}
