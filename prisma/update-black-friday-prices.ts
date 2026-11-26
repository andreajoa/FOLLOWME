import { PrismaClient } from "@prisma/client";
import {
  BLACK_FRIDAY_ENDS_AT_ISO,
  PROFITABLE_BLACK_FRIDAY_BRL_RATES,
} from "../src/lib/black-friday";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  if (existing?.blackFridayFinalizedAt) {
    console.log(
      "Black Friday already finalized on",
      existing.blackFridayFinalizedAt.toISOString(),
      "— skipping promo reset."
    );
    return;
  }

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: {
      blackFridayEnabled: true,
      blackFridayEndsAt: new Date(BLACK_FRIDAY_ENDS_AT_ISO),
      blackFridayFinalizedAt: null,
    },
    create: {
      id: "default",
      blackFridayEnabled: true,
      blackFridayEndsAt: new Date(BLACK_FRIDAY_ENDS_AT_ISO),
      blackFridayFinalizedAt: null,
    },
  });

  let updated = 0;
  for (const [providerServiceId, pricing] of Object.entries(
    PROFITABLE_BLACK_FRIDAY_BRL_RATES
  )) {
    const res = await prisma.service.updateMany({
      where: { providerServiceId },
      data: {
        rate: pricing.rate,
        providerRate: pricing.providerRate,
      },
    });
    updated += res.count;
  }

  console.log(
    `Updated ${updated} services with profitable Brazil Black Friday BRL rates (ends ${BLACK_FRIDAY_ENDS_AT_ISO}).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
