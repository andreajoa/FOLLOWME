import type { Metadata } from "next";
import { getLandingCopy } from "@/lib/landing-copy";
import { buildInternationalAlternates } from "@/lib/seo-guides";
import { LandingPageView } from "@/components/landing-page-view";

export const dynamic = "force-dynamic";

const copy = getLandingCopy("en");

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: {
    canonical: "/en",
    languages: buildInternationalAlternates("/en", "/pt"),
  },
  openGraph: {
    title: copy.metaTitle,
    description: copy.metaDescription,
    locale: "en_US",
    alternateLocale: ["en_CA", "en_GB", "en_AU", "pt_BR"],
    type: "website",
    images: ["/media/hero-creator.jpg"],
  },
};

export default async function EnglishHomePage() {
  return <LandingPageView locale="en" currency="USD" routePrefix="/en" />;
}
