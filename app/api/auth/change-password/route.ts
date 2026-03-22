import { z } from "zod";
import { auth } from "@/lib/auth";
import { createRouteErrorResponse, withSetCookieHeaders } from "@/lib/auth/route-utils";

const changePasswordRequestSchema = z
  .object({
    confirmPassword: z.string().min(8).max(128),
    currentPassword: z.string().min(8).max(128),
    newPassword: z.string().min(8).max(128),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "The new password must differ from the current password.",
    path: ["newPassword"],
  });

export async function POST(request: Request): Promise<Response> {
  try {
    const body = changePasswordRequestSchema.parse(await request.json());
    const { headers, response } = await auth.api.changePassword({
      headers: request.headers,
      returnHeaders: true,
      body: {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
        revokeOtherSessions: true,
      },
    });

    return withSetCookieHeaders(response, headers);
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
