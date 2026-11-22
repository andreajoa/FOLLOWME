import { buildPlatformMetadata, PlatformSeoPage } from "@/components/platform-seo-page";

export const dynamic = "force-dynamic";
export const metadata = buildPlatformMetadata("youtube", "en", "/en");

export default async function EnglishYouTubePage() {
  return <PlatformSeoPage platform="youtube" locale="en" currency="USD" routePrefix="/en" />;
}
