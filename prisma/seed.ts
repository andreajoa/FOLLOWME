import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function makeKey(prefix: string) {
  return `${prefix}_${crypto.randomBytes(20).toString("hex")}`;
}

async function main() {
  console.log("Seeding VeloSMM database...");

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      brandName: "VeloSMM",
      brandTagline:
        "Painel SMM de alta velocidade para agências, criadores e revendedores com Pix automático 24h.",
      announcement:
        "PIX automático 24/7 liberado em segundos • Serviços Instagram & TikTok Brasileiros com Reposição 30 dias ativos • API v2 compatível com revendedores.",
      supportWhatsapp: "5511999999999",
      supportEmail: "suporte@velosmm.com.br",
      pixGateway: "SANDBOX",
      pixKey: "pix@velosmm.com.br",
      pixMerchantName: "VELOSMM DIGITAL",
      pixMerchantCity: "SAO PAULO",
      minDeposit: 5,
      affiliateRate: 5,
      affiliateMinPayout: 20,
      defaultMarkup: 40,
    },
  });

  const adminPass = await bcrypt.hash("Admin@123", 10);
  const clientPass = await bcrypt.hash("Demo@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@velosmm.com.br" },
    update: {},
    create: {
      name: "Administrador VeloSMM",
      username: "admin",
      email: "admin@velosmm.com.br",
      passwordHash: adminPass,
      role: "ADMIN",
      balance: 2500.0,
      totalSpent: 0,
      apiKey: makeKey("vsmm_adm"),
      referralCode: "ADMINVIP",
      whatsapp: "5511999999999",
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@velosmm.com.br" },
    update: {},
    create: {
      name: "Agência Impulso Demo",
      username: "agenciademo",
      email: "demo@velosmm.com.br",
      passwordHash: clientPass,
      role: "USER",
      balance: 150.0,
      totalSpent: 48.6,
      apiKey: makeKey("vsmm_cli"),
      referralCode: "AGENCIA10",
      affiliateBalance: 14.5,
      affiliateClicks: 87,
      whatsapp: "5511988887777",
    },
  });

  const referredUser = await prisma.user.upsert({
    where: { email: "cliente2@velosmm.com.br" },
    update: {},
    create: {
      name: "Lucas Criador",
      username: "lucascriador",
      email: "cliente2@velosmm.com.br",
      passwordHash: clientPass,
      role: "USER",
      balance: 65.0,
      totalSpent: 22.4,
      apiKey: makeKey("vsmm_cli"),
      referralCode: "LUCASBR",
      referredById: demoUser.id,
    },
  });

  let simProvider = await prisma.provider.findFirst({
    where: { name: "Fornecedor Principal BR (Simulado)" },
  });

  if (!simProvider) {
    simProvider = await prisma.provider.create({
      data: {
        name: "Fornecedor Principal BR (Simulado)",
        apiUrl: "https://provider-simulado.velosmm.local/api/v2",
        apiKey: "sim_provider_internal_key",
        mode: "SIMULATED",
        markupPercent: 45,
        currencyRate: 1,
        cachedBalance: 18420.5,
        cachedCurrency: "BRL",
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });
  }

  const categoriesData = [
    {
      name: "Instagram — Seguidores Brasileiros & Reais",
      slug: "instagram-seguidores-br",
      network: "instagram",
      sortOrder: 1,
    },
    {
      name: "Instagram — Seguidores Mundiais (Alta Retenção)",
      slug: "instagram-seguidores-global",
      network: "instagram",
      sortOrder: 2,
    },
    {
      name: "Instagram — Curtidas, Reels & Visualizações",
      slug: "instagram-engajamento",
      network: "instagram",
      sortOrder: 3,
    },
    {
      name: "Instagram — Comentários Personalizados",
      slug: "instagram-comentarios",
      network: "instagram",
      sortOrder: 4,
    },
    {
      name: "TikTok — Seguidores, Views & Curtidas",
      slug: "tiktok-crescimento",
      network: "tiktok",
      sortOrder: 5,
    },
    {
      name: "YouTube — Inscritos, Views & Horas de Exibição",
      slug: "youtube-crescimento",
      network: "youtube",
      sortOrder: 6,
    },
    {
      name: "Facebook — Curtidas em Página & Seguidores",
      slug: "facebook-crescimento",
      network: "facebook",
      sortOrder: 7,
    },
    {
      name: "Kwai, X (Twitter), Telegram & Spotify",
      slug: "outras-redes",
      network: "other",
      sortOrder: 8,
    },
  ];

  const categoriesBySlug: Record<string, string> = {};
  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, network: cat.network, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoriesBySlug[cat.slug] = record.id;
  }

  const existingServiceCount = await prisma.service.count();
  if (existingServiceCount === 0) {
    const servicesData = [
      // Instagram Seguidores BR
      {
        categorySlug: "instagram-seguidores-br",
        providerServiceId: "1001",
        name: "Seguidores Instagram Brasileiros | Perfis Reais | Reposição 30 Dias",
        description:
          "• Início: 0 a 15 minutos\n• Velocidade: até 5.000/dia\n• Garantia: Botão de Reposição 30 dias\n• Conta precisa estar em modo PÚBLICO durante a entrega.",
        rate: 24.9,
        providerRate: 16.5,
        min: 50,
        max: 50000,
        averageTime: "12 minutos",
        refill: true,
        refillDays: 30,
        cancel: true,
        dripfeed: true,
        isFeatured: true,
      },
      {
        categorySlug: "instagram-seguidores-br",
        providerServiceId: "1002",
        name: "Seguidores Instagram Brasileiros Femininos | Alta Qualidade | 60D",
        description:
          "• Segmentação: 90%+ perfis femininos brasileiros com foto e bio\n• Início: 10 a 30 minutos\n• Reposição garantida por 60 dias.",
        rate: 36.9,
        providerRate: 24.0,
        min: 50,
        max: 25000,
        averageTime: "24 minutos",
        refill: true,
        refillDays: 60,
        cancel: true,
        dripfeed: true,
        isFeatured: true,
      },
      {
        categorySlug: "instagram-seguidores-br",
        providerServiceId: "1003",
        name: "Seguidores Instagram Brasileiros Econômico | Entrega Rápida",
        description:
          "• Início imediato\n• Ideal para volume inicial e prova social rápida\n• Reposição 15 dias.",
        rate: 16.5,
        providerRate: 10.8,
        min: 50,
        max: 100000,
        averageTime: "8 minutos",
        refill: true,
        refillDays: 15,
        cancel: false,
        dripfeed: true,
        isFeatured: false,
      },
      // Instagram Global
      {
        categorySlug: "instagram-seguidores-global",
        providerServiceId: "1010",
        name: "Seguidores Instagram Mundiais | Super Estável | Reposição 365 Dias",
        description:
          "• Queda próxima de 0%\n• Velocidade: 20k/dia\n• Reposição automática por 1 ano\n• Aceita @usuario ou link completo.",
        rate: 9.8,
        providerRate: 6.1,
        min: 100,
        max: 500000,
        averageTime: "6 minutos",
        refill: true,
        refillDays: 365,
        cancel: true,
        dripfeed: true,
        isFeatured: true,
      },
      {
        categorySlug: "instagram-seguidores-global",
        providerServiceId: "1011",
        name: "Seguidores Instagram Mundiais | Ultra Rápido | Sem Reposição",
        description:
          "• Menor preço do mercado para revenda\n• Início em 1-5 minutos\n• Velocidade até 50k/dia.",
        rate: 4.9,
        providerRate: 2.9,
        min: 100,
        max: 1000000,
        averageTime: "4 minutos",
        refill: false,
        refillDays: 0,
        cancel: false,
        dripfeed: false,
        isFeatured: false,
      },
      // Instagram Engajamento
      {
        categorySlug: "instagram-engajamento",
        providerServiceId: "1020",
        name: "Curtidas Instagram Brasileiras Reais | Instantâneo",
        description:
          "• Perfis 100% brasileiros ativos\n• Envie o link do Post ou Reel\n• Suporte a Drip-Feed para parecer orgânico.",
        rate: 6.9,
        providerRate: 4.2,
        min: 20,
        max: 50000,
        averageTime: "3 minutos",
        refill: true,
        refillDays: 30,
        cancel: true,
        dripfeed: true,
        isFeatured: true,
      },
      {
        categorySlug: "instagram-engajamento",
        providerServiceId: "1021",
        name: "Visualizações Instagram Reels + Impressões & Alcance",
        description:
          "• Impulsiona entrega no Explorar\n• Velocidade até 200k/hora\n• Link do Reel público.",
        rate: 1.4,
        providerRate: 0.75,
        min: 100,
        max: 5000000,
        averageTime: "2 minutos",
        refill: false,
        refillDays: 0,
        cancel: false,
        dripfeed: true,
        isFeatured: true,
      },
      {
        categorySlug: "instagram-engajamento",
        providerServiceId: "1022",
        name: "Visualizações em Stories Instagram (Todos os Stories Ativos)",
        description:
          "• Insira apenas o link do perfil\n• Visualiza todos os stories postados nas últimas 24h.",
        rate: 4.2,
        providerRate: 2.4,
        min: 50,
        max: 50000,
        averageTime: "5 minutos",
        refill: false,
        refillDays: 0,
        cancel: false,
        dripfeed: false,
        isFeatured: false,
      },
      {
        categorySlug: "instagram-engajamento",
        providerServiceId: "1023",
        name: "Salvamentos + Compartilhamentos Instagram | Pacote Viral",
        description:
          "• Aumenta o sinal de relevância no algoritmo\n• Ideal para Reels e Carrosséis.",
        rate: 5.5,
        providerRate: 3.1,
        min: 50,
        max: 100000,
        averageTime: "7 minutos",
        refill: false,
        refillDays: 0,
        cancel: true,
        dripfeed: true,
        isFeatured: false,
      },
      // Instagram Comentários
      {
        categorySlug: "instagram-comentarios",
        providerServiceId: "1030",
        name: "Comentários Instagram Brasileiros Personalizados (Você escreve)",
        type: "CUSTOM_COMMENTS",
        description:
          "• Escreva 1 comentário por linha no campo de comentários\n• Perfis brasileiros com foto e nome real\n• Início em até 10 minutos.",
        rate: 89.0,
        providerRate: 54.0,
        min: 5,
        max: 2000,
        averageTime: "14 minutos",
        refill: false,
        refillDays: 0,
        cancel: false,
        dripfeed: false,
        isFeatured: false,
      },
      {
        categorySlug: "instagram-comentarios",
        providerServiceId: "1031",
        name: "Comentários Instagram Brasileiros Aleatórios Positivos",
        description:
          "• Elogios naturais em português BR\n• Ótimo para prova social em anúncios.",
        rate: 49.0,
        providerRate: 29.0,
        min: 10,
        max: 5000,
        averageTime: "11 minutos",
        refill: false,
        refillDays: 0,
        cancel: false,
        dripfeed: true,
        isFeatured: false,
      },
      // TikTok
      {
        categorySlug: "tiktok-crescimento",
        providerServiceId: "2001",
        name: "Seguidores TikTok Reais | Alta Retenção | Reposição 30 Dias",
        description:
          "• Libera Live (1.000 seguidores) com segurança\n• Início em 5 a 20 minutos\n• Reposição garantida 30 dias.",
        rate: 18.9,
        providerRate: 11.9,
        min: 50,
        max: 200000,
        averageTime: "16 minutos",
        refill: true,
        refillDays: 30,
        cancel: true,
        dripfeed: true,
        isFeatured: true,
      },
      {
        categorySlug: "tiktok-crescimento",
        providerServiceId: "2002",
        name: "Visualizações TikTok Ultra Rápidas | FYP Boost",
        description:
          "• Entrega instantânea até 1 milhão/dia\n• Menor custo por milheiro do Brasil.",
        rate: 0.65,
        providerRate: 0.32,
        min: 100,
        max: 10000000,
        averageTime: "1 minuto",
        refill: false,
        refillDays: 0,
        cancel: false,
        dripfeed: true,
        isFeatured: true,
      },
      {
        categorySlug: "tiktok-crescimento",
        providerServiceId: "2003",
        name: "Curtidas TikTok Estáveis | Reposição 30 Dias",
        description:
          "• Perfis mistos com alta retenção\n• Início imediato no link do vídeo.",
        rate: 5.4,
        providerRate: 3.1,
        min: 50,
        max: 500000,
        averageTime: "4 minutos",
        refill: true,
        refillDays: 30,
        cancel: true,
        dripfeed: true,
        isFeatured: false,
      },
      {
        categorySlug: "tiktok-crescimento",
        providerServiceId: "2004",
        name: "Espectadores ao Vivo TikTok Live (30 Minutos)",
        description:
          "• Envie o link da Live ativa\n• Mantém audiência simultânea por 30 minutos.",
        rate: 42.0,
        providerRate: 26.0,
        min: 50,
        max: 10000,
        averageTime: "2 minutos",
        refill: false,
        refillDays: 0,
        cancel: false,
        dripfeed: false,
        isFeatured: false,
      },
      // YouTube
      {
        categorySlug: "youtube-crescimento",
        providerServiceId: "3001",
        name: "Inscritos YouTube Reais | Sem Queda | Reposição 30 Dias",
        description:
          "• Velocidade natural: 100 a 300 inscritos/dia para segurança do canal\n• Garantia de 30 dias.",
        rate: 74.9,
        providerRate: 48.0,
        min: 50,
        max: 50000,
        averageTime: "1 hora",
        refill: true,
        refillDays: 30,
        cancel: true,
        dripfeed: true,
        isFeatured: true,
      },
      {
        categorySlug: "youtube-crescimento",
        providerServiceId: "3002",
        name: "Visualizações YouTube Alta Retenção (3–5 min) | Monetizável",
        description:
          "• Origem: Pesquisa & Vídeos Sugeridos\n• Retenção média de 3 a 5 minutos\n• Reposição vitalícia.",
        rate: 12.9,
        providerRate: 8.2,
        min: 100,
        max: 1000000,
        averageTime: "28 minutos",
        refill: true,
        refillDays: 365,
        cancel: true,
        dripfeed: true,
        isFeatured: false,
      },
      {
        categorySlug: "youtube-crescimento",
        providerServiceId: "3003",
        name: "Horas de Exibição YouTube (Watch Time para Monetização 4000h)",
        description:
          "• Vídeo deve ter no mínimo 60 minutos de duração\n• 1.000 unidades = 1.000 horas reais contabilizadas no Studio.",
        rate: 185.0,
        providerRate: 125.0,
        min: 100,
        max: 4000,
        averageTime: "3 horas",
        refill: true,
        refillDays: 30,
        cancel: true,
        dripfeed: false,
        isFeatured: false,
      },
      {
        categorySlug: "youtube-crescimento",
        providerServiceId: "3004",
        name: "Likes YouTube | Alta Velocidade | Reposição 30D",
        description:
          "• Melhora CTR e prova social do vídeo\n• Início em 5 minutos.",
        rate: 8.5,
        providerRate: 5.0,
        min: 25,
        max: 100000,
        averageTime: "6 minutos",
        refill: true,
        refillDays: 30,
        cancel: true,
        dripfeed: true,
        isFeatured: false,
      },
      // Facebook
      {
        categorySlug: "facebook-crescimento",
        providerServiceId: "4001",
        name: "Seguidores de Página Facebook | Reposição 30 Dias",
        description:
          "• Funciona em Páginas Clássicas e Novo Modelo\n• Início em até 15 minutos.",
        rate: 14.9,
        providerRate: 9.2,
        min: 100,
        max: 200000,
        averageTime: "18 minutos",
        refill: true,
        refillDays: 30,
        cancel: true,
        dripfeed: true,
        isFeatured: false,
      },
      {
        categorySlug: "facebook-crescimento",
        providerServiceId: "4002",
        name: "Curtidas em Publicação Facebook Brasileiras",
        description:
          "• Ideal para posts patrocinados e anúncios Dark Post\n• Entrega rápida.",
        rate: 11.9,
        providerRate: 7.4,
        min: 20,
        max: 50000,
        averageTime: "9 minutos",
        refill: true,
        refillDays: 30,
        cancel: false,
        dripfeed: true,
        isFeatured: false,
      },
      // Outras redes
      {
        categorySlug: "outras-redes",
        providerServiceId: "5001",
        name: "Seguidores Kwai Brasileiros | Reposição 30D",
        description: "• Perfis brasileiros ativos no Kwai\n• Início rápido.",
        rate: 19.9,
        providerRate: 12.5,
        min: 100,
        max: 100000,
        averageTime: "20 minutos",
        refill: true,
        refillDays: 30,
        cancel: true,
        dripfeed: false,
        isFeatured: false,
      },
      {
        categorySlug: "outras-redes",
        providerServiceId: "5002",
        name: "Membros de Canal/Grupo Telegram | Sem Queda | 60D",
        description:
          "• Funciona em canais públicos e grupos\n• Retenção acima de 97%.",
        rate: 11.5,
        providerRate: 6.9,
        min: 100,
        max: 200000,
        averageTime: "7 minutos",
        refill: true,
        refillDays: 60,
        cancel: true,
        dripfeed: false,
        isFeatured: false,
      },
      {
        categorySlug: "outras-redes",
        providerServiceId: "5003",
        name: "Seguidores X (Twitter) Alta Qualidade | Reposição 30D",
        description: "• Perfis com avatar e bio\n• Início em 15 minutos.",
        rate: 29.9,
        providerRate: 19.0,
        min: 50,
        max: 100000,
        averageTime: "25 minutos",
        refill: true,
        refillDays: 30,
        cancel: true,
        dripfeed: true,
        isFeatured: false,
      },
      {
        categorySlug: "outras-redes",
        providerServiceId: "5004",
        name: "Plays Spotify (Faixa / Álbum) | Qualidade Premium",
        description:
          "• Contabiliza normalmente nos relatórios do Spotify for Artists\n• Início em 6–12 horas.",
        rate: 12.4,
        providerRate: 7.6,
        min: 1000,
        max: 1000000,
        averageTime: "4 horas",
        refill: true,
        refillDays: 30,
        cancel: false,
        dripfeed: true,
        isFeatured: false,
      },
    ];

    for (const s of servicesData) {
      await prisma.service.create({
        data: {
          categoryId: categoriesBySlug[s.categorySlug],
          providerId: simProvider.id,
          providerServiceId: s.providerServiceId,
          name: s.name,
          type: s.type ?? "DEFAULT",
          description: s.description,
          rate: s.rate,
          providerRate: s.providerRate,
          min: s.min,
          max: s.max,
          averageTime: s.averageTime,
          refill: s.refill,
          refillDays: s.refillDays,
          cancel: s.cancel,
          dripfeed: s.dripfeed,
          isFeatured: s.isFeatured,
          isActive: true,
        },
      });
    }
  }

  const allServices = await prisma.service.findMany({ take: 6, orderBy: { id: "asc" } });

  const existingOrders = await prisma.order.count();
  if (existingOrders === 0 && allServices.length >= 3) {
    await prisma.order.createMany({
      data: [
        {
          userId: demoUser.id,
          serviceId: allServices[0].id,
          providerId: simProvider.id,
          providerOrderId: "SIM-849201",
          link: "https://instagram.com/agenciaimpulso.br",
          quantity: 1000,
          charge: 24.9,
          cost: 16.5,
          profit: 8.4,
          startCount: 14200,
          remains: 0,
          status: "COMPLETED",
          source: "WEB",
        },
        {
          userId: demoUser.id,
          serviceId: allServices[5]?.id ?? allServices[1].id,
          providerId: simProvider.id,
          providerOrderId: "SIM-849245",
          link: "https://instagram.com/reel/C8xK29aLP/",
          quantity: 2000,
          charge: 13.8,
          cost: 8.4,
          profit: 5.4,
          startCount: 380,
          remains: 420,
          status: "IN_PROGRESS",
          source: "WEB",
        },
        {
          userId: demoUser.id,
          serviceId: allServices[3]?.id ?? allServices[0].id,
          providerId: simProvider.id,
          providerOrderId: "SIM-849309",
          link: "https://instagram.com/marca.parceira",
          quantity: 1000,
          charge: 9.8,
          cost: 6.1,
          profit: 3.7,
          startCount: 2150,
          remains: 1000,
          status: "PENDING",
          source: "API",
        },
      ],
    });
  }

  const existingDeposits = await prisma.deposit.count();
  if (existingDeposits === 0) {
    const dep = await prisma.deposit.create({
      data: {
        userId: demoUser.id,
        amount: 200.0,
        method: "PIX",
        gateway: "SANDBOX",
        txid: "VSMM20261119DEMO0001",
        status: "PAID",
        paidAt: new Date(Date.now() - 86400 * 1000),
        note: "Recarga inicial via Pix Automático",
      },
    });

    await prisma.deposit.create({
      data: {
        userId: referredUser.id,
        amount: 290.0,
        method: "PIX",
        gateway: "SANDBOX",
        txid: "VSMM20261119REF0002",
        status: "PAID",
        paidAt: new Date(Date.now() - 43200 * 1000),
        note: "Recarga Pix",
      },
    });

    await prisma.affiliateEarning.create({
      data: {
        referrerId: demoUser.id,
        referredUserId: referredUser.id,
        depositId: dep.id,
        depositAmount: 290.0,
        commissionRate: 5,
        amount: 14.5,
        status: "AVAILABLE",
      },
    });
  }

  const existingTickets = await prisma.ticket.count();
  if (existingTickets === 0) {
    await prisma.ticket.create({
      data: {
        userId: demoUser.id,
        subject: "Dúvida sobre integração API v2",
        status: "ANSWERED",
        messages: {
          create: [
            {
              senderId: demoUser.id,
              isAdmin: false,
              body: "Olá! A API v2 aceita o parâmetro action=status com múltiplos IDs separados por vírgula?",
            },
            {
              senderId: admin.id,
              isAdmin: true,
              body: "Sim! Envie action=status e orders=1,2,3 via POST em /api/v2 com sua chave de API. Retornamos o mapa JSON no padrão mundial de painéis SMM.",
            },
          ],
        },
      },
    });
  }

  const existingUpdates = await prisma.serviceUpdate.count();
  if (existingUpdates === 0 && allServices.length >= 2) {
    await prisma.serviceUpdate.createMany({
      data: [
        {
          serviceId: allServices[0].id,
          serviceName: allServices[0].name,
          type: "RATE_DOWN",
          details: "Preço reduzido de R$ 28,90 para R$ 24,90 por 1.000 unidades.",
        },
        {
          serviceId: allServices[1].id,
          serviceName: allServices[1].name,
          type: "REFILL_ON",
          details: "Botão de reposição automática 60 dias habilitado no painel e API.",
        },
        {
          serviceId: allServices[3]?.id ?? null,
          serviceName: allServices[3]?.name ?? "Seguidores Mundiais 365D",
          type: "NEW",
          details: "Novo servidor de alta estabilidade liberado com velocidade de 20k/dia.",
        },
      ],
    });
  }

  console.log("Seed completed!");
  console.log("Admin login: admin@velosmm.com.br / Admin@123");
  console.log("Demo client: demo@velosmm.com.br / Demo@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
