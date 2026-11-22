"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  CreditCard,
  Globe,
  List,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Server,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  CHILD_PANEL_STATUS_META,
  COOPERATION_STATUS_META,
  DEPOSIT_STATUS_META,
  formatBRL,
  formatDateBR,
  formatInt,
  ORDER_STATUS_META,
  SUBSCRIPTION_STATUS_META,
  TICKET_STATUS_META,
} from "@/lib/format";
import { StatusBadge } from "./status-badge";

type AdminTab =
  | "overview"
  | "orders"
  | "providers"
  | "services"
  | "users"
  | "deposits"
  | "tickets"
  | "extras"
  | "settings";

interface OverviewData {
  metrics: {
    usersCount: number;
    servicesCount: number;
    providersCount: number;
    openTicketsCount: number;
    pendingDepositsCount: number;
    ordersCount: number;
    grossRevenue: number;
    providerCost: number;
    netProfit: number;
    totalPixDeposited: number;
  };
  recentOrders: Array<{
    id: number;
    charge: number;
    profit: number;
    status: string;
    quantity: number;
    createdAt: string;
    user: { username: string };
    service: { id: number; name: string };
  }>;
}

interface AdminProvider {
  id: string;
  name: string;
  apiUrl: string;
  apiKeyMasked: string;
  mode: string;
  markupPercent: number;
  currencyRate: number;
  cachedBalance: number;
  cachedCurrency: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  _count: { services: number; orders: number };
}

interface AdminOrder {
  id: number;
  link: string;
  quantity: number;
  charge: number;
  cost: number;
  profit: number;
  remains: number;
  status: string;
  refillStatus: string | null;
  providerOrderId: string | null;
  createdAt: string;
  user: { username: string; email: string };
  service: { id: number; name: string };
  provider: { name: string; mode: string } | null;
}

interface AdminService {
  id: number;
  name: string;
  rate: number;
  providerRate: number;
  min: number;
  max: number;
  refill: boolean;
  isActive: boolean;
  isFeatured: boolean;
  category: { name: string; network: string };
  provider: { name: string } | null;
}

interface AdminCategory {
  id: string;
  name: string;
}

interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  balance: number;
  totalSpent: number;
  affiliateBalance: number;
  createdAt: string;
  _count: { orders: number; deposits: number };
}

interface AdminDeposit {
  id: string;
  amount: number;
  method: string;
  gateway: string;
  txid: string;
  status: string;
  note: string | null;
  createdAt: string;
  user: { username: string; email: string };
}

interface AdminTicket {
  id: number;
  subject: string;
  orderId: number | null;
  status: string;
  user: { name: string; username: string; email: string };
  messages: Array<{
    id: string;
    isAdmin: boolean;
    body: string;
    createdAt: string;
    sender: { username: string };
  }>;
}

interface AdminSettings {
  brandName: string;
  brandTagline: string;
  announcement: string;
  supportWhatsapp: string;
  supportEmail: string;
  pixGateway: string;
  pixKey: string;
  pixMerchantName: string;
  pixMerchantCity: string;
  minDeposit: number;
  affiliateRate: number;
  affiliateMinPayout: number;
  defaultMarkup: number;
  childPanelPrice: number;
  usdRate: number;
  eurRate: number;
  stripeEnabled: boolean;
  stripePixEnabled: boolean;
}

interface AdminExtrasData {
  subscriptions: Array<{
    id: number;
    username: string;
    min: number;
    max: number;
    posts: number | null;
    postsDelivered: number;
    status: string;
    createdAt: string;
    user: { username: string; email: string };
    service: { id: number; name: string };
  }>;
  childPanels: Array<{
    id: number;
    domain: string;
    currency: string;
    adminUsername: string;
    monthlyPrice: number;
    status: string;
    nextBillingAt: string;
    createdAt: string;
    user: { username: string; email: string };
  }>;
  cooperationRequests: Array<{
    id: number;
    name: string;
    email: string;
    whatsapp: string | null;
    type: string;
    monthlyVolume: string | null;
    website: string | null;
    message: string;
    status: string;
    createdAt: string;
  }>;
}

