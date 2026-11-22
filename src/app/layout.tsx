import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { getLandingCopy } from "@/lib/landing-copy";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
});

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
    alternates: {
      canonical: "/",
      languages: {
        "en-US": "/en",
        "pt-BR": "/pt",
        "x-default": "/en",
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
    <html
      lang={htmlLang}
      className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#090A0C] text-[#F4F5F6] antialiased">
        {children}
      </body>
    </html>
  );
}
