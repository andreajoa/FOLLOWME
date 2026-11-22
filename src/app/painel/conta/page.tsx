import { getCurrentUser } from "@/lib/auth";
import { AccountClient } from "@/components/account-client";

export const dynamic = "force-dynamic";

export default async function PanelAccountPage() {
  const user = (await getCurrentUser())!;
  return (
    <AccountClient
      user={{
        name: user.name,
        username: user.username,
        email: user.email,
        whatsapp: user.whatsapp,
        apiKey: user.apiKey,
      }}
      appUrl={process.env.APP_URL || "http://localhost:3000"}
    />
  );
}