const TABS: Array<{ id: AdminTab; label: string; icon: typeof Activity }> = [
  { id: "overview", label: "Visão Geral", icon: Activity },
  { id: "orders", label: "Pedidos", icon: ShoppingBag },
  { id: "providers", label: "Provedores API", icon: Server },
  { id: "services", label: "Serviços", icon: List },
  { id: "users", label: "Usuários", icon: Users },
  { id: "deposits", label: "Stripe / Pix", icon: CreditCard },
  { id: "tickets", label: "Tickets", icon: MessageSquare },
  { id: "extras", label: "Assinaturas & Filhos", icon: Globe },
  { id: "settings", label: "Marca & Stripe", icon: Settings },
];

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [deposits, setDeposits] = useState<AdminDeposit[]>([]);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [extras, setExtras] = useState<AdminExtrasData | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  // Forms
  const [newProv, setNewProv] = useState({
    name: "",
    apiUrl: "",
    apiKey: "",
    mode: "LIVE",
    markupPercent: 40,
    currencyRate: 1,
  });
  const [newSrv, setNewSrv] = useState({
    categoryId: "",
    name: "",
    description: "• Entrega rápida\n• Perfil deve estar público",
    rate: 19.9,
    providerRate: 11.0,
    min: 50,
    max: 50000,
    averageTime: "10 minutos",
    refill: true,
    cancel: true,
    dripfeed: true,
  });
  const [balanceInputs, setBalanceInputs] = useState<Record<string, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [busyKey, setBusyKey] = useState<string>("");

  const flash = (type: "ok" | "err", text: string) => {
    setNotice({ type, text });
  };

  const loadTab = useCallback(async (target: AdminTab) => {
    if (target === "overview") {
      const res = await fetch("/api/admin/overview");
      if (res.ok) setOverview(await res.json());
    } else if (target === "orders") {
      const res = await fetch("/api/admin/orders");
      if (res.ok) setOrders((await res.json()).orders);
    } else if (target === "providers") {
      const res = await fetch("/api/admin/providers");
      if (res.ok) setProviders((await res.json()).providers);
    } else if (target === "services") {
      const res = await fetch("/api/admin/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data.services);
        setCategories(data.categories);
        if (!newSrv.categoryId && data.categories[0]) {
          setNewSrv((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } else if (target === "users") {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers((await res.json()).users);
    } else if (target === "deposits") {
      const res = await fetch("/api/admin/deposits");
      if (res.ok) setDeposits((await res.json()).deposits);
    } else if (target === "tickets") {
      const res = await fetch("/api/admin/tickets");
      if (res.ok) setTickets((await res.json()).tickets);
    } else if (target === "extras") {
      const res = await fetch("/api/admin/extras");
      if (res.ok) setExtras(await res.json());
    } else if (target === "settings") {
      const res = await fetch("/api/admin/settings");
      if (res.ok) setSettings((await res.json()).settings);
    }
  }, [newSrv.categoryId]);

  useEffect(() => {
    loadTab(tab);
  }, [tab, loadTab]);

  async function handleOrderAction(
    orderId: number,
    action: "status" | "sync_provider" | "refund_cancel" | "complete_refill",
    status?: string
  ) {
    setBusyKey(`ord-${orderId}`);
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action, status }),
    });
    const data = await res.json();
    setBusyKey("");
    if (!res.ok) {
      flash("err", data.error || "Erro ao atualizar pedido.");
      return;
    }
    flash("ok", `Pedido #${orderId} atualizado com sucesso.`);
    loadTab("orders");
  }

  async function handleAddProvider(e: React.FormEvent) {
    e.preventDefault();
    setBusyKey("add-prov");
    const res = await fetch("/api/admin/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProv),
    });
    const data = await res.json();
    setBusyKey("");
    if (!res.ok) {
      flash("err", data.error || "Falha ao salvar provedor.");
      return;
    }
    flash("ok", "Provedor cadastrado! Clique em Sincronizar para importar serviços.");
    setNewProv({
      name: "",
      apiUrl: "",
      apiKey: "",
      mode: "LIVE",
      markupPercent: 40,
      currencyRate: 1,
    });
    loadTab("providers");
  }

  async function handleSyncProvider(providerId: string) {
    setBusyKey(`sync-${providerId}`);
    const res = await fetch("/api/admin/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync", providerId }),
    });
    const data = await res.json();
    setBusyKey("");
    if (!res.ok) {
      flash("err", data.error || "Erro ao sincronizar provedor.");
      return;
    }
    flash(
      "ok",
      `Sincronizado: ${data.imported} novo(s), ${data.updated} atualizado(s). Saldo no fornecedor: ${data.currency} ${data.balance}.`
    );
    loadTab("providers");
  }

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    setBusyKey("add-srv");
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSrv),
    });
    const data = await res.json();
    setBusyKey("");
    if (!res.ok) {
      flash("err", data.error || "Falha ao criar serviço.");
      return;
    }
    flash("ok", `Serviço #${data.service.id} criado e publicado no catálogo.`);
    setNewSrv((prev) => ({ ...prev, name: "" }));
    loadTab("services");
  }

  async function handleToggleService(srv: AdminService, field: "isActive" | "isFeatured") {
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: srv.id, [field]: !srv[field] }),
    });
    if (res.ok) {
      flash("ok", `Serviço #${srv.id} atualizado.`);
      loadTab("services");
    }
  }

  async function handleAdjustBalance(userId: string) {
    const raw = balanceInputs[userId];
    const delta = Number.parseFloat(raw || "0");
    if (!Number.isFinite(delta) || delta === 0) return;

    setBusyKey(`usr-${userId}`);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, balanceDelta: delta }),
    });
    setBusyKey("");
    if (res.ok) {
      setBalanceInputs((prev) => ({ ...prev, [userId]: "" }));
      flash("ok", `Saldo ajustado em ${formatBRL(delta)} com sucesso.`);
      loadTab("users");
    }
  }

  async function handleToggleUserStatus(user: AdminUser) {
    const next = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, status: next }),
    });
    if (res.ok) {
      flash("ok", `Usuário @${user.username} alterado para ${next}.`);
      loadTab("users");
    }
  }

  async function handleToggleUserRole(user: AdminUser) {
    const next = user.role === "ADMIN" ? "USER" : "ADMIN";
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role: next }),
    });
    if (res.ok) {
      flash(
        "ok",
        `Papel de @${user.username} alterado para ${next}${next === "ADMIN" ? " (uso gratuito ilimitado ativado)" : ""}.`
      );
      loadTab("users");
    }
  }

  async function handleDepositAction(depositId: string, action: "approve" | "reject") {
    setBusyKey(`dep-${depositId}`);
    const res = await fetch("/api/admin/deposits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositId, action }),
    });
    setBusyKey("");
    if (res.ok) {
      flash(
        "ok",
        action === "approve"
          ? "Pix aprovado e saldo creditado na conta do usuário."
          : "Depósito marcado como recusado."
      );
      loadTab("deposits");
    }
  }

  async function handleAdminTicketReply(ticketId: number, close = false) {
    const body = replyInputs[ticketId]?.trim();
    if (!body) return;
    setBusyKey(`tkt-${ticketId}`);
    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, close }),
    });
    setBusyKey("");
    if (res.ok) {
      setReplyInputs((prev) => ({ ...prev, [ticketId]: "" }));
      flash("ok", `Resposta enviada no Ticket #${ticketId}.`);
      loadTab("tickets");
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setBusyKey("save-settings");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setBusyKey("");
    if (!res.ok) {
      flash("err", data.error || "Falha ao salvar configurações.");
      return;
    }
    setSettings(data.settings);
    flash("ok", "Configurações da marca e pagamentos Stripe/Pix atualizadas em tempo real!");
  }

  async function handleSyncAllOrders() {
    setBusyKey("sync-all-orders");
    const res = await fetch("/api/cron/sync-orders", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusyKey("");
    if (!res.ok) {
      flash("err", data.error || "Falha ao sincronizar pedidos.");
      return;
    }
    flash(
      "ok",
      `Sincronização concluída: ${data.scanned ?? 0} analisados, ${data.updated ?? 0} atualizados, ${data.refunded ?? 0} estornados.`
    );
    loadTab("orders");
  }

  async function handleUpdateExtra(
    kind: "subscription" | "childPanel" | "cooperation",
    id: number,
    status: string
  ) {
    setBusyKey(`${kind}-${id}`);
    const res = await fetch("/api/admin/extras", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, status }),
    });
    setBusyKey("");
    if (res.ok) {
      flash("ok", `Registro #${id} atualizado para ${status}.`);
      loadTab("extras");
    } else {
      flash("err", "Não foi possível atualizar.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#FF6B2C]">
            Console Administrativo
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
            Gestão Central da Plataforma
          </h1>
        </div>
        <button
          type="button"
          disabled={busyKey === "sync-all-orders"}
          onClick={handleSyncAllOrders}
          className="btn-outline h-10 px-4 inline-flex items-center gap-2 font-mono text-xs uppercase cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {busyKey === "sync-all-orders" ? "Sincronizando..." : "Sincronizar Pedidos"}
        </button>
      </div>

      {/* Navegação por abas */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#232730] pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setNotice(null);
            }}
            className={`h-9 px-3.5 inline-flex items-center gap-2 font-mono text-xs uppercase border cursor-pointer transition-colors ${
              tab === t.id
                ? "bg-[#FF6B2C] text-[#090A0C] border-[#FF6B2C] font-bold"
                : "bg-[#111317] text-[#98A0AD] border-[#232730] hover:text-[#F4F5F6]"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 border px-4 py-3 font-mono text-xs ${
            notice.type === "ok"
              ? "border-[#10B981]/40 bg-[#10B981]/10 text-[#34D399]"
              : "border-[#EF4444]/40 bg-[#EF4444]/10 text-[#F87171]"
          }`}
        >
          {notice.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <ShieldAlert className="h-4 w-4 shrink-0" />
          )}
          {notice.text}
        </div>
      )}

      {/* TAB 1: VISÃO GERAL */}
      {tab === "overview" && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#232730] bg-[#111317]">
            {[
              { label: "Receita Bruta (Pedidos)", val: formatBRL(overview.metrics.grossRevenue), cls: "text-[#F4F5F6]" },
              { label: "Lucro Líquido Estimado", val: formatBRL(overview.metrics.netProfit), cls: "text-[#C8FF2E]" },
              { label: "Pix Recebido Total", val: formatBRL(overview.metrics.totalPixDeposited), cls: "text-[#34D399]" },
              { label: "Custo Fornecedores", val: formatBRL(overview.metrics.providerCost), cls: "text-[#FF8A58]" },
            ].map((k, idx) => (
              <div
                key={k.label}
                className={`p-5 ${
                  idx < 3 ? "border-b lg:border-b-0 border-r border-[#232730]" : ""
                }`}
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#98A0AD]">
                  {k.label}
                </div>
                <div className={`mt-1 font-mono text-2xl font-bold ${k.cls}`}>
                  {k.val}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="surface-card p-4">
              <div className="text-[#68707E]">USUÁRIOS</div>
              <div className="mt-1 text-xl font-bold">{formatInt(overview.metrics.usersCount)}</div>
            </div>
            <div className="surface-card p-4">
              <div className="text-[#68707E]">PEDIDOS</div>
              <div className="mt-1 text-xl font-bold">{formatInt(overview.metrics.ordersCount)}</div>
            </div>
            <div className="surface-card p-4">
              <div className="text-[#68707E]">SERVIÇOS ATIVOS</div>
              <div className="mt-1 text-xl font-bold">{formatInt(overview.metrics.servicesCount)}</div>
            </div>
            <div className="surface-card p-4">
              <div className="text-[#68707E]">TICKETS ABERTOS</div>
              <div className="mt-1 text-xl font-bold text-[#FF8A58]">
                {formatInt(overview.metrics.openTicketsCount)}
              </div>
            </div>
            <div className="surface-card p-4">
              <div className="text-[#68707E]">PIX PENDENTES</div>
              <div className="mt-1 text-xl font-bold text-[#FBBF24]">
                {formatInt(overview.metrics.pendingDepositsCount)}
              </div>
            </div>
          </div>

          <div className="border border-[#232730] bg-[#111317] overflow-x-auto">
            <div className="border-b border-[#232730] bg-[#171A20] px-4 py-3 font-mono text-xs uppercase">
              Últimos Pedidos na Plataforma
            </div>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase text-[#98A0AD]">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Cliente</th>
                  <th className="px-4 py-2.5">Serviço</th>
                  <th className="px-4 py-2.5 text-right">Cobrado</th>
                  <th className="px-4 py-2.5 text-right">Lucro</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232730]">
                {overview.recentOrders.map((o) => {
                  const m = ORDER_STATUS_META[o.status] ?? {
                    label: o.status,
                    tone: "zinc" as const,
                  };
                  return (
                    <tr key={o.id}>
                      <td className="px-4 py-3 font-mono text-xs text-[#C8FF2E]">#{o.id}</td>
                      <td className="px-4 py-3 font-mono text-xs">@{o.user.username}</td>
                      <td className="px-4 py-3 text-xs">{o.service.name}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{formatBRL(o.charge, true)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-[#34D399]">
                        +{formatBRL(o.profit, true)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={m.label} tone={m.tone} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PEDIDOS */}
      {tab === "orders" && (
        <div className="border border-[#232730] bg-[#111317] overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase text-[#98A0AD]">
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Serviço / Link</th>
                <th className="px-3 py-3 text-right">Cobrado / Lucro</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Controles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232730]">
              {orders.map((o) => {
                const m = ORDER_STATUS_META[o.status] ?? {
                  label: o.status,
                  tone: "zinc" as const,
                };
                return (
                  <tr key={o.id} className="hover:bg-[#171A20]">
                    <td className="px-3 py-3 font-mono text-xs text-[#C8FF2E] whitespace-nowrap">
                      #{o.id}
                      {o.providerOrderId && (
                        <div className="text-[10px] text-[#68707E]">
                          Ext: {o.providerOrderId}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">@{o.user.username}</td>
                    <td className="px-3 py-3 max-w-xs">
                      <div className="text-xs font-medium line-clamp-1">{o.service.name}</div>
                      <div className="font-mono text-[11px] text-[#68707E] truncate">
                        {o.link} ({formatInt(o.quantity)})
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs whitespace-nowrap">
                      <div>{formatBRL(o.charge, true)}</div>
                      <div className="text-[#34D399]">+{formatBRL(o.profit, true)}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <StatusBadge label={m.label} tone={m.tone} />
                      {o.refillStatus === "REQUESTED" && (
                        <div className="mt-1 font-mono text-[10px] text-[#FF8A58]">
                          REFIL PENDENTE
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex flex-wrap justify-end gap-1.5 font-mono text-[10px] uppercase">
                        {o.providerOrderId && (
                          <button
                            type="button"
                            disabled={busyKey === `ord-${o.id}`}
                            onClick={() => handleOrderAction(o.id, "sync_provider")}
                            className="border border-[#323845] px-2 py-1 text-[#C8FF2E] hover:border-[#C8FF2E] cursor-pointer"
                          >
                            Sync API
                          </button>
                        )}
                        {o.status !== "COMPLETED" && o.status !== "CANCELED" && (
                          <button
                            type="button"
                            disabled={busyKey === `ord-${o.id}`}
                            onClick={() =>
                              handleOrderAction(o.id, "status", "COMPLETED")
                            }
                            className="border border-[#10B981]/50 px-2 py-1 text-[#34D399] cursor-pointer"
                          >
                            Concluir
                          </button>
                        )}
                        {o.refillStatus === "REQUESTED" && (
                          <button
                            type="button"
                            onClick={() => handleOrderAction(o.id, "complete_refill")}
                            className="border border-[#FF6B2C]/50 px-2 py-1 text-[#FF8A58] cursor-pointer"
                          >
                            Fechar Refil
                          </button>
                        )}
                        {o.status !== "CANCELED" && o.status !== "COMPLETED" && (
                          <button
                            type="button"
                            disabled={busyKey === `ord-${o.id}`}
                            onClick={() => handleOrderAction(o.id, "refund_cancel")}
                            className="border border-[#EF4444]/50 px-2 py-1 text-[#F87171] cursor-pointer"
                          >
                            Estornar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PROVEDORES SMM API v2 */}
      {tab === "providers" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleAddProvider}
            className="lg:col-span-5 surface-card p-5 space-y-3.5"
          >
            <div className="flex items-center gap-2 font-mono text-xs uppercase text-[#C8FF2E] border-b border-[#232730] pb-3">
              <Plus className="h-4 w-4" />
              Conectar Fornecedor SMM (API v2)
            </div>
            <input
              type="text"
              required
              placeholder="Nome (ex: Provedor Brasil Prime)"
              value={newProv.name}
              onChange={(e) => setNewProv({ ...newProv, name: e.target.value })}
              className="input-terminal w-full h-10 px-3 text-sm"
            />
            <div className="space-y-1.5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#C8FF2E]">
                Atalhos Fornecedores Reais (Cadastro &amp; API v2 Grátis)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { name: "FonteSMM (BR)", url: "https://fontesmm.com/api/v2", rate: 1 },
                  { name: "JustAnotherPanel (USD)", url: "https://justanotherpanel.com/api/v2", rate: 5.5 },
                  { name: "Peakerr (USD)", url: "https://peakerr.com/api/v2", rate: 5.5 },
                  { name: "SMMFollows (USD)", url: "https://smmfollows.com/api/v2", rate: 5.5 },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setNewProv((prev) => ({
                        ...prev,
                        name: preset.name,
                        apiUrl: preset.url,
                        mode: "LIVE",
                        currencyRate: preset.rate,
                      }))
                    }
                    className="border border-[#232730] bg-[#0C0E12] hover:border-[#C8FF2E] px-2.5 py-1.5 text-left font-mono text-[10px] text-[#D2D7E0] cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="url"
              required
              placeholder="URL da API (https://fornecedor.com/api/v2)"
              value={newProv.apiUrl}
              onChange={(e) => setNewProv({ ...newProv, apiUrl: e.target.value })}
              className="input-terminal w-full h-10 px-3 font-mono text-xs"
            />
            <input
              type="text"
              required
              placeholder="API Key do fornecedor"
              value={newProv.apiKey}
              onChange={(e) => setNewProv({ ...newProv, apiKey: e.target.value })}
              className="input-terminal w-full h-10 px-3 font-mono text-xs"
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                  Modo
                </label>
                <select
                  value={newProv.mode}
                  onChange={(e) => setNewProv({ ...newProv, mode: e.target.value })}
                  className="input-terminal w-full h-10 px-2 text-xs font-mono"
                >
                  <option value="LIVE">LIVE (HTTP)</option>
                  <option value="SIMULATED">SIMULATED</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                  Margem (%)
                </label>
                <input
                  type="number"
                  value={newProv.markupPercent}
                  onChange={(e) =>
                    setNewProv({ ...newProv, markupPercent: Number(e.target.value) })
                  }
                  className="input-terminal w-full h-10 px-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                  Câmbio (x)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newProv.currencyRate}
                  onChange={(e) =>
                    setNewProv({ ...newProv, currencyRate: Number(e.target.value) })
                  }
                  className="input-terminal w-full h-10 px-2 font-mono text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={busyKey === "add-prov"}
              className="btn-lime h-11 w-full font-mono text-xs uppercase cursor-pointer"
            >
              Salvar Provedor
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {providers.map((p) => (
              <div
                key={p.id}
                className="surface-elevated p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-display)] font-bold text-base">
                      {p.name}
                    </span>
                    <StatusBadge
                      label={p.mode}
                      tone={p.mode === "LIVE" ? "lime" : "orange"}
                    />
                  </div>
                  <div className="font-mono text-xs text-[#98A0AD] break-all">
                    {p.apiUrl} • Key: {p.apiKeyMasked}
                  </div>
                  <div className="font-mono text-xs text-[#34D399]">
                    Saldo: {p.cachedCurrency} {p.cachedBalance.toFixed(2)} • Margem:{" "}
                    +{p.markupPercent}% • Câmbio: {p.currencyRate}x •{" "}
                    {p._count.services} serviços
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyKey === `sync-${p.id}`}
                  onClick={() => handleSyncProvider(p.id)}
                  className="btn-lime h-10 px-4 inline-flex items-center gap-2 font-mono text-xs uppercase cursor-pointer shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {busyKey === `sync-${p.id}` ? "Sincronizando..." : "Sincronizar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SERVIÇOS */}
      {tab === "services" && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateService}
            className="surface-card p-5 grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
          >
            <div className="md:col-span-2">
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Categoria
              </label>
              <select
                value={newSrv.categoryId}
                onChange={(e) => setNewSrv({ ...newSrv, categoryId: e.target.value })}
                className="input-terminal w-full h-10 px-3 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Nome do Serviço
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Seguidores Instagram BR Express"
                value={newSrv.name}
                onChange={(e) => setNewSrv({ ...newSrv, name: e.target.value })}
                className="input-terminal w-full h-10 px-3 text-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Venda / 1k (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={newSrv.rate}
                onChange={(e) => setNewSrv({ ...newSrv, rate: Number(e.target.value) })}
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={busyKey === "add-srv"}
              className="btn-lime h-10 font-mono text-xs uppercase cursor-pointer"
            >
              + Publicar
            </button>
          </form>

          <div className="border border-[#232730] bg-[#111317] overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase text-[#98A0AD]">
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5">Serviço</th>
                  <th className="px-3 py-2.5 text-right">Custo</th>
                  <th className="px-3 py-2.5 text-right">Venda / 1k</th>
                  <th className="px-3 py-2.5 text-right">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232730]">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-[#171A20]">
                    <td className="px-3 py-3 font-mono text-xs text-[#C8FF2E]">#{s.id}</td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-[#F4F5F6]">{s.name}</div>
                      <div className="font-mono text-[10px] text-[#68707E]">
                        {s.category.name}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-[#98A0AD]">
                      {formatBRL(s.providerRate)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs font-bold text-[#C8FF2E]">
                      {formatBRL(s.rate)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap space-x-1.5 font-mono text-[10px] uppercase">
                      <button
                        type="button"
                        onClick={() => handleToggleService(s, "isFeatured")}
                        className={`px-2 py-1 border cursor-pointer ${
                          s.isFeatured
                            ? "border-[#FF6B2C] text-[#FF8A58]"
                            : "border-[#232730] text-[#68707E]"
                        }`}
                      >
                        {s.isFeatured ? "★ Home" : "Destacar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleService(s, "isActive")}
                        className={`px-2 py-1 border cursor-pointer ${
                          s.isActive
                            ? "border-[#10B981]/50 text-[#34D399]"
                            : "border-[#EF4444]/50 text-[#F87171]"
                        }`}
                      >
                        {s.isActive ? "Ativo" : "Pausado"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: USUÁRIOS */}
      {tab === "users" && (
        <div className="border border-[#232730] bg-[#111317] overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase text-[#98A0AD]">
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Papel / Status</th>
                <th className="px-4 py-3 text-right">Saldo Atual</th>
                <th className="px-4 py-3 text-right">Total Gasto</th>
                <th className="px-4 py-3 text-right">Ajustar Saldo (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232730]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#171A20]">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#F4F5F6]">
                      {u.name} <span className="font-mono text-xs text-[#C8FF2E]">@{u.username}</span>
                    </div>
                    <div className="font-mono text-[11px] text-[#68707E]">
                      {u.email} • {u._count.orders} pedidos
                    </div>
                  </td>
                  <td className="px-4 py-3 space-x-1.5">
                    <button
                      type="button"
                      title="Clique para alternar entre ADMIN (grátis ilimitado) e USER"
                      onClick={() => handleToggleUserRole(u)}
                      className="cursor-pointer"
                    >
                      <StatusBadge
                        label={u.role}
                        tone={u.role === "ADMIN" ? "orange" : "zinc"}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(u)}
                      className="cursor-pointer"
                    >
                      <StatusBadge
                        label={u.status}
                        tone={u.status === "ACTIVE" ? "emerald" : "red"}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#C8FF2E]">
                    {formatBRL(u.balance)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[#98A0AD]">
                    {formatBRL(u.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="+50 ou -10"
                        value={balanceInputs[u.id] || ""}
                        onChange={(e) =>
                          setBalanceInputs((prev) => ({
                            ...prev,
                            [u.id]: e.target.value,
                          }))
                        }
                        className="input-terminal w-28 h-8 px-2 font-mono text-xs"
                      />
                      <button
                        type="button"
                        disabled={busyKey === `usr-${u.id}`}
                        onClick={() => handleAdjustBalance(u.id)}
                        className="btn-lime h-8 px-2.5 font-mono text-[10px] uppercase cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: DEPÓSITOS PIX */}
      {tab === "deposits" && (
        <div className="border border-[#232730] bg-[#111317] overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#232730] bg-[#0C0E12] font-mono text-[11px] uppercase text-[#98A0AD]">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">TXID / Gateway</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232730]">
              {deposits.map((d) => {
                const m = DEPOSIT_STATUS_META[d.status] ?? {
                  label: d.status,
                  tone: "zinc" as const,
                };
                return (
                  <tr key={d.id} className="hover:bg-[#171A20]">
                    <td className="px-4 py-3 font-mono text-xs text-[#98A0AD]">
                      {formatDateBR(d.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">@{d.user.username}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <div>{d.txid}</div>
                      <div className="text-[10px] text-[#68707E]">
                        {d.method} • {d.gateway}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#C8FF2E]">
                      {formatBRL(d.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={m.label} tone={m.tone} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {d.status === "PENDING" && (
                        <div className="inline-flex gap-1.5 font-mono text-[10px] uppercase">
                          <button
                            type="button"
                            disabled={busyKey === `dep-${d.id}`}
                            onClick={() => handleDepositAction(d.id, "approve")}
                            className="border border-[#10B981]/50 bg-[#10B981]/15 px-2.5 py-1 text-[#34D399] cursor-pointer"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            disabled={busyKey === `dep-${d.id}`}
                            onClick={() => handleDepositAction(d.id, "reject")}
                            className="border border-[#EF4444]/50 px-2.5 py-1 text-[#F87171] cursor-pointer"
                          >
                            Recusar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 7: TICKETS */}
      {tab === "tickets" && (
        <div className="space-y-4">
          {tickets.map((t) => {
            const m = TICKET_STATUS_META[t.status] ?? {
              label: t.status,
              tone: "zinc" as const,
            };
            return (
              <div key={t.id} className="surface-card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#232730] pb-3">
                  <div>
                    <span className="font-mono text-xs text-[#C8FF2E]">
                      Ticket #{t.id} • @{t.user.username}
                      {t.orderId ? ` • Pedido #${t.orderId}` : ""}
                    </span>
                    <h3 className="font-semibold text-base">{t.subject}</h3>
                  </div>
                  <StatusBadge label={m.label} tone={m.tone} />
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {t.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 border text-xs ${
                        msg.isAdmin
                          ? "border-[#C8FF2E]/40 bg-[#C8FF2E]/5 ml-6"
                          : "border-[#232730] bg-[#0C0E12] mr-6"
                      }`}
                    >
                      <div className="font-mono text-[10px] text-[#98A0AD] mb-1">
                        {msg.isAdmin ? "ADMIN" : `@${msg.sender.username}`} •{" "}
                        {formatDateBR(msg.createdAt)}
                      </div>
                      <p className="text-[#D2D7E0]">{msg.body}</p>
                    </div>
                  ))}
                </div>

                {t.status !== "CLOSED" && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <input
                      type="text"
                      value={replyInputs[t.id] || ""}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [t.id]: e.target.value,
                        }))
                      }
                      placeholder="Responder ao cliente..."
                      className="input-terminal flex-1 h-10 px-3 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busyKey === `tkt-${t.id}`}
                      onClick={() => handleAdminTicketReply(t.id, false)}
                      className="btn-lime h-10 px-4 font-mono text-xs uppercase cursor-pointer"
                    >
                      Responder
                    </button>
                    <button
                      type="button"
                      disabled={busyKey === `tkt-${t.id}`}
                      onClick={() => handleAdminTicketReply(t.id, true)}
                      className="btn-outline h-10 px-4 font-mono text-xs uppercase cursor-pointer"
                    >
                      Responder & Fechar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 7.5: ASSINATURAS, PAINÉIS FILHOS & PARCERIAS */}
      {tab === "extras" && extras && (
        <div className="space-y-6">
          <section className="surface-card overflow-hidden">
            <div className="border-b border-[#232730] bg-[#171A20] px-5 py-3.5 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-bold">
                Painéis Filhos (Child Panels)
              </h2>
              <span className="font-mono text-xs text-[#98A0AD]">
                {extras.childPanels.length} solicitações
              </span>
            </div>
            <div className="divide-y divide-[#232730]">
              {extras.childPanels.length === 0 ? (
                <div className="p-5 text-xs text-[#68707E]">Nenhum Painel Filho contratado ainda.</div>
              ) : (
                extras.childPanels.map((p) => {
                  const meta = CHILD_PANEL_STATUS_META[p.status] ?? { label: p.status, tone: "zinc" as const };
                  return (
                    <div key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-mono text-xs font-bold text-[#F4F5F6]">
                          #{p.id} • {p.domain} ({p.currency}) — @{p.user.username}
                        </div>
                        <div className="text-xs text-[#68707E]">
                          Admin: {p.adminUsername} • {formatBRL(p.monthlyPrice)}/mês • {formatDateBR(p.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge label={meta.label} tone={meta.tone} />
                        <button
                          type="button"
                          onClick={() => handleUpdateExtra("childPanel", p.id, "ACTIVE")}
                          className="btn-lime h-8 px-2.5 font-mono text-[10px] uppercase cursor-pointer"
                        >
                          Ativar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateExtra("childPanel", p.id, "SUSPENDED")}
                          className="btn-outline h-8 px-2.5 font-mono text-[10px] uppercase cursor-pointer"
                        >
                          Suspender
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-[#232730] bg-[#171A20] px-5 py-3.5 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-bold">
                Assinaturas Automáticas
              </h2>
              <span className="font-mono text-xs text-[#98A0AD]">
                {extras.subscriptions.length} registros
              </span>
            </div>
            <div className="divide-y divide-[#232730]">
              {extras.subscriptions.length === 0 ? (
                <div className="p-5 text-xs text-[#68707E]">Nenhuma assinatura registrada ainda.</div>
              ) : (
                extras.subscriptions.map((s) => {
                  const meta = SUBSCRIPTION_STATUS_META[s.status] ?? { label: s.status, tone: "zinc" as const };
                  return (
                    <div key={s.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-mono text-xs font-bold text-[#F4F5F6]">
                          #{s.id} • @{s.username} ({s.min}–{s.max}) — Cliente @{s.user.username}
                        </div>
                        <div className="text-xs text-[#68707E]">
                          {s.service.name} • Posts: {s.postsDelivered}/{s.posts ?? "∞"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge label={meta.label} tone={meta.tone} />
                        <button
                          type="button"
                          onClick={() => handleUpdateExtra("subscription", s.id, s.status === "ACTIVE" ? "PAUSED" : "ACTIVE")}
                          className="btn-outline h-8 px-2.5 font-mono text-[10px] uppercase cursor-pointer"
                        >
                          {s.status === "ACTIVE" ? "Pausar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateExtra("subscription", s.id, "COMPLETED")}
                          className="btn-lime h-8 px-2.5 font-mono text-[10px] uppercase cursor-pointer"
                        >
                          Concluir
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-[#232730] bg-[#171A20] px-5 py-3.5 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-bold">
                Propostas de Parceria (Cooperation)
              </h2>
              <span className="font-mono text-xs text-[#98A0AD]">
                {extras.cooperationRequests.length} propostas
              </span>
            </div>
            <div className="divide-y divide-[#232730]">
              {extras.cooperationRequests.length === 0 ? (
                <div className="p-5 text-xs text-[#68707E]">Nenhuma proposta recebida ainda.</div>
              ) : (
                extras.cooperationRequests.map((c) => {
                  const meta = COOPERATION_STATUS_META[c.status] ?? { label: c.status, tone: "amber" as const };
                  return (
                    <div key={c.id} className="p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-mono text-xs font-bold text-[#F4F5F6]">
                          #{c.id} • {c.name} ({c.email}) — {c.type} {c.monthlyVolume ? `• ${c.monthlyVolume}` : ""}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge label={meta.label} tone={meta.tone} />
                          <button
                            type="button"
                            onClick={() => handleUpdateExtra("cooperation", c.id, "APPROVED")}
                            className="btn-lime h-8 px-2.5 font-mono text-[10px] uppercase cursor-pointer"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateExtra("cooperation", c.id, "REJECTED")}
                            className="btn-outline h-8 px-2.5 font-mono text-[10px] uppercase cursor-pointer"
                          >
                            Recusar
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[#98A0AD]">{c.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB 8: CONFIGURAÇÕES WHITELABEL & STRIPE/PIX */}
      {tab === "settings" && settings && (
        <form
          onSubmit={handleSaveSettings}
          className="surface-card p-6 space-y-5 max-w-3xl"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold border-b border-[#232730] pb-3">
            Identidade da Marca, Stripe (Cartão &amp; Pix) &amp; Regras Comerciais
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Nome da Marca (Whitelabel)
              </label>
              <input
                type="text"
                value={settings.brandName}
                onChange={(e) =>
                  setSettings({ ...settings, brandName: e.target.value })
                }
                className="input-terminal w-full h-10 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Gateway de Pagamento Principal
              </label>
              <select
                value={settings.pixGateway}
                onChange={(e) =>
                  setSettings({ ...settings, pixGateway: e.target.value })
                }
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              >
                <option value="STRIPE">STRIPE (Cartão + Pix Oficial)</option>
                <option value="MERCADOPAGO">MERCADOPAGO (Pix API)</option>
                <option value="ASAAS">ASAAS (Pix v3)</option>
                <option value="EFI">EFI / Gerencianet</option>
                <option value="SANDBOX">SANDBOX (Teste Local)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-[#232730] bg-[#0C0E12] p-4">
            <label className="flex items-center gap-2.5 text-xs font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stripeEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, stripeEnabled: e.target.checked })
                }
                className="h-4 w-4 accent-[#C8FF2E]"
              />
              <span>Stripe Checkout (Cartão) Ativo</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stripePixEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, stripePixEnabled: e.target.checked })
                }
                className="h-4 w-4 accent-[#C8FF2E]"
              />
              <span>Pix via Stripe Checkout Ativo</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Mensalidade Painel Filho (R$)
              </label>
              <input
                type="number"
                step="1"
                value={settings.childPanelPrice}
                onChange={(e) =>
                  setSettings({ ...settings, childPanelPrice: Number(e.target.value) })
                }
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Cotação USD (1 USD = R$)
              </label>
              <input
                type="number"
                step="0.05"
                value={settings.usdRate}
                onChange={(e) =>
                  setSettings({ ...settings, usdRate: Number(e.target.value) })
                }
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Cotação EUR (1 EUR = R$)
              </label>
              <input
                type="number"
                step="0.05"
                value={settings.eurRate}
                onChange={(e) =>
                  setSettings({ ...settings, eurRate: Number(e.target.value) })
                }
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
              Slogan / Tagline da Home
            </label>
            <input
              type="text"
              value={settings.brandTagline}
              onChange={(e) =>
                setSettings({ ...settings, brandTagline: e.target.value })
              }
              className="input-terminal w-full h-10 px-3 text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
              Faixa de Aviso no Topo do Painel
            </label>
            <input
              type="text"
              value={settings.announcement}
              onChange={(e) =>
                setSettings({ ...settings, announcement: e.target.value })
              }
              className="input-terminal w-full h-10 px-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Chave Pix Recebedor
              </label>
              <input
                type="text"
                value={settings.pixKey}
                onChange={(e) => setSettings({ ...settings, pixKey: e.target.value })}
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Nome Recebedor Pix
              </label>
              <input
                type="text"
                value={settings.pixMerchantName}
                onChange={(e) =>
                  setSettings({ ...settings, pixMerchantName: e.target.value })
                }
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Cidade Pix
              </label>
              <input
                type="text"
                value={settings.pixMerchantCity}
                onChange={(e) =>
                  setSettings({ ...settings, pixMerchantCity: e.target.value })
                }
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Depósito Mín. (R$)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.minDeposit}
                onChange={(e) =>
                  setSettings({ ...settings, minDeposit: Number(e.target.value) })
                }
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Afiliados (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.affiliateRate}
                onChange={(e) =>
                  setSettings({ ...settings, affiliateRate: Number(e.target.value) })
                }
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Resgate Mín. (R$)
              </label>
              <input
                type="number"
                value={settings.affiliateMinPayout}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    affiliateMinPayout: Number(e.target.value),
                  })
                }
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
                Margem Padrão (%)
              </label>
              <input
                type="number"
                value={settings.defaultMarkup}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultMarkup: Number(e.target.value),
                  })
                }
                className="input-terminal w-full h-10 px-3 font-mono text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busyKey === "save-settings"}
            className="btn-lime h-11 px-6 inline-flex items-center gap-2 font-mono text-xs uppercase cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {busyKey === "save-settings" ? "Salvando..." : "Salvar Configurações"}
          </button>
        </form>
      )}
    </div>
  );
}
