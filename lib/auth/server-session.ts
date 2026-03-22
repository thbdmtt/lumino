import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export interface AuthenticatedSession {
  user: {
    email: string;
    id: string;
    name?: string | null;
  };
}

function createRequestHeaders(): Headers {
  const requestHeaders = new Headers();

  headers().forEach((value, key) => {
    requestHeaders.set(key, value);
  });

  return requestHeaders;
}

export async function getServerSession(): Promise<AuthenticatedSession | null> {
  try {
    const session = await auth.api.getSession({
      headers: createRequestHeaders(),
    });

    if (!session?.user?.id || !session.user.email) {
      return null;
    }

    return {
      user: {
        email: session.user.email,
        id: session.user.id,
        name: session.user.name,
      },
    };
  } catch {
    return null;
  }
}

export async function requireServerSession(): Promise<AuthenticatedSession> {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
