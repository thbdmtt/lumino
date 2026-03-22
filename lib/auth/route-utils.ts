import { isAPIError } from "better-auth/api";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

function normalizeWhitespace(value: string): string {
  return value.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function buildDisplayNameFromEmail(email: string): string {
  const localPart = email.split("@")[0];
  const normalizedLocalPart = normalizeWhitespace(localPart);

  return normalizedLocalPart.length > 0 ? normalizedLocalPart : "Lumino User";
}

export function withSetCookieHeaders(
  data: unknown,
  headers: Headers,
  init?: ResponseInit,
): NextResponse {
  const response = NextResponse.json(data, init);

  for (const cookie of headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}

export function createRouteErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (isAPIError(error)) {
    const status = typeof error.status === "number" ? error.status : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    return NextResponse.json(
      { error: "Internal server error.", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}
