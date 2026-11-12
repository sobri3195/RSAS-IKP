import pg from "pg";
import { readFile } from "node:fs/promises";

export interface Sql {
  query(
    sql: string,
    params?: any[],
  ): Promise<{ rows: Record<string, any>[]; rowCount?: number | null }>;
}
export interface Database extends Sql {
  transaction<T>(fn: (sql: Sql) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
export function postgres(url: string): Database {
  // Remote DB URLs must use sslmode=verify-full and a trusted CA. Never disable TLS validation.
  const parsed = new URL(url);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) &&
    parsed.searchParams.get("sslmode") !== "verify-full"
  )
    throw new Error("Remote DATABASE_URL requires sslmode=verify-full");
  const pool = new pg.Pool({
    connectionString: url,
    max: 5,
    connectionTimeoutMillis: 10000,
  });
  return {
    query: (sql, params) => pool.query(sql, params),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const value = await fn(client);
        await client.query("COMMIT");
        return value;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}
export async function committee<T>(db: Database, fn: (sql: Sql) => Promise<T>) {
  return db.transaction(async (sql) => {
    await sql.query("SELECT set_config('app.role','komite_mutu',true)");
    return fn(sql);
  });
}
export async function migrate(db: Database) {
  await db.transaction(async (sql) => {
    await sql.query("SELECT pg_advisory_xact_lock(814771)");
    await sql.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    if (
      !(
        await sql.query("SELECT version FROM schema_migrations WHERE version=1")
      ).rows.length
    ) {
      await sql.query(
        await readFile(
          new URL("./migrations/001_secure_reporting.sql", import.meta.url),
          "utf8",
        ),
      );
    }
  });
}
