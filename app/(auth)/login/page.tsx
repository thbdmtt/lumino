import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server-session";
import { LoginForm } from "./login-form";

export default async function LoginPage(): Promise<JSX.Element> {
  const session = await getServerSession();

  if (session?.user.email) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
