import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateApiKey, getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const apiKey = generateApiKey();
  await prisma.user.update({
    where: { id: user.id },
    data: { apiKey },
  });

  return NextResponse.json({ apiKey });
}
