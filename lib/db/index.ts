import "server-only";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { getDatabaseConfig } from "./config";
import * as schema from "./schema";

const databaseConfig = getDatabaseConfig();

export const tursoClient = createClient(databaseConfig);
export const db = drizzle(tursoClient, { schema });

export type Database = typeof db;
