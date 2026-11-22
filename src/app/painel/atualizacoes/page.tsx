import { prisma } from "@/lib/prisma";
import { formatDateBR } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

const UPDATE_META: Record<
  string,
  { label: string; tone: "lime" | "emerald" | "orange" | "amber" | "red" | "zinc" }
> = {
  NEW: { label: "Novo Serviço", tone: "lime" },
  RATE_DOWN: { label: "Preço Reduzido", tone: "emerald" },
  RATE_UP: { label: "Reajuste", tone: "amber" },
  REFILL_ON: { label: "Reposição Ativa", tone: "orange" },
  DISABLED: { label: "Desativado", tone: "red" },
};

export default async function PanelUpdatesPage() {
  const updates = await prisma.serviceUpdate.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          Changelog de Servidores
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          Atualizações de Serviços
        </h1>
        <p className="mt-1 text-sm text-[#98A0AD]">
          Acompanhe reduções de preço, novos servidores e melhorias de reposição.
        </p>
      </div>

      <div className="border border-[#232730] bg-[#111317] divide-y divide-[#232730]">
        {updates.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-[#98A0AD]">
            Nenhuma atualização registrada ainda.
          </div>
        ) : (
          updates.map((u) => {
            const meta = UPDATE_META[u.type] ?? {
              label: u.type,
              tone: "zinc" as const,
            };
            return (
              <div
                key={u.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={meta.label} tone={meta.tone} />
                    {u.serviceId && (
                      <span className="font-mono text-xs text-[#C8FF2E]">
                        #{u.serviceId}
                      </span>
                    )}
                    <span className="font-semibold text-sm text-[#F4F5F6]">
                      {u.serviceName}
                    </span>
                  </div>
                  <p className="text-sm text-[#98A0AD]">{u.details}</p>
                </div>
                <span className="font-mono text-xs text-[#68707E] shrink-0">
                  {formatDateBR(u.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
