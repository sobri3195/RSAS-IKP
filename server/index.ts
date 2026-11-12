import { createApp } from "./app.js";
import { config } from "./config.js";
import { postgres } from "./db.js";
const db = postgres(process.env.DATABASE_URL || "");
const server = createApp(db, config()).listen(
  Number(process.env.API_PORT || 3001),
  "127.0.0.1",
  () => console.log("RSAS API listening on loopback"),
);
async function shutdown() {
  server.close();
  await db.close();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
