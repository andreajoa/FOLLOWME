import { prisma } from "./prisma";

export async function getSiteSettings() {
  const existing = await prisma.siteSetting.findUnique({
    where: { id: "default" },
  });
  const record =
    existing ??
    (await prisma.siteSetting.create({
      data: { id: "default" },
    }));

  return {
    ...record,
    atenzaMcpToken: undefined,
    supportWebhookSecret: undefined,
  };
}
