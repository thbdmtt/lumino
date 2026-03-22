import { SettingsView } from "./settings-view";
import { requireServerSession } from "@/lib/auth/server-session";
import { getUserById } from "@/lib/db/queries";

export default async function SettingsPage(): Promise<JSX.Element> {
  const session = await requireServerSession();
  const user = await getUserById(session.user.id);

  return (
    <SettingsView
      email={session.user.email}
      hasPersonalApiKey={Boolean(user?.apiKey)}
      serverApiKeyConfigured={Boolean(process.env.ANTHROPIC_API_KEY?.trim())}
    />
  );
}
