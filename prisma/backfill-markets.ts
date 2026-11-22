import { PrismaClient } from "@prisma/client";
import { inferMetricType } from "../src/lib/i18n";

const prisma = new PrismaClient();

const CATEGORY_EN: Record<string, string> = {
  "instagram-seguidores-br": "Instagram Followers (Premium & Targeted)",
  "instagram-seguidores-global": "Instagram Followers (Worldwide High-Retention)",
  "instagram-engajamento": "Instagram Likes, Reels & Views",
  "instagram-comentarios": "Instagram Custom & Positive Comments",
  "tiktok-crescimento": "TikTok Followers, Views & Likes",
  "youtube-crescimento": "YouTube Subscribers, Views & Watch Hours",
  "facebook-crescimento": "Facebook Page Followers & Post Likes",
  "outras-redes": "X (Twitter), Telegram, Spotify & More",
};

/**
 * Authentic US consumer retail pricing (USD per 1,000) & natural English copy
 * benchmarked against Buzzoid, Twicsy, SidesMedia, and SocialWick.
 * NEVER a raw BRL exchange-rate conversion.
 */
const SERVICE_MARKET_META: Record<
  string,
  {
    nameEn: string;
    descriptionEn: string;
    rateUsd: number;
    metricType: "followers" | "likes" | "views" | "comments" | "other";
  }
