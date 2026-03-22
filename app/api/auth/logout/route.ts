import { auth } from "@/lib/auth";
import { createRouteErrorResponse, withSetCookieHeaders } from "@/lib/auth/route-utils";

export async function POST(request: Request): Promise<Response> {
  try {
    const { headers } = await auth.api.signOut({
      headers: request.headers,
      returnHeaders: true,
    });

    return withSetCookieHeaders({ success: true }, headers);
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
