# VeloSMM — Plataforma SMM Completa (Padrão FonteSMM)

## Overview
Construção da plataforma web full-stack **VeloSMM** (100% whitelabel/rebrandável no Admin), replicando integralmente a arquitetura, fluxos operacionais e recursos de um painel SMM completo no padrão FonteSMM: Landing Page pública, Catálogo de Serviços, Autenticação segura, Painel do Cliente completo, API de Revenda padrão SMM v2, Integração Multi-Provedor SMM v2 com margem automática, Recarga Pix (Mercado Pago / Efí / Asaas + Sandbox local funcional), Sistema de Afiliados, Suporte via Tickets e Painel Administrativo completo.

## Project Type
**WEB** (Next.js App Router + TypeScript + Tailwind CSS + Prisma + SQLite local pronto para PostgreSQL).

## Success Criteria
- [ ] Landing Page pública com acesso a Login/Cadastro, Catálogo real de serviços (filtros + busca), Como Funciona, FAQ, Termos de Uso e Documentação interativa da API v2.
- [ ] Autenticação real (bcrypt + sessão assinada HMAC em cookie `HttpOnly`/`SameSite=Lax`, controle de papel `USER` / `ADMIN` + API Key por usuário).
- [ ] Painel do Cliente completo: Dashboard/Novo Pedido (categoria → serviço → descrição/tempo médio → link → quantidade + Drip-Feed + cálculo em tempo real), Pedido em Massa (`service_id | link | quantidade`), Serviços (busca, filtro por rede, favoritos), Histórico de Pedidos (filtros de status, botão de Reposição/Refill, Cancelar, Recomprar), Adicionar Saldo (Pix Copia e Cola + QR Code SVG real + Webhook + confirmação instantânea em modo Sandbox), Afiliados (link de indicação, estatísticas, histórico de comissões, saque para saldo), Tickets de Suporte (chat em thread vinculado a ID de pedido), Conta & API (troca de senha, rotação de API Key, perfil).
- [ ] API Pública de Revenda (`POST /api/v2`) compatível com o padrão mundial SMM Panel API v2 (`services`, `add`, `status`, `orders` multi-status, `refill`, `refill_status`, `cancel`, `balance`).
- [ ] Painel Administrativo (`/admin`): KPIs de receita/lucro/pedidos, Gestão de Usuários (ajustar saldo, status, papel), Gestão de Categorias & Serviços (CRUD, margem, status), Provedores SMM API v2 (cadastrar URL + Key, testar saldo, importar/sincronizar serviços com margem percentual automática + provedor simulado embutido), Fila de Pedidos (forçar status, sincronizar com provedor, reembolso automático ao cancelar), Depósitos Pix (aprovar/rejeitar manual + logs de webhook), Tickets (responder/fechar), Configurações da Marca (nome, slogan, taxa de afiliado, gateway Pix, banner de avisos).
- [ ] Validação completa: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`, testes E2E HTTP/API e scripts de verificação (segurança + UX).

## Tech Stack
- **Frontend & Backend:** Next.js 15 (App Router, React 19, TypeScript strict)
- **Estilização:** Tailwind CSS v4 puro (sem shadcn/Radix/MUI), geometria sharp industrial (0–2px), paleta Obsidian + Acid Lime (`#C8FF2E`) + Signal Orange (`#FF6B2C`), zero roxo/violeta/azul genérico, fontes `Space Grotesk` + `Plus Jakarta Sans` + `JetBrains Mono`.
- **Banco de Dados:** Prisma ORM v6 + SQLite local (`prisma/dev.db`, pronto para trocar datasource para `postgresql` em produção).
- **Segurança & Validação:** `bcryptjs`, sessões HMAC-SHA256 com `crypto.timingSafeEqual`, `zod` em todas as rotas de API, transações atômicas (`prisma.$transaction`) para saldo/pedidos/reembolsos/comissões, prevenção de IDOR e race condition de saldo negativo.
- **Testes:** Vitest (unitários de motor de preço, parser de pedido em massa, cliente SMM v2, gerador Pix EMV/CRC16) + smoke test end-to-end contra servidor real.

