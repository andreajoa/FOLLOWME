import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; ref?: string; service?: string }>;
}) {
  const [user, settings, sp] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    searchParams,
  ]);

  if (user) {
    redirect(sp.service ? `/painel?service=${sp.service}` : "/painel");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C]">
      <PublicHeader brandName={settings.brandName} user={null} />

      <main className="bg-tech-grid flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
              Acesso Seguro • {settings.brandName}
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
              Entre ou crie sua conta
            </h1>
            <p className="text-sm text-[#98A0AD]">
              Recarga Pix automática 24h, preços de atacado e API v2 liberada no
              ato do cadastro.
            </p>
          </div>

          <AuthForm
            initialTab={sp.tab === "register" ? "register" : "login"}
            initialRef={sp.ref || ""}
            redirectService={sp.service || ""}
          />
        </div>
      </main>

      <PublicFooter
        brandName={settings.brandName}
        supportEmail={settings.supportEmail}
        supportWhatsapp={settings.supportWhatsapp}
      />
    </div>
  );
}
