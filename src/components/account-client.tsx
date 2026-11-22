"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  RefreshCw,
  Save,
} from "lucide-react";

interface AccountClientProps {
  user: {
    name: string;
    username: string;
    email: string;
    whatsapp: string | null;
    apiKey: string;
  };
  appUrl: string;
}

export function AccountClient({ user, appUrl }: AccountClientProps) {
  const [name, setName] = useState(user.name);
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [apiKey, setApiKey] = useState(user.apiKey);

  const [saving, setSaving] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg("");
    setErrorMsg("");
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          whatsapp,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao salvar.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setStatusMsg("Dados da conta atualizados com sucesso.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRotateKey() {
    setRotating(true);
    setStatusMsg("");
    setErrorMsg("");
    try {
      const res = await fetch("/api/account/api-key", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.apiKey) {
        setApiKey(data.apiKey);
        setStatusMsg("Nova chave de API gerada! A chave anterior foi revogada.");
      }
    } finally {
      setRotating(false);
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          Segurança & Integração
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          Minha Conta & Chave de API v2
        </h1>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 border border-[#10B981]/40 bg-[#10B981]/10 px-4 py-3 font-mono text-xs text-[#34D399]">
          <CheckCircle2 className="h-4 w-4" />
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 font-mono text-xs text-[#F87171]">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Perfil e Senha */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-6 surface-card p-5 sm:p-6 space-y-4"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold border-b border-[#232730] pb-3">
            Dados Pessoais & Senha
          </h2>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="bg-[#0C0E12] border border-[#232730] p-3">
              <span className="text-[#68707E]">USUÁRIO</span>
              <div className="mt-0.5 text-[#F4F5F6]">@{user.username}</div>
            </div>
            <div className="bg-[#0C0E12] border border-[#232730] p-3">
              <span className="text-[#68707E]">E-MAIL</span>
              <div className="mt-0.5 text-[#F4F5F6] truncate">{user.email}</div>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-terminal w-full h-10 px-3 text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              WhatsApp
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="5511999999999"
              className="input-terminal w-full h-10 px-3 text-sm"
            />
          </div>

          <div className="border-t border-[#232730] pt-4 space-y-3">
            <div className="font-mono text-[11px] uppercase text-[#FF8A58]">
              Alterar Senha (opcional)
            </div>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Senha atual"
              className="input-terminal w-full h-10 px-3 text-sm"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
              className="input-terminal w-full h-10 px-3 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-lime h-11 w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </form>

        {/* Chave de API v2 */}
        <div className="lg:col-span-6 surface-elevated p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#232730] pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#C8FF2E]" />
              <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
                Chave de API (Revenda)
              </h2>
            </div>
            <Link
              href="/api-docs"
              className="font-mono text-xs uppercase text-[#C8FF2E] hover:underline"
            >
              Documentação →
            </Link>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
              Endpoint API v2
            </label>
            <div className="bg-[#0C0E12] border border-[#232730] px-3 py-2.5 font-mono text-xs text-[#F4F5F6]">
              {appUrl}/api/v2
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[#98A0AD] mb-1">
              Sua API Key Privada
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="input-terminal flex-1 h-10 px-3 font-mono text-xs text-[#C8FF2E]"
              />
              <button
                type="button"
                onClick={copyKey}
                className="btn-outline h-10 px-3 inline-flex items-center gap-1.5 font-mono text-xs uppercase cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#34D399]" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiada" : "Copiar"}
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={rotating}
            onClick={handleRotateKey}
            className="btn-outline h-10 w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {rotating ? "Gerando Nova Chave..." : "Gerar Nova Chave de API"}
          </button>

          <p className="text-xs text-[#68707E] leading-relaxed">
            Mantenha esta chave em segredo. Qualquer sistema com esta chave pode
            criar pedidos usando o saldo da sua conta via POST em /api/v2.
          </p>
        </div>
      </div>
    </div>
  );
}
