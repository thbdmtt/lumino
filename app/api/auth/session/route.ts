import { auth } from "@/lib/auth";
import { createRouteErrorResponse } from "@/lib/auth/route-utils";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return NextResponse.json(session);
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
