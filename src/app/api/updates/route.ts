import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const updates = await prisma.serviceUpdate.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return NextResponse.json({ updates });
}
