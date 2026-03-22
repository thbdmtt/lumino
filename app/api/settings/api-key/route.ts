import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedApiUser } from "@/lib/auth/api-session";
import { createRouteErrorResponse } from "@/lib/auth/route-utils";
import { updateUser } from "@/lib/db/queries";
import { encryptSecret } from "@/lib/security";

const saveApiKeySchema = z.object({
  apiKey: z.string().trim().min(20).max(256),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = saveApiKeySchema.parse(await request.json());
    await updateUser(user.id, {
      apiKey: encryptSecret(body.apiKey),
    });

    return NextResponse.json(
      {
        hasPersonalApiKey: true,
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await updateUser(user.id, { apiKey: null });

    return NextResponse.json(
      {
        hasPersonalApiKey: false,
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
