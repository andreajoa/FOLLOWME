import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findGeoKeywordPage, getGeoKeywordPagesByLocale } from "@/lib/seo-guides";
import { buildGeoKeywordMetadata, GeoKeywordPage } from "@/components/geo-keyword-page";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getGeoKeywordPagesByLocale("pt").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cfg = findGeoKeywordPage("pt", slug);
  if (!cfg) return {};
  return buildGeoKeywordMetadata(cfg);
}

export default async function PortugueseGeoKeywordRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cfg = findGeoKeywordPage("pt", slug);
  if (!cfg) notFound();
  return <GeoKeywordPage config={cfg} />;
}
