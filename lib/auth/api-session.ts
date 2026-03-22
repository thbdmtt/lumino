import "server-only";

import { auth } from "@/lib/auth";

export interface ApiSessionUser {
  email: string;
  id: string;
  name?: string | null;
}

export async function getAuthenticatedApiUser(
  request: Request,
): Promise<ApiSessionUser | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}
