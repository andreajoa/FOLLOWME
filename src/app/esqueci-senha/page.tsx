import { Suspense } from "react";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { ResetPasswordClient } from "@/components/reset-password-client";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const [user, settings, prefs] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getRequestPreferences(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C]">
      <PublicHeader
        brandName={settings.brandName}
        user={user ? { username: user.username, role: user.role } : null}
        locale={prefs.locale}
        currency={prefs.currency}
      />
      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <Suspense fallback={<div className="font-mono text-xs text-[#98A0AD]">Carregando...</div>}>
          <ResetPasswordClient />
        </Suspense>
      </main>
      <PublicFooter
        brandName={settings.brandName}
        supportEmail={settings.supportEmail}
        supportWhatsapp={settings.supportWhatsapp}
      />
    </div>
  );
}
