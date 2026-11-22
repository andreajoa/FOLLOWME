import { prisma } from "./prisma";

export async function getSiteSettings() {
  const existing = await prisma.siteSetting.findUnique({
    where: { id: "default" },
  });
  if (existing) return existing;

  return prisma.siteSetting.create({
    data: { id: "default" },
  });
}
