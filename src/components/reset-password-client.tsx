"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldAlert } from "lucide-react";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível processar a solicitação.");
        return;
      }
      setSuccess(data.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Link inválido ou expirado.");
        return;
      }
      setSuccess(data.message);
      setPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md border border-[#323845] bg-[#111317] p-6 space-y-5">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#C8FF2E]">
          Segurança da Conta
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
          {tokenFromUrl ? "Definir Nova Senha" : "Recuperar Senha"}
        </h1>
        <p className="mt-1 text-xs text-[#98A0AD]">
          {tokenFromUrl
            ? "Escolha uma nova senha segura para acessar sua conta."
            : "Informe o e-mail cadastrado para receber o link de redefinição."}
        </p>
      </div>

      {success && (
        <div className="flex items-start gap-2 border border-[#10B981]/40 bg-[#10B981]/10 px-3.5 py-3 font-mono text-xs text-[#34D399]">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 border border-[#EF4444]/40 bg-[#EF4444]/10 px-3.5 py-3 font-mono text-xs text-[#F87171]">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {tokenFromUrl ? (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Token de Recuperação
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="input-terminal w-full h-10 px-3 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-terminal w-full h-10 px-3 text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-terminal w-full h-10 px-3 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-lime w-full h-11 inline-flex items-center justify-center gap-2 font-mono text-xs uppercase cursor-pointer"
          >
            <KeyRound className="h-4 w-4" />
            {loading ? "Salvando..." : "Redefinir Senha"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] uppercase text-[#98A0AD] mb-1">
              E-mail Cadastrado
            </label>
            <input
              type="email"
              required
              placeholder="voce@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-terminal w-full h-11 px-3 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-lime w-full h-11 inline-flex items-center justify-center gap-2 font-mono text-xs uppercase cursor-pointer"
          >
            <Mail className="h-4 w-4" />
            {loading ? "Enviando..." : "Enviar Link de Recuperação"}
          </button>
        </form>
      )}

      <div className="border-t border-[#232730] pt-4 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-[#98A0AD] hover:text-[#C8FF2E]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para o Login
        </Link>
      </div>
    </div>
  );
}
