import { redirect } from "next/navigation";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PanelShell } from "@/components/panel-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings, prefs] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getRequestPreferences(),
  ]);

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/painel");
  }

  return (
    <PanelShell
      brandName={settings.brandName}
      announcement=""
      locale={prefs.locale}
      currency={prefs.currency}
      usdRate={settings.usdRate}
      eurRate={settings.eurRate}
      user={{
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        totalSpent: user.totalSpent,
        apiKey: user.apiKey,
        referralCode: user.referralCode,
      }}
    >
      {children}
    </PanelShell>
  );
}
