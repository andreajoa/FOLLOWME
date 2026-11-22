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
    <div className="min-h-screen flex flex-col fn-hero-canvas text-[#111015]">
      <PublicHeader
        brandName={settings.brandName}
        user={null}
        locale={prefs.locale}
        currency={prefs.currency}
      />

      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2.5">
            <span className="fn-eyebrow-pill inline-flex items-center gap-2 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#18141d]">
              <span className="h-2 w-2 rounded-full bg-[#8c42ed]" />
              {isPt ? `Acesso Seguro · ${settings.brandName}` : `Secure Access · ${settings.brandName}`}
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-black tracking-[-0.045em] text-[#111015]">
              {isPt ? "Entre ou crie sua conta" : "Sign in or create your account"}
            </h1>
            <p className="text-sm font-medium text-[#66616d]">
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
