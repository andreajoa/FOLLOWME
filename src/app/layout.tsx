import type { Metadata } from "next";
import "./globals.css";
import { getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { getLandingCopy } from "@/lib/landing-copy";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, prefs] = await Promise.all([
    getSiteSettings().catch(() => null),
    getRequestPreferences().catch(() => ({ locale: "en" as const, currency: "USD" as const })),
  ]);

  const brand = settings?.brandName || "FollowMe";
  const copy = getLandingCopy(prefs.locale);
  const appUrl = (process.env.APP_URL || "https://followme.nexaclouds.online").replace(/\/+$/, "");

  return {
    metadataBase: new URL(appUrl),
    title: copy.metaTitle.replace("FollowMe", brand),
    description: copy.metaDescription,
    keywords:
      prefs.locale === "pt"
        ? [
            "comprar seguidores instagram",
            "comprar curtidas instagram pix",
            "comprar seguidores tiktok liberar live",
            "comprar inscritos youtube",
            "painel smm brasil stripe pix",
          ]
        : [
            "buy instagram followers usa",
            "buy instagram likes and reels views",
            "buy tiktok followers live",
            "buy youtube subscribers watch time",
            "smm panel api v2 stripe usd",
          ],
    authors: [{ name: `${brand} Growth Editorial Team`, url: appUrl }],
    creator: brand,
    publisher: brand,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: "/",
      languages: {
        "en-US": "/en",
        "pt-BR": "/pt",
        "x-default": "/en",
      },
      types: {
        "text/plain": "/llms.txt",
      },
    },
    openGraph: {
      title: copy.metaTitle.replace("FollowMe", brand),
      description: copy.metaDescription,
      url: appUrl,
      siteName: brand,
      locale: prefs.locale === "pt" ? "pt_BR" : prefs.locale === "es" ? "es_ES" : "en_US",
      type: "website",
      images: [
        {
          url: "/media/hero-creator.jpg",
          width: 1376,
          height: 768,
          alt: `${brand} social growth platform`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metaTitle.replace("FollowMe", brand),
      description: copy.metaDescription,
      images: ["/media/hero-creator.jpg"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const prefs = await getRequestPreferences().catch(() => ({
    locale: "en" as const,
    currency: "USD" as const,
  }));
  const htmlLang =
    prefs.locale === "pt" ? "pt-BR" : prefs.locale === "es" ? "es" : "en-US";

  return (
    <html lang={htmlLang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-[#faf8fd] text-[#111015] antialiased">
        {children}
      </body>
    </html>
  );
}
