// Test-only PostgreSQL engine. Never imported by server/index.ts or api/index.ts.
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import { type Database, type Sql, migrate } from "./db.js";
import { hashPassword, cryptoBox, totp } from "./security.js";
import { createApp } from "./app.js";
export const testOrigin = "http://127.0.0.1:5173";
export const testKey = "a1".repeat(32);
export const fixturePassword = "Synthetic-only-password-2026";
export const fixtureSecret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
export const fixtureOtp = () => totp(fixtureSecret).generate();
export async function testDatabase(): Promise<Database> {
  const engine = new PGlite();
  const sql = (db: PGlite | Transaction): Sql => ({
    async query(statement, params) {
      if (!params && statement.includes("-- Additive migration")) {
        await db.exec(statement);
        return { rows: [] };
      }
      const result = await db.query<Record<string, any>>(statement, params);
      return { rows: result.rows, rowCount: result.affectedRows };
    },
  });
  const db: Database = {
    ...sql(engine),
    transaction: (fn) => engine.transaction((tx) => fn(sql(tx))),
    close: () => engine.close(),
  };
  await migrate(db);
  return db;
}
export async function addTestUser(
  db: Database,
  role = "komite_mutu",
  manager = true,
  email = `${role}@example.test`,
) {
  const id = randomUUID(),
    box = cryptoBox(testKey);
  await db.query(
    "INSERT INTO app_users(id,name,email,role,can_manage_accounts,password_hash,totp_secret,enabled) VALUES($1,$2,$3,$4,$5,$6,$7,true)",
    [
      id,
      `Synthetic ${role}`,
      email,
      role,
      manager,
      await hashPassword(fixturePassword),
      box.encrypt(fixtureSecret, `totp:${id}`),
    ],
  );
  return { id, email, password: fixturePassword, otp: fixtureOtp() };
}
export async function testApp() {
  const db = await testDatabase();
  return {
    db,
    app: createApp(db, {
      origin: testOrigin,
      key: testKey,
      production: false,
      attachments: true,
    }),
  };
}
