import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server-session";

export default async function Home(): Promise<never> {
  const session = await getServerSession();

  if (session?.user.id) {
    redirect("/dashboard");
  }

  redirect("/login");
}
