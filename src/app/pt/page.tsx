import type { Metadata } from "next";
import { getLandingCopy } from "@/lib/landing-copy";
import { buildInternationalAlternates } from "@/lib/seo-guides";
import { LandingPageView } from "@/components/landing-page-view";

export const dynamic = "force-dynamic";

const copy = getLandingCopy("pt");

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: {
    canonical: "/pt",
    languages: buildInternationalAlternates("/en", "/pt"),
  },
  openGraph: {
    title: copy.metaTitle,
    description: copy.metaDescription,
    locale: "pt_BR",
    alternateLocale: ["en_US", "en_CA", "en_GB", "en_AU"],
    type: "website",
    images: ["/media/hero-creator.jpg"],
  },
};

export default async function PortugueseHomePage() {
  return <LandingPageView locale="pt" currency="BRL" routePrefix="/pt" />;
}
