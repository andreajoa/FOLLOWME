export function formatBRL(value: number, showMicro = false): string {
  const safe = Number.isFinite(value) ? value : 0;
  const digits = showMicro && Math.abs(safe) > 0 && Math.abs(safe) < 0.1 ? 4 : 2;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(safe);
}

export function formatInt(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

export function formatDateBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export const ORDER_STATUS_META: Record<
  string,
  { label: string; tone: "lime" | "emerald" | "amber" | "orange" | "red" | "zinc" }
> = {
  PENDING: { label: "Pendente", tone: "amber" },
  PROCESSING: { label: "Processando", tone: "orange" },
  IN_PROGRESS: { label: "Em Andamento", tone: "lime" },
  COMPLETED: { label: "Concluído", tone: "emerald" },
  PARTIAL: { label: "Parcial", tone: "orange" },
  CANCELED: { label: "Cancelado", tone: "red" },
};

export const DEPOSIT_STATUS_META: Record<
  string,
  { label: string; tone: "emerald" | "amber" | "red" | "zinc" }
> = {
  PENDING: { label: "Aguardando Pix", tone: "amber" },
  PAID: { label: "Confirmado", tone: "emerald" },
  EXPIRED: { label: "Expirado", tone: "zinc" },
  REJECTED: { label: "Recusado", tone: "red" },
};

export const TICKET_STATUS_META: Record<
  string,
  { label: string; tone: "amber" | "emerald" | "zinc" }
> = {
  OPEN: { label: "Aberto", tone: "amber" },
  ANSWERED: { label: "Respondido", tone: "emerald" },
  CLOSED: { label: "Encerrado", tone: "zinc" },
};

export const NETWORK_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  other: "Outras Redes",
};
