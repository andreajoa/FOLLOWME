import type { Metadata } from "next";
import { getLandingCopy } from "@/lib/landing-copy";
import { LandingPageView } from "@/components/landing-page-view";

export const dynamic = "force-dynamic";

const copy = getLandingCopy("en");

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: {
    canonical: "/en",
    languages: {
      "en-US": "/en",
      "pt-BR": "/pt",
      "x-default": "/en",
    },
  },
  openGraph: {
    title: copy.metaTitle,
    description: copy.metaDescription,
    locale: "en_US",
    type: "website",
    images: ["/media/hero-creator.jpg"],
  },
};

export default async function EnglishHomePage() {
  return <LandingPageView locale="en" currency="USD" routePrefix="/en" />;
}
