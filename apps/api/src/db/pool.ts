import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool | null {
  if (!env.databaseUrl) {
    return null;
  }

  if (!pool) {
    pool = new Pool({ connectionString: env.databaseUrl });
  }

  return pool;
}

export async function checkDatabaseConnection(): Promise<"connected" | "not_configured" | "error"> {
  const db = getPool();
  if (!db) {
    return "not_configured";
  }

  try {
    await db.query("SELECT 1");
    return "connected";
  } catch {
    return "error";
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
