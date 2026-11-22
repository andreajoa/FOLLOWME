import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { ServiceCatalogTable } from "@/components/service-catalog-table";

export const dynamic = "force-dynamic";

export default async function PublicServicesPage() {
  const [user, settings, services] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: { category: { select: { name: true, network: true } } },
      orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }],
    }),
  ]);

  let favoriteIds: number[] = [];
  if (user) {
    const favs = await prisma.favoriteService.findMany({
      where: { userId: user.id },
      select: { serviceId: true },
    });
    favoriteIds = favs.map((f) => f.serviceId);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090A0C]">
      <PublicHeader
        brandName={settings.brandName}
        user={user ? { username: user.username, role: user.role } : null}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
            Catálogo Oficial Atualizado
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">
            Lista Completa de Serviços SMM
          </h1>
          <p className="mt-2 text-sm text-[#98A0AD]">
            Todos os valores abaixo correspondem ao preço por{" "}
            <strong className="text-[#F4F5F6]">1.000 unidades</strong> em Reais
            (BRL). Você pode contratar a partir do mínimo de cada serviço.
          </p>
        </div>

        <ServiceCatalogTable
          services={services.map((s) => ({
            id: s.id,
            categoryId: s.categoryId,
            categoryName: s.category.name,
            network: s.category.network,
            name: s.name,
            type: s.type,
            description: s.description,
            rate: s.rate,
            min: s.min,
            max: s.max,
            averageTime: s.averageTime,
            refill: s.refill,
            refillDays: s.refillDays,
            cancel: s.cancel,
            dripfeed: s.dripfeed,
          }))}
          initialFavorites={favoriteIds}
          isLoggedIn={Boolean(user)}
        />
      </main>

      <PublicFooter
        brandName={settings.brandName}
        supportEmail={settings.supportEmail}
        supportWhatsapp={settings.supportWhatsapp}
      />
    </div>
  );
}
