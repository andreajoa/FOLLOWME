import type { Metadata } from "next";
import { getRequestPreferences } from "@/lib/auth";
import { buildPlatformMetadata, PlatformSeoPage } from "@/components/platform-seo-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const prefs = await getRequestPreferences();
  return buildPlatformMetadata("youtube", prefs.locale, "");
}

export default async function YouTubePage() {
  const prefs = await getRequestPreferences();
  return <PlatformSeoPage platform="youtube" locale={prefs.locale} currency={prefs.currency} routePrefix="" />;
}
