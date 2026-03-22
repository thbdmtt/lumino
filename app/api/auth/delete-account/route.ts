import { z } from "zod";
import { auth } from "@/lib/auth";
import { createRouteErrorResponse, withSetCookieHeaders } from "@/lib/auth/route-utils";

const deleteAccountRequestSchema = z.object({
  password: z.string().min(8).max(128),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = deleteAccountRequestSchema.parse(await request.json());
    const { headers, response } = await auth.api.deleteUser({
      headers: request.headers,
      returnHeaders: true,
      body: {
        password: body.password,
      },
    });

    return withSetCookieHeaders(response, headers);
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
