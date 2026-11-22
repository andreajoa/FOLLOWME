import { buildPlatformMetadata, PlatformSeoPage } from "@/components/platform-seo-page";

export const dynamic = "force-dynamic";
export const metadata = buildPlatformMetadata("tiktok", "en", "/en");

export default async function EnglishTikTokPage() {
  return <PlatformSeoPage platform="tiktok" locale="en" currency="USD" routePrefix="/en" />;
}
