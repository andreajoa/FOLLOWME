import type { Metadata } from "next";
import { getRequestPreferences } from "@/lib/auth";
import { buildPlatformMetadata, PlatformSeoPage } from "@/components/platform-seo-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const prefs = await getRequestPreferences();
  return buildPlatformMetadata("tiktok", prefs.locale, "");
}

export default async function TikTokPage() {
  const prefs = await getRequestPreferences();
  return <PlatformSeoPage platform="tiktok" locale={prefs.locale} currency={prefs.currency} routePrefix="" />;
}
