import { defineConfig } from "drizzle-kit";
import { getDatabaseConfig } from "./lib/db/config";

const databaseConfig = getDatabaseConfig();

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "turso",
  dbCredentials: databaseConfig,
  strict: true,
  verbose: true,
});
