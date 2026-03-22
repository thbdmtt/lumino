import { auth } from "@/lib/auth";
import {
  buildDisplayNameFromEmail,
  createRouteErrorResponse,
  withSetCookieHeaders,
} from "@/lib/auth/route-utils";
import { z } from "zod";

const registerRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = registerRequestSchema.parse(await request.json());
    const { headers, response } = await auth.api.signUpEmail({
      headers: request.headers,
      returnHeaders: true,
      body: {
        email: body.email,
        password: body.password,
        name: body.name ?? buildDisplayNameFromEmail(body.email),
      },
    });

    return withSetCookieHeaders(response, headers);
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
