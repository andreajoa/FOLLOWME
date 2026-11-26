import type { Metadata } from "next";
import { OwnerDashboardClient } from "@/components/owner-dashboard-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard Executivo · FollowMe",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <OwnerDashboardClient />;
}