## File Structure
```text
/Users/andrealmeida/Projects/velosmm/
├── smm-panel-platform.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                        # Landing Page pública
│   │   ├── servicos/page.tsx               # Catálogo público de serviços
│   │   ├── api-docs/page.tsx               # Documentação pública API v2
│   │   ├── faq/page.tsx                    # FAQ público
│   │   ├── termos/page.tsx                 # Termos de Uso e Reembolso
│   │   ├── login/page.tsx                  # Login + Cadastro (tabs)
│   │   ├── painel/
│   │   │   ├── layout.tsx                  # Shell autenticado + sidebar + topbar saldo
│   │   │   ├── page.tsx                    # Novo Pedido + KPIs + Avisos
│   │   │   ├── massa/page.tsx              # Pedido em Massa
│   │   │   ├── servicos/page.tsx           # Tabela completa de serviços + favoritos
│   │   │   ├── pedidos/page.tsx            # Histórico, filtros, Refill, Cancelar
│   │   │   ├── saldo/page.tsx              # Adicionar Saldo via Pix + Histórico
│   │   │   ├── afiliados/page.tsx          # Programa de Afiliados + Comissões
│   │   │   ├── tickets/page.tsx            # Central de Suporte / Tickets
│   │   │   ├── atualizacoes/page.tsx       # Log de atualizações de serviços
│   │   │   └── conta/page.tsx              # Perfil, Senha e Chave de API
│   │   ├── admin/
│   │   │   ├── layout.tsx                  # Shell Admin (ADMIN only)
│   │   │   └── page.tsx                    # Painel Admin multi-módulo completo
│   │   └── api/
│   │       ├── auth/{login,register,logout,me}/route.ts
│   │       ├── services/route.ts           # Lista pública/logada + favoritos
│   │       ├── orders/{route.ts,[id]/refill/route.ts,[id]/cancel/route.ts,mass/route.ts}
│   │       ├── deposits/{route.ts,webhook/route.ts,[id]/confirm/route.ts}
│   │       ├── affiliates/{route.ts,payout/route.ts}
│   │       ├── tickets/{route.ts,[id]/messages/route.ts}
│   │       ├── account/{route.ts,api-key/route.ts}
│   │       ├── v2/route.ts                 # API Pública padrão SMM Panel v2
│   │       └── admin/{overview,users,services,providers,orders,deposits,tickets,settings}/route.ts
│   ├── lib/
│   │   ├── prisma.ts                       # Singleton PrismaClient
│   │   ├── auth.ts                         # Password hash, HMAC cookie session, requireUser/requireAdmin
│   │   ├── smm-provider.ts                 # Cliente HTTP Multi-Provedor SMM API v2 + Modo Simulado
│   │   ├── pix.ts                          # Gerador BR Code Pix EMV real + adaptadores MP/Asaas/Efí/Sandbox
│   │   ├── pricing.ts                      # Cálculo de preço, custo, lucro, margem e parser de pedido em massa
│   │   ├── order-service.ts                # Motor transacional de criação, recarga, reembolso e afiliados
│   │   └── format.ts                       # Formatadores BRL, números, status, datas
│   └── components/
│       ├── brand-logo.tsx
│       ├── public-header.tsx
│       ├── public-footer.tsx
│       ├── panel-shell.tsx
│       ├── status-badge.tsx
│       ├── qr-svg.tsx
│       └── service-catalog-table.tsx
└── tests/
    └── core.test.ts                        # Testes unitários Vitest (pricing, mass-order, Pix EMV, SMM API)
```

