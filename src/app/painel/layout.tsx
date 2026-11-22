import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PanelShell } from "@/components/panel-shell";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <PanelShell
      brandName={settings.brandName}
      announcement={settings.announcement}
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
