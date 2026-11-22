import { buildPlatformMetadata, PlatformSeoPage } from "@/components/platform-seo-page";

export const dynamic = "force-dynamic";
export const metadata = buildPlatformMetadata("instagram", "en", "/en");

export default async function EnglishInstagramPage() {
  return <PlatformSeoPage platform="instagram" locale="en" currency="USD" routePrefix="/en" />;
}
