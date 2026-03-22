import { requireServerSession } from "@/lib/auth/server-session";
import { AppShell } from "./app-shell";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<JSX.Element> {
  const session = await requireServerSession();
  const fallbackName = session.user.email.split("@")[0] ?? "Lumino User";

  return (
    <AppShell
      userEmail={session.user.email}
      userName={session.user.name?.trim() || fallbackName}
    >
      {children}
    </AppShell>
  );
}
