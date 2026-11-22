import { redirect } from "next/navigation";
import { getCurrentUser, getRequestPreferences } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; ref?: string; service?: string; qty?: string }>;
}) {
  const [user, settings, prefs, sp] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    getRequestPreferences(),
    searchParams,
  ]);

  if (user) {
    const query = new URLSearchParams();
    if (sp.service) query.set("service", sp.service);
    if (sp.qty) query.set("qty", sp.qty);
    const qs = query.toString();
    redirect(qs ? `/painel?${qs}` : "/painel");
  }

  const isPt = prefs.locale === "pt";

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C]">
      <PublicHeader
        brandName={settings.brandName}
        user={null}
        locale={prefs.locale}
        currency={prefs.currency}
      />

      <main className="bg-tech-grid flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
              {isPt ? `Acesso Seguro · ${settings.brandName}` : `Secure Access · ${settings.brandName}`}
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
              {isPt ? "Entre ou crie sua conta" : "Sign in or create your account"}
            </h1>
            <p className="text-sm text-[#98A0AD]">
              {isPt
                ? "Recarga automática 24h via Stripe (Pix e Cartão), pedidos rápidos e API v2 liberada no cadastro."
                : "Instant Stripe checkout in USD, live order tracking, 30-day refill protection, and API v2 included."}
            </p>
          </div>

          <AuthForm
            initialTab={sp.tab === "register" ? "register" : "login"}
            initialRef={sp.ref || ""}
            redirectService={sp.service || ""}
            redirectQty={sp.qty || ""}
            locale={prefs.locale}
          />
        </div>
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
