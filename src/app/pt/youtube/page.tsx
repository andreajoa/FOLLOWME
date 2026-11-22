import { buildPlatformMetadata, PlatformSeoPage } from "@/components/platform-seo-page";

export const dynamic = "force-dynamic";
export const metadata = buildPlatformMetadata("youtube", "pt", "/pt");

export default async function PortugueseYouTubePage() {
  return <PlatformSeoPage platform="youtube" locale="pt" currency="BRL" routePrefix="/pt" />;
}
