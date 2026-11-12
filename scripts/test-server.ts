// Dedicated synthetic E2E runner, never a deployment entrypoint.
import { testApp, addTestUser } from "../server/testing.js";
const { db, app } = await testApp();
await addTestUser(db);
await addTestUser(db, "user");
await addTestUser(db, "technical_admin");
const server = app.listen(3001, "127.0.0.1", () =>
  console.log("Synthetic test API ready"),
);
process.on("SIGTERM", () => {
  server.close();
  void db.close();
});
