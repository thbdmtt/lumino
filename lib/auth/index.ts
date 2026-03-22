import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { users } from "@/lib/db/schema";

const DEFAULT_LOCAL_AUTH_SECRET = "lumino-local-development-auth-secret-32";
const DEFAULT_LOCAL_AUTH_URL = "http://127.0.0.1:3000";

const authRuntimeSchema = z.object({
  baseURL: z.string().url(),
  secret: z.string().min(32),
});

interface AuthRuntimeConfig {
  baseURL: string;
  secret: string;
}

function getAuthRuntimeConfig(): AuthRuntimeConfig {
  return authRuntimeSchema.parse({
    baseURL: process.env.BETTER_AUTH_URL?.trim() || DEFAULT_LOCAL_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET?.trim() || DEFAULT_LOCAL_AUTH_SECRET,
  });
}

async function syncPasswordHash(
  userId: string,
  password: string | null | undefined,
): Promise<void> {
  if (!password) {
    return;
  }

  await db.update(users).set({ passwordHash: password }).where(eq(users.id, userId));
}

const runtimeConfig = getAuthRuntimeConfig();

export const auth = betterAuth({
  baseURL: runtimeConfig.baseURL,
  secret: runtimeConfig.secret,
  trustedOrigins: [runtimeConfig.baseURL],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
    usePlural: true,
    camelCase: true,
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      apiKey: {
        type: "string",
        required: false,
        input: false,
      },
      passwordHash: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  advanced: {
    database: {
      generateId: (): string => crypto.randomUUID(),
    },
  },
  databaseHooks: {
    account: {
      create: {
        after: async (account: {
          password?: string | null;
          providerId: string;
          userId: string;
        }): Promise<void> => {
          if (account.providerId !== "credential") {
            return;
          }

          await syncPasswordHash(account.userId, account.password);
        },
      },
      update: {
        after: async (account: {
          password?: string | null;
          providerId?: string;
          userId?: string;
        }): Promise<void> => {
          if (account.providerId !== "credential" || !account.userId) {
            return;
          }

          await syncPasswordHash(account.userId, account.password);
        },
      },
    },
  },
  plugins: [nextCookies()],
});