> = {
  "1001": {
    nameEn: "Instagram Followers | Active-Look Profiles | 30-Day Refill",
    descriptionEn:
      "Starts in 5 to 15 minutes.\nNatural speed up to 5,000/day.\n30-day one-click refill guarantee.\nPublic profile only, no password required.",
    rateUsd: 14.99,
    metricType: "followers",
  },
  "1002": {
    nameEn: "Instagram Followers | VIP High-Retention | 60-Day Refill",
    descriptionEn:
      "High-retention profiles with avatars and bios.\nStarts in 10 to 30 minutes.\n60-day refill protection included.",
    rateUsd: 24.99,
    metricType: "followers",
  },
  "1003": {
    nameEn: "Instagram Followers | Fast Starter Tier | 15-Day Refill",
    descriptionEn:
      "Instant start for rapid social proof.\n15-day refill included.\nNo password required.",
    rateUsd: 11.99,
    metricType: "followers",
  },
  "1010": {
    nameEn: "Instagram Followers | Worldwide Ultra-Stable | 365-Day Refill",
    descriptionEn:
      "Near-zero drop rate with 1-year refill protection.\nFast delivery up to 20k/day.\nAccepts public @username or profile link.",
    rateUsd: 12.99,
    metricType: "followers",
  },
  "1011": {
    nameEn: "Instagram Followers | Express Worldwide",
    descriptionEn:
      "Budget-friendly express delivery.\nStarts within 5 minutes.\nIdeal for quick baseline growth.",
    rateUsd: 8.99,
    metricType: "followers",
  },
  "1020": {
    nameEn: "Instagram Likes | Instant High-Quality | 30-Day Refill",
    descriptionEn:
      "Instant likes on any public post or Reel.\nDrip-Feed supported for natural pacing.\nNo password needed.",
    rateUsd: 5.99,
    metricType: "likes",
  },
  "1021": {
    nameEn: "Instagram Reels Views + Reach & Impressions",
    descriptionEn:
      "Boost early video velocity for Explore momentum.\nFast automated delivery on any public Reel.",
    rateUsd: 1.99,
    metricType: "views",
  },
  "1022": {
    nameEn: "Instagram Story Views (All Active Stories)",
    descriptionEn:
      "Paste your public profile URL.\nDelivers views across all active stories posted in the last 24h.",
    rateUsd: 3.99,
    metricType: "views",
  },
  "1023": {
    nameEn: "Instagram Saves & Shares | Algorithm Boost",
    descriptionEn:
      "Strengthens algorithmic signals on Reels and carousels.\nSupports gradual Drip-Feed delivery.",
    rateUsd: 6.99,
    metricType: "other",
  },
  "1030": {
    nameEn: "Instagram Custom Comments (You Write Each Comment)",
    descriptionEn:
      "Write one comment per line.\nDelivered by natural profiles with photos and bios.\nStarts in under 15 minutes.",
    rateUsd: 49.9,
    metricType: "comments",
  },
  "1031": {
    nameEn: "Instagram Random Positive Comments",
    descriptionEn:
      "Natural positive replies to build instant post credibility.\nGreat for ads and product launches.",
    rateUsd: 34.9,
    metricType: "comments",
  },
  "1091": {
    nameEn: "Instagram Auto-Likes Subscription (Automatic New Posts)",
    descriptionEn:
      "Automatically detects every new post on your profile.\nConfigure min/max likes and delay inside Subscriptions.",
    rateUsd: 14.99,
    metricType: "likes",
  },
  "1092": {
    nameEn: "Instagram Comment Likes (Pin Top Comment)",
    descriptionEn:
      "Push your comment to the top of any public post.\nEnter the post URL and comment author @username.",
    rateUsd: 12.99,
    metricType: "likes",
  },
  "1093": {
    nameEn: "Instagram Story Poll Votes",
    descriptionEn:
      "Fast votes on your chosen story poll option (1 or 2).\nProfile must be public.",
    rateUsd: 14.99,
    metricType: "other",
  },
  "1094": {
    nameEn: "Instagram Launch Bundle (1k Followers + 1k Likes + 5k Views)",
    descriptionEn:
      "All-in-one launch package with coordinated delivery.\nFlat package rate, no password needed.",
    rateUsd: 29.99,
    metricType: "other",
  },
  "2001": {
    nameEn: "TikTok Followers | High-Retention | 30-Day Refill",
    descriptionEn:
      "Helps unlock TikTok LIVE (1,000 followers threshold).\nStarts in 5 to 20 minutes.\n30-day refill protection.",
    rateUsd: 16.99,
    metricType: "followers",
  },
  "2002": {
    nameEn: "TikTok Views | Ultra-Fast FYP Velocity",
    descriptionEn:
      "Starts in 1 to 5 minutes.\nPush new TikToks past the 200-view cold-start wall.",
    rateUsd: 1.49,
    metricType: "views",
  },
  "2003": {
    nameEn: "TikTok Likes | Stable High-Retention | 30-Day Refill",
    descriptionEn:
      "Fast likes on any public TikTok video.\nDrip-Feed supported for organic pacing.",
    rateUsd: 6.99,
    metricType: "likes",
  },
  "2004": {
    nameEn: "TikTok LIVE Stream Viewers (30 Minutes)",
    descriptionEn:
      "Paste your active LIVE stream link.\nSustains concurrent live audience for 30 minutes.",
    rateUsd: 24.99,
    metricType: "views",
  },
  "3001": {
    nameEn: "YouTube Subscribers | Steady Non-Drop | 30-Day Refill",
    descriptionEn:
      "Natural daily pace (100 to 300/day) built for channel stability.\n30-day refill guarantee included.",
    rateUsd: 39.9,
    metricType: "followers",
  },
  "3002": {
    nameEn: "YouTube High-Retention Views (3-5 Min) | 365-Day Refill",
    descriptionEn:
      "High-retention views from search and suggested traffic patterns.\n365-day refill protection.",
    rateUsd: 6.99,
    metricType: "views",
  },
  "3003": {
    nameEn: "YouTube Watch Time Hours (Monetization Eligible)",
    descriptionEn:
      "Requires a public video at least 60 minutes long.\nDesigned to support 4,000 watch-hour channel milestones.",
    rateUsd: 89.0,
    metricType: "views",
  },
  "3004": {
    nameEn: "YouTube Video Likes | Fast Delivery | 30-Day Refill",
    descriptionEn:
      "Strengthens video credibility and CTR.\nStarts within 5 to 15 minutes.",
    rateUsd: 7.99,
    metricType: "likes",
  },
  "4001": {
    nameEn: "Facebook Page Followers | 30-Day Refill",
    descriptionEn:
      "Works on Classic and New Page experiences.\nStarts within 15 minutes.",
    rateUsd: 12.99,
    metricType: "followers",
  },
  "4002": {
    nameEn: "Facebook Post Likes | Fast Delivery",
    descriptionEn:
      "Boost social proof on organic posts and ad creatives.\nStarts quickly, no login needed.",
    rateUsd: 8.99,
    metricType: "likes",
  },
  "5001": {
    nameEn: "Kwai Followers | 30-Day Refill",
    descriptionEn: "Fast profile followers with 30-day refill protection.",
    rateUsd: 11.99,
    metricType: "followers",
  },
  "5002": {
    nameEn: "Telegram Channel & Group Members | 60-Day Refill",
    descriptionEn: "Works for public Telegram channels and groups with 60-day refill.",
    rateUsd: 8.99,
    metricType: "followers",
  },
  "5003": {
    nameEn: "X (Twitter) Followers | High-Quality | 30-Day Refill",
    descriptionEn: "Profiles with avatars and bios.\nStarts in 15 minutes.",
    rateUsd: 19.99,
    metricType: "followers",
  },
  "5004": {
    nameEn: "Spotify Track & Album Plays | Premium Quality",
    descriptionEn: "Eligible for Spotify for Artists reporting.\nStarts within 6 to 12 hours.",
    rateUsd: 6.99,
    metricType: "views",
  },
};

async function main() {
  console.log("Backfilling dual-market US/BR pricing and English catalog fields...");

  for (const [slug, nameEn] of Object.entries(CATEGORY_EN)) {
    await prisma.category.updateMany({
      where: { slug },
      data: { nameEn },
    });
  }

  const services = await prisma.service.findMany({
    include: { category: { select: { network: true } } },
  });

  let updated = 0;
  for (const s of services) {
    const meta = s.providerServiceId ? SERVICE_MARKET_META[s.providerServiceId] : undefined;
    const metricType = meta?.metricType || inferMetricType(s.name, s.type);
    await prisma.service.update({
      where: { id: s.id },
      data: {
        metricType,
        ...(meta
          ? {
              nameEn: meta.nameEn,
              descriptionEn: meta.descriptionEn,
              rateUsd: meta.rateUsd,
            }
          : {}),
      },
    });
    updated += 1;
  }

  console.log(`Updated ${updated} services with native US USD pricing & English copy.`);
}

main()
  .catch((err) => {
    console.error("Backfill error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
