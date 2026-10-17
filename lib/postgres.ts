import { Pool, type QueryResultRow } from "pg";
import { attachDatabasePool } from "@vercel/functions";

const globalForFarmose = globalThis as typeof globalThis & { farmosePool?: Pool };

function getPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  if (!globalForFarmose.farmosePool) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 10_000 });
    attachDatabasePool(pool);
    globalForFarmose.farmosePool = pool;
  }
  return globalForFarmose.farmosePool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(statement: string, values: unknown[] = []): Promise<T[]> {
  const result = await getPool().query<T>(statement, values);
  return result.rows;
}
