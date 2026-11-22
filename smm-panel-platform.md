# FollowMe — Plataforma SMM Completa (Padrão FonteSMM + Stripe Cartão & Pix)

## Overview
Plataforma web full-stack **FollowMe** (100% whitelabel/rebrandável no Admin), construída no padrão FonteSMM com **Next.js 15 + TypeScript + Tailwind CSS v4 + Prisma + PostgreSQL (Neon São Paulo)** e deploy em produção no **NexaCloud** (`https://followme.nexaclouds.online`).

## Recursos Implementados
- [x] **Landing Page & Público:** Acesso rápido, calculadora interativa de pedidos, catálogo completo (`/servicos`), documentação completa API v2 (`/api-docs`), programa de parcerias (`/parcerias`), FAQ (`/faq`), Termos (`/termos`), Login/Cadastro (`/login`), Recuperação de Senha (`/esqueci-senha`) e seletor **PT-BR / EN / ES** (`/en`, `/es`) + **BRL / USD / EUR**.
- [x] **Autenticação & Segurança:** `bcryptjs`, cookie `HttpOnly`/`SameSite=Lax` assinado com HMAC-SHA256 (`timingSafeEqual`), papéis `USER`/`ADMIN`, API Key por usuário (`flwm_*`), rate limiting, transações atômicas `prisma.$transaction`, recuperação de senha por token SHA-256 + Resend.
- [x] **Pagamentos Reais via Stripe (Cartão + Pix):**
  - Checkout oficial Stripe para **Pix** (`payment_method_types: ["pix"]`), **Cartão** (`payment_method_types: ["card"]`) e **Híbrido** (`STRIPE_PMC_PIX`).
  - Webhook oficial `POST /api/deposits/stripe/webhook` com validação HMAC-SHA256 (`stripe-signature`), isolamento multi-app (`metadata.app = "followme"`), suporte a eventos assíncronos de Pix (`checkout.session.async_payment_succeeded`) e verificação imediata no retorno (`GET /api/deposits/stripe/verify`).
- [x] **Painel do Cliente Completo (`/painel/*`):**
  - Novo Pedido (Default, Package, Custom Comments, Comment Likes, Poll, Drip-Feed)
  - Pedido em Massa (`/painel/massa`)
  - Assinaturas Automáticas (`/painel/assinaturas`)
  - Catálogo de Serviços com Favoritos (`/painel/servicos`)
  - Histórico de Pedidos com Refill / Cancel / Recompra (`/painel/pedidos`)
  - Adicionar Saldo via Stripe Pix & Cartão (`/painel/saldo`)
  - Programa de Afiliados (`/painel/afiliados`)
  - Painel Filho White-Label (`/painel/painel-filho`)
  - Parcerias / Cooperation (`/painel/parcerias`)
  - Tickets de Suporte (`/painel/tickets`)
  - Atualizações de Serviços (`/painel/atualizacoes`)
  - Conta, Preferências & API Key (`/painel/conta`)
- [x] **API Pública de Revenda (`/api/v2`):** Padrão mundial SMM Panel v2 completo (`services`, `add` para todos os tipos + `Subscriptions`, `status` individual/múltiplo, `refill` individual/múltiplo, `refill_status` individual/múltiplo, `cancel`, `balance`).
- [x] **Painel Administrativo (`/admin`):** KPIs financeiros, pedidos + botão de sincronização automática (`/api/cron/sync-orders`), provedores SMM API v2 com importação + margem automática, CRUD de serviços, usuários/saldo, depósitos Stripe/Pix, tickets, gestão de Assinaturas / Painéis Filhos / Parcerias e configurações Whitelabel + Stripe + Cotações.

## Verification Checklist
- [x] Unit tests (`npm test`) — 9/9 passing
- [x] Type check (`npx tsc --noEmit`) — clean
- [x] Lint (`npm run lint`) — clean
- [x] PostgreSQL schema push & seed (`npx prisma db push && npm run db:seed`)
- [x] Production build (`npm run build`)
- [x] Health check (`/api/health`) & live deployment on NexaCloud
