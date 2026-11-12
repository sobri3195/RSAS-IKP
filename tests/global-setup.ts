import { request } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { fixturePassword, fixtureOtp, testOrigin } from "../server/testing";
export default async function setup() {
  await mkdir(".local-data", { recursive: true });
  for (const role of ["komite_mutu", "user", "technical_admin"]) {
    const context = await request.newContext({
      baseURL: testOrigin,
      extraHTTPHeaders: { Origin: testOrigin },
    });
    const response = await context.post("/api/auth/login", {
      data: {
        email: `${role}@example.test`,
        password: fixturePassword,
        otp: fixtureOtp(),
      },
    });
    if (!response.ok())
      throw new Error(`Synthetic ${role} login failed: ${response.status()}`);
    await writeFile(
      `.local-data/${role}-session.json`,
      JSON.stringify(await context.storageState()),
      { mode: 0o600 },
    );
    await context.dispose();
  }
}
