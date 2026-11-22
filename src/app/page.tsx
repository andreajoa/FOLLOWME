import { getRequestPreferences } from "@/lib/auth";
import { LandingPageView } from "@/components/landing-page-view";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const prefs = await getRequestPreferences();
  return <LandingPageView locale={prefs.locale} currency={prefs.currency} routePrefix="" />;
}
