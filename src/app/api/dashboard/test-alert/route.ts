import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { sendOwnerTestAlert } from "@/lib/owner-alerts";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const settings = await getSiteSettings().catch(() => null);
  const result = await sendOwnerTestAlert(settings?.supportEmail);
  return NextResponse.json({ ok: true, ...result });
}
