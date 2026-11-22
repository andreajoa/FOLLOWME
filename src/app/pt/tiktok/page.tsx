import { buildPlatformMetadata, PlatformSeoPage } from "@/components/platform-seo-page";

export const dynamic = "force-dynamic";
export const metadata = buildPlatformMetadata("tiktok", "pt", "/pt");

export default async function PortugueseTikTokPage() {
  return <PlatformSeoPage platform="tiktok" locale="pt" currency="BRL" routePrefix="/pt" />;
}
