import type { Metadata } from "next";
import { getLandingCopy } from "@/lib/landing-copy";
import { LandingPageView } from "@/components/landing-page-view";

export const dynamic = "force-dynamic";

const copy = getLandingCopy("pt");

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: {
    canonical: "/pt",
    languages: {
      "pt-BR": "/pt",
      "en-US": "/en",
      "x-default": "/en",
    },
  },
  openGraph: {
    title: copy.metaTitle,
    description: copy.metaDescription,
    locale: "pt_BR",
    type: "website",
    images: ["/media/hero-creator.jpg"],
  },
};

export default async function PortugueseHomePage() {
  return <LandingPageView locale="pt" currency="BRL" routePrefix="/pt" />;
}
