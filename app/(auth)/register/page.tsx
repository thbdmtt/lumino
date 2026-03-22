import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server-session";
import { RegisterForm } from "./register-form";

export default async function RegisterPage(): Promise<JSX.Element> {
  const session = await getServerSession();

  if (session?.user.email) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}
