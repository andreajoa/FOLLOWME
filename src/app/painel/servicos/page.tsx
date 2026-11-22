import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ServiceCatalogTable } from "@/components/service-catalog-table";

export const dynamic = "force-dynamic";

export default async function PanelServicesPage() {
  const user = (await getCurrentUser())!;
  const [services, favs] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: { category: { select: { name: true, network: true } } },
      orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }],
    }),
    prisma.favoriteService.findMany({
      where: { userId: user.id },
      select: { serviceId: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          Tabela Completa de Serviços
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          Serviços Disponíveis
        </h1>
        <p className="mt-1 text-sm text-[#98A0AD]">
          Favorite os serviços que você mais usa para encontrá-los rapidamente na
          tela de Novo Pedido.
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
        initialFavorites={favs.map((f) => f.serviceId)}
        isLoggedIn={true}
        inPanel={true}
      />
    </div>
  );
}
