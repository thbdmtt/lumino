import { z } from "zod";

const DEFAULT_LOCAL_DATABASE_URL = "file:./local.db";
const REMOTE_DATABASE_PROTOCOLS = ["libsql://", "https://", "http://", "wss://", "ws://"] as const;

const databaseUrlSchema = z
  .string()
  .min(1, "TURSO_DATABASE_URL must not be empty.")
  .refine(
    (value: string) =>
      value.startsWith("file:") ||
      REMOTE_DATABASE_PROTOCOLS.some((protocol) => value.startsWith(protocol)),
    {
      message:
        'TURSO_DATABASE_URL must start with "file:", "libsql://", "https://", "http://", "wss://", or "ws://".',
    },
  );

export interface DatabaseConfig {
  authToken?: string;
  url: string;
}

function isLocalDatabaseUrl(url: string): boolean {
  return url.startsWith("file:");
}

export function getDatabaseConfig(): DatabaseConfig {
  const parsedUrl = databaseUrlSchema.parse(
    process.env.TURSO_DATABASE_URL?.trim() || DEFAULT_LOCAL_DATABASE_URL,
  );
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (isLocalDatabaseUrl(parsedUrl)) {
    return { url: parsedUrl };
  }

  if (!authToken) {
    throw new Error(
      "TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL points to a remote Turso/libsql database.",
    );
  }

  return {
    authToken,
    url: parsedUrl,
  };
}
