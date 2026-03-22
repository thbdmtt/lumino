import { auth } from "@/lib/auth";
import { createRouteErrorResponse, withSetCookieHeaders } from "@/lib/auth/route-utils";
import { z } from "zod";

const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = loginRequestSchema.parse(await request.json());
    const { headers, response } = await auth.api.signInEmail({
      headers: request.headers,
      returnHeaders: true,
      body,
    });

    return withSetCookieHeaders(response, headers);
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
