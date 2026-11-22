import { buildPlatformMetadata, PlatformSeoPage } from "@/components/platform-seo-page";

export const dynamic = "force-dynamic";
export const metadata = buildPlatformMetadata("instagram", "pt", "/pt");

export default async function PortugueseInstagramPage() {
  return <PlatformSeoPage platform="instagram" locale="pt" currency="BRL" routePrefix="/pt" />;
}
