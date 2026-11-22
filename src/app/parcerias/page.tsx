import type { Metadata } from "next";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { CooperationClient } from "@/components/cooperation-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agency, Reseller & White-Label Child Panel Program | FollowMe",
  description:
    "Scale client accounts or launch a white-label SMM Child Panel with VIP wholesale rates, API v2 integration, and dedicated support on FollowMe.",
  alternates: { canonical: "/parcerias" },
};

export default async function PublicCooperationPage() {
  const [user, settings, prefs] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getRequestPreferences(),
  ]);

  return (
    <div className="min-h-screen flex flex-col fn-hero-canvas text-[#111015]">
      <PublicHeader
        brandName={settings.brandName}
        user={user ? { username: user.username, role: user.role } : null}
        locale={prefs.locale}
        currency={prefs.currency}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <CooperationClient
          brandName={settings.brandName}
          defaultName={user?.name || ""}
          defaultEmail={user?.email || ""}
          defaultWhatsapp={user?.whatsapp || ""}
        />
      </main>
      <PublicFooter
        brandName={settings.brandName}
        supportEmail={settings.supportEmail}
        supportWhatsapp={settings.supportWhatsapp}
        locale={prefs.locale}
      />
    </div>
  );
}
