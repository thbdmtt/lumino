import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return NextResponse.json(
    {
      hasTursoUrl: Boolean(process.env.TURSO_DATABASE_URL),
      hasTursoToken: Boolean(process.env.TURSO_AUTH_TOKEN),
      urlPrefix: process.env.TURSO_DATABASE_URL?.slice(0, 20) ?? "undefined",
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
