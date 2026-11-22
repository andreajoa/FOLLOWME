import type { Metadata } from "next";
import { getRequestPreferences } from "@/lib/auth";
import { buildPlatformMetadata, PlatformSeoPage } from "@/components/platform-seo-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const prefs = await getRequestPreferences();
  return buildPlatformMetadata("instagram", prefs.locale, "");
}

export default async function InstagramPage() {
  const prefs = await getRequestPreferences();
  return <PlatformSeoPage platform="instagram" locale={prefs.locale} currency={prefs.currency} routePrefix="" />;
}