## Task Breakdown
- [ ] **T1 — Fundação & Banco de Dados** (`database-architect` / `database-design`): Criar scaffold Next.js 15 + TypeScript + Tailwind v4 + `prisma/schema.prisma` completo (User, Provider, Category, Service, FavoriteService, Order, Deposit, Ticket, TicketMessage, AffiliateEarning, ServiceUpdate, SiteSetting) + `prisma/seed.ts` realista com 40+ serviços multi-rede (Instagram, TikTok, YouTube, Facebook, Kwai, X/Twitter, Telegram, Spotify), conta Admin, conta Cliente demo e provedor simulado. → Verify: `npx prisma db push && npx prisma db seed` executam sem erro.
- [ ] **T2 — Núcleo de Segurança, Negócio e Integrações** (`security-auditor` + `backend-specialist` / `api-patterns`, `clean-code`): Implementar `auth.ts` (HMAC session + bcrypt + API key generator), `pricing.ts` (cálculo decimal seguro + parser de pedido em massa), `pix.ts` (payload BR Code Pix EMV válido com CRC16-CCITT + adaptadores Mercado Pago, Asaas, Efí e Sandbox), `smm-provider.ts` (cliente HTTP SMM API v2 com sincronização de catálogo e margem automática) e `order-service.ts` (débito atômico + envio ao provedor + reembolso + crédito de comissão de afiliado). → Verify: `npm test` passa 100% dos testes unitários.
- [ ] **T3 — Rotas de API Internas, API Pública `/api/v2` e Admin APIs** (`backend-specialist` / `api-patterns`, `nodejs-best-practices`): Implementar todas as rotas REST com validação Zod, checagem de autorização rigorosa, rate limiting básico em memória e compatibilidade total com SMM Panel API v2 (`POST /api/v2`). → Verify: `npx tsc --noEmit` sem erros.
- [ ] **T4 — Design System & Páginas Públicas** (`frontend-specialist` / `frontend-design`, `tailwind-patterns`): Implementar design system sharp industrial (Obsidian + Acid Lime `#C8FF2E` + Signal Orange `#FF6B2C`), Landing Page com calculadora interativa de pedidos + login rápido + métricas + catálogo live, `/servicos`, `/api-docs`, `/faq`, `/termos`, `/login`. → Verify: páginas renderizam com zero roxo e sem templates genéricos.
- [ ] **T5 — Painel do Cliente Completo (`/painel/*`)** (`frontend-specialist` / `nextjs-react-expert`, `frontend-design`): Implementar shell responsivo com saldo ao vivo + 9 módulos: Novo Pedido (com Drip-Feed e prévia de custo), Pedido em Massa, Serviços (favoritos/filtros), Pedidos (Refill/Cancel/Filtros), Adicionar Saldo (Pix QR + Copia e Cola + botão Simular Pagamento em Sandbox), Afiliados, Tickets em thread, Atualizações de Serviços, Conta & API Key. → Verify: todos os fluxos funcionam ponta a ponta com dados reais do SQLite.
- [ ] **T6 — Painel Administrativo Completo (`/admin`)** (`frontend-specialist` + `backend-specialist`): Implementar console admin completo com KPIs financeiros (receita, custo, lucro líquido), gestão de usuários/saldos, CRUD de serviços/categorias, cadastro e sincronização automática de provedores SMM v2 com margem configurável, gestão de pedidos e reembolsos, aprovação de Pix, resposta de tickets e configurações whitelabel da marca. → Verify: admin sincroniza provedor, ajusta margem e aprova Pix com reflexo imediato no painel do cliente.
- [ ] **T7 — Phase X: Verificação Completa** (`test-engineer` + `security-auditor` + `frontend-specialist`): Rodar `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, smoke tests HTTP autenticados (cadastro → login → depósito Pix sandbox → pedido → API v2 → refill → ticket → admin), `security_scan.py` e `ux_audit.py`.

## Phase X: Verification Checklist
- [ ] Unit tests (`npm test`) passing
- [ ] Type check (`npx tsc --noEmit`) clean
- [ ] Lint (`npm run lint`) clean
- [ ] Production build (`npm run build`) clean
- [ ] End-to-end live server smoke test (Auth, Pix, Order, Mass Order, API v2, Affiliate, Ticket, Admin)
- [ ] Security audit (`security_scan.py`) & UX audit (`ux_audit.py`)
- [ ] Zero purple/violet hex codes, zero default template clichés, Socratic Gate respected
