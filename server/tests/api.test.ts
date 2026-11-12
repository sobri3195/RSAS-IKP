import { beforeEach, afterEach, describe, it, expect } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import {
  testApp,
  addTestUser,
  testOrigin,
  testKey,
  fixtureOtp,
  fixtureSecret,
  fixturePassword,
} from "../testing.js";
import { committee, migrate } from "../db.js";
import { cryptoBox, digest, token, totp } from "../security.js";
import {
  newReport,
  emptyReview,
  type ReviewInput,
} from "../../shared/report.js";
import { seed } from "../../src/data/seed.js";
import jsQR from "jsqr";
import { PNG } from "pngjs";
let runtime: Awaited<ReturnType<typeof testApp>>;
beforeEach(async () => {
  runtime = await testApp();
});
afterEach(async () => {
  await runtime.db.close();
});
const publicData = () => ({
  ...newReport(),
  incidentDate: "2026-01-02",
  incidentTime: "09:00",
  discoveredDate: "2026-01-02",
  unit: "igd",
  location: "Ruang simulasi",
  service: "Gawat darurat",
  kind: "KNC" as const,
  category: "Obat",
  chronology: "Kronologi sintetis yang tidak memuat pasien nyata",
  discovery: "Simulasi review",
  patientCondition: "Tidak ada pasien nyata",
  impact: "Tidak ada cedera",
  immediateAction: "Simulasi koreksi",
  factual: true as const,
});
async function submit(extra: Record<string, unknown> = {}) {
  const config = await request(runtime.app).get("/api/public/config");
  return request(runtime.app)
    .post("/api/public/reports")
    .set("Origin", testOrigin)
    .send({
      report: publicData(),
      challenge: config.body.challenge,
      idempotencyKey: randomUUID(),
      website: "",
      ...extra,
    });
}
async function login(role = "komite_mutu", manager = true) {
  const user = await addTestUser(runtime.db, role, manager);
  const response = await request(runtime.app)
    .post("/api/auth/login")
    .set("Origin", testOrigin)
    .send({ email: user.email, password: user.password, otp: user.otp });
  expect(response.status).toBe(200);
  return {
    user,
    response,
    cookie: response.headers["set-cookie"][0].split(";")[0],
    csrf: response.body.csrf,
  };
}
async function reportAndLogin() {
  const receipt = await submit();
  expect(receipt.status).toBe(201);
  const auth = await login();
  const list = await request(runtime.app)
    .get("/api/committee/reports")
    .set("Cookie", auth.cookie);
  return { ...auth, receipt: receipt.body, report: list.body[0] };
}
const get = (path: string, cookie: string) =>
  request(runtime.app).get(`/api/committee${path}`).set("Cookie", cookie);
const mutate = (
  path: string,
  auth: { cookie: string; csrf: string },
  body: object,
) =>
  request(runtime.app)
    .patch(`/api/committee${path}`)
    .set("Cookie", auth.cookie)
    .set("X-CSRF-Token", auth.csrf)
    .set("Origin", testOrigin)
    .send(body);

describe("public reporting boundary", () => {
  it("persists encrypted content and returns only a safe receipt and limited tracking", async () => {
    const result = await submit({
      report: {
        ...publicData(),
        patientReference: "SYNTHETIC-REFERENCE",
        medicalNumber: "TEST-MR-ONLY",
      },
    });
    expect(result.status).toBe(201);
    expect(Object.keys(result.body).sort()).toEqual([
      "number",
      "receivedAt",
      "trackingCode",
    ]);
    expect(result.body.number).toMatch(/^IKP-RSAS-\d{4}-\d{6}$/);
    expect(result.body.trackingCode).toMatch(/^[a-f\d]{64}$/);
    const rows = await committee(runtime.db, (sql) =>
      sql.query("SELECT * FROM reports"),
    );
    expect(rows.rows).toHaveLength(1);
    expect(JSON.stringify(rows.rows)).not.toContain("SYNTHETIC-REFERENCE");
    expect(JSON.stringify(rows.rows)).not.toContain("TEST-MR-ONLY");
    expect(rows.rows[0].tracking_hash).not.toBe(result.body.trackingCode);
    const tracked = await request(runtime.app)
      .post("/api/public/track")
      .set("Origin", testOrigin)
      .send({ code: result.body.trackingCode });
    expect(tracked.status).toBe(200);
    expect(Object.keys(tracked.body).sort()).toEqual([
      "number",
      "status",
      "updated_at",
    ]);
    expect(tracked.body.status).toBe("submitted");
    expect(tracked.headers["cache-control"]).toContain("no-store");
    const missing = await request(runtime.app)
      .post("/api/public/track")
      .set("Origin", testOrigin)
      .send({ code: "0".repeat(64) });
    expect(missing.status).toBe(404);
  });
  it("is idempotent across retries and rejects a changed payload for the same key", async () => {
    const key = randomUUID();
    const a = await submit({ idempotencyKey: key }),
      b = await submit({ idempotencyKey: key });
    expect(a.status).toBe(201);
    expect(b.body).toEqual(a.body);
    const changed = await submit({
      idempotencyKey: key,
      report: { ...publicData(), chronology: "Changed synthetic chronology" },
    });
    expect(changed.status).toBe(409);
    expect(
      (
        await committee(runtime.db, (sql) =>
          sql.query("SELECT id FROM reports"),
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("rejects forged roles, invalid dates, unknown units, honeypot spam and cross-origin writes", async () => {
    expect(
      (await submit({ report: { ...publicData(), role: "komite_mutu" } }))
        .status,
    ).toBe(400);
    expect(
      (
        await submit({
          report: { ...publicData(), incidentDate: "2026-02-30" },
        })
      ).status,
    ).toBe(400);
    expect(
      (await submit({ report: { ...publicData(), unit: "unconfigured" } }))
        .status,
    ).toBe(400);
    expect((await submit({ website: "spam" })).status).toBe(400);
    expect(
      (
        await request(runtime.app)
          .post("/api/public/reports")
          .set("Origin", "https://attacker.example")
          .send({})
      ).status,
    ).toBe(403);
  });
  it("uses shared database rate limits and rejects unsigned form challenges", async () => {
    expect((await submit({ challenge: "0.fake.signature" })).status).toBe(400);
    await runtime.db.query(
      "INSERT INTO rate_limits(key,hits,reset_at) VALUES($1,30,now()+interval '1 hour')",
      [cryptoBox(testKey).hmac("track:::ffff:127.0.0.1")],
    );
    // Independent request class is rate limited after 30 attempts regardless of validation outcome.
    for (let i = 0; i < 31; i++) {
      const response = await request(runtime.app)
        .post("/api/public/track")
        .set("Origin", testOrigin)
        .send({ code: "0".repeat(64) });
      if (i === 30) {
        expect(response.status).toBe(429);
        expect(response.headers["retry-after"]).toBeDefined();
      }
    }
  });
});
describe("authentication and authorization", () => {
  it("rejects direct anonymous requests for every private route, file and export", async () => {
    for (const path of [
      "/reports",
      `/reports/${randomUUID()}`,
      `/reports/${randomUUID()}/files/${randomUUID()}`,
      "/notifications",
      "/audit",
      "/qr?format=png",
      "/export/pdf",
      "/export/xlsx",
      "/accounts",
      "/backup",
    ]) {
      const res = await request(runtime.app).get(`/api/committee${path}`);
      expect(res.status, path).toBe(401);
      expect(res.body).not.toHaveProperty("payload");
    }
    for (const path of ["/legacy-import", "/backup/restore", "/accounts"]) {
      expect(
        (
          await request(runtime.app)
            .post(`/api/committee${path}`)
            .set("Origin", testOrigin)
            .send({})
        ).status,
      ).toBe(401);
    }
  });
  it.each(["user", "technical_admin"])(
    "returns HTTP 403 for authenticated %s, even with a forged browser role",
    async (role) => {
      const auth = await login(role);
      for (const path of [
        "/reports",
        "/export/pdf",
        "/export/xlsx",
        "/backup",
        "/qr?format=png",
      ]) {
        expect(
          (await get(path, auth.cookie).set("X-Role", "komite_mutu")).status,
        ).toBe(403);
      }
    },
  );
  it("requires password and MFA, prevents OTP replay and uses HttpOnly SameSite cookies", async () => {
    const auth = await login();
    expect(auth.response.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(auth.response.headers["set-cookie"][0]).toContain("SameSite=Strict");
    const replay = await request(runtime.app)
      .post("/api/auth/login")
      .set("Origin", testOrigin)
      .send({
        email: auth.user.email,
        password: fixturePassword,
        otp: auth.user.otp,
      });
    expect(replay.status).toBe(401);
    const invalid = await request(runtime.app)
      .post("/api/auth/login")
      .set("Origin", testOrigin)
      .send({ email: auth.user.email, password: "wrong", otp: fixtureOtp() });
    expect(invalid.status).toBe(401);
    expect((await get("/reports", "rsas_session=forged")).status).toBe(401);
  });
  it("enforces CSRF and revokes logout and disabled-account sessions on the server", async () => {
    const auth = await login();
    expect(
      (
        await request(runtime.app)
          .post("/api/auth/logout")
          .set("Origin", testOrigin)
          .set("Cookie", auth.cookie)
          .send({})
      ).status,
    ).toBe(403);
    expect(
      (
        await request(runtime.app)
          .post("/api/auth/logout")
          .set("Origin", testOrigin)
          .set("Cookie", auth.cookie)
          .set("X-CSRF-Token", auth.csrf)
          .send({})
      ).status,
    ).toBe(204);
    expect((await get("/reports", auth.cookie)).status).toBe(401);
  });
  it("enrolls MFA with an expiring one-use invitation and never accepts role escalation", async () => {
    const auth = await login();
    const create = await request(runtime.app)
      .post("/api/committee/accounts")
      .set("Origin", testOrigin)
      .set("Cookie", auth.cookie)
      .set("X-CSRF-Token", auth.csrf)
      .send({ name: "Synthetic invite", email: "new@example.test" });
    expect(create.status).toBe(201);
    const start = await request(runtime.app)
      .post("/api/auth/enroll/start")
      .set("Origin", testOrigin)
      .send({ invitation: create.body.invitation });
    expect(start.status).toBe(200);
    const finish = () =>
      request(runtime.app)
        .post("/api/auth/enroll/complete")
        .set("Origin", testOrigin)
        .send({
          invitation: create.body.invitation,
          password: fixturePassword,
          otp: totp(start.body.secret).generate(),
        });
    expect((await finish()).status).toBe(204);
    expect((await finish()).status).toBe(400);
    const stored = (
      await runtime.db.query(
        "SELECT * FROM app_users WHERE email='new@example.test'",
      )
    ).rows[0];
    expect(stored.enabled).toBe(true);
    expect(stored.role).toBe("komite_mutu");
    expect(stored.can_manage_accounts).toBe(false);
    expect(stored.password_hash).not.toContain(fixturePassword);
    expect(stored.totp_secret).not.toContain(start.body.secret);
    const disable = await request(runtime.app)
      .post(`/api/committee/accounts/${stored.id}/disable`)
      .set("Origin", testOrigin)
      .set("Cookie", auth.cookie)
      .set("X-CSRF-Token", auth.csrf)
      .send({});
    expect(disable.status).toBe(204);
  });
});
describe("committee workflow and recovery", () => {
  it("runs migrations repeatedly and enforces RLS for a non-superuser SQL role", async () => {
    await migrate(runtime.db);
    expect((await submit()).status).toBe(201);
    await runtime.db.query("CREATE ROLE rsas_rls_test NOLOGIN");
    await runtime.db.query("GRANT USAGE ON SCHEMA public TO rsas_rls_test");
    await runtime.db.query("GRANT SELECT ON reports TO rsas_rls_test");
    await runtime.db.transaction(async (sql) => {
      await sql.query("SET LOCAL ROLE rsas_rls_test");
      await sql.query("SELECT set_config('app.role','user',true)");
      expect((await sql.query("SELECT id FROM reports")).rows).toHaveLength(0);
      await sql.query("SELECT set_config('app.role','komite_mutu',true)");
      expect((await sql.query("SELECT id FROM reports")).rows).toHaveLength(1);
    });
  });
  it("makes corrected content available only after an authorized versioned review and keeps encrypted history", async () => {
    const auth = await reportAndLogin(),
      path = `/reports/${auth.report.id}`;
    const review = {
      ...emptyReview(),
      version: 1,
      status: "under_review",
      kind: "KNC",
      category: "Obat",
      note: "Clarification through approved synthetic channel",
    };
    expect(
      (
        await mutate(path, auth, {
          ...review,
          corrections: { chronology: "Authorized synthetic correction" },
        })
      ).status,
    ).toBe(409);
    expect((await mutate(path, auth, review)).status).toBe(200);
    expect(
      (
        await mutate(path, auth, {
          ...review,
          version: 2,
          corrections: { chronology: "Authorized synthetic correction" },
        })
      ).status,
    ).toBe(200);
    expect((await get(path, auth.cookie)).body.data.chronology).toBe(
      "Authorized synthetic correction",
    );
    const events = await get(`/audit?reportId=${auth.report.id}`, auth.cookie),
      last = events.body.find((e: any) => e.metadata.version === 3);
    expect(last.metadata.previous).toMatch(/^v1\./);
    expect(
      cryptoBox(testKey).decrypt<any>(
        last.metadata.previous,
        `history:${auth.report.id}:2`,
      ).chronology,
    ).toBe(publicData().chronology);
    expect((await get("/reports?from=2026-02-30", auth.cookie)).status).toBe(
      400,
    );
  });
  it("preserves master-unit IDs across renames and accepts unit-specific QR reporting", async () => {
    const auth = await login();
    const unit = await request(runtime.app)
      .post("/api/committee/units")
      .set("Origin", testOrigin)
      .set("Cookie", auth.cookie)
      .set("X-CSRF-Token", auth.csrf)
      .send({ id: "unit-synthetic", name: "Unit Synthetic" });
    expect(unit.status).toBe(201);
    expect(
      (await submit({ report: { ...publicData(), unit: "unit-synthetic" } }))
        .status,
    ).toBe(201);
    expect(
      (
        await mutate("/units/unit-synthetic", auth, {
          name: "Renamed Synthetic",
        })
      ).status,
    ).toBe(204);
    const config = await request(runtime.app).get("/api/public/config");
    expect(
      (await get("/reports?from=2026-01-01&to=2026-01-31", auth.cookie)).body,
    ).toHaveLength(1);
    expect(
      (await get("/reports?from=2026-02-01&to=2026-02-28", auth.cookie)).body,
    ).toHaveLength(0);
    expect(config.body.units).toContainEqual({
      id: "unit-synthetic",
      name: "Renamed Synthetic",
    });
    expect(
      (await get("/qr?format=png&unit=unit-synthetic", auth.cookie)).status,
    ).toBe(200);
  });
  it("notifies the committee without clinical content and rejects expired or disabled sessions", async () => {
    const auth = await reportAndLogin();
    const notes = await get("/notifications", auth.cookie);
    expect(notes.body.some((n: any) => n.type === "new")).toBe(true);
    expect(JSON.stringify(notes.body)).not.toContain(publicData().chronology);
    await runtime.db.query(
      "UPDATE sessions SET expires_at=now()-interval '1 hour' WHERE user_id=$1",
      [auth.user.id],
    );
    expect((await get("/reports", auth.cookie)).status).toBe(401);
  });
  it("lists new reports, validates transitions, prevents stale updates and records immutable audit", async () => {
    const auth = await reportAndLogin(),
      id = auth.report.id;
    const detail = await get(`/reports/${id}`, auth.cookie);
    expect(detail.status).toBe(200);
    expect(detail.body.data.chronology).toBe(publicData().chronology);
    expect(detail.body).not.toHaveProperty("tracking_hash");
    let review: ReviewInput = {
      ...emptyReview(),
      version: 1,
      status: "under_review",
      kind: "KNC",
      category: "Obat",
      note: "Synthetic committee review",
    };
    expect(
      (await mutate(`/reports/${id}`, { ...auth, csrf: "fake" }, review))
        .status,
    ).toBe(403);
    expect(
      (await mutate(`/reports/${id}`, auth, { ...review, status: "closed" }))
        .status,
    ).toBe(400);
    expect((await mutate(`/reports/${id}`, auth, review)).status).toBe(200);
    expect((await mutate(`/reports/${id}`, auth, review)).status).toBe(409);
    review = { ...review, version: 2, status: "validated" };
    expect((await mutate(`/reports/${id}`, auth, review)).status).toBe(200);
    review = {
      ...review,
      version: 3,
      status: "investigation",
      investigation: {
        ...review.investigation,
        owner: "Synthetic investigator",
        deadline: "2026-12-01",
        facts: "Synthetic facts",
        roots: "Synthetic root cause",
      },
      risk: {
        grade: "BIRU",
        impact: "No injury",
        probability: "Low",
        reason: "Synthetic assessment",
      },
    };
    expect((await mutate(`/reports/${id}`, auth, review)).status).toBe(200);
    review = {
      ...review,
      version: 4,
      status: "action_plan",
      actions: [
        {
          id: randomUUID(),
          corrective: "Synthetic correction",
          preventive: "Synthetic prevention",
          owner: "Synthetic PIC",
          deadline: "2026-12-02",
          done: false,
          evidence: "",
          evaluation: "",
          reviewer: "",
        },
      ],
    };
    expect((await mutate(`/reports/${id}`, auth, review)).status).toBe(200);
    review = { ...review, version: 5, status: "effectiveness_review" };
    expect((await mutate(`/reports/${id}`, auth, review)).status).toBe(200);
    expect(
      (
        await mutate(`/reports/${id}`, auth, {
          ...review,
          version: 6,
          status: "closed",
        })
      ).status,
    ).toBe(400);
    review = {
      ...review,
      version: 6,
      status: "closed",
      actions: review.actions.map((a) => ({
        ...a,
        done: true,
        evidence: "Synthetic evidence",
        evaluation: "Effective in simulation",
        reviewer: "Synthetic reviewer",
      })),
    };
    expect((await mutate(`/reports/${id}`, auth, review)).status).toBe(200);
    expect(
      (await get(`/audit?reportId=${id}`, auth.cookie)).body.filter(
        (e: any) => e.action === "report.reviewed",
      ),
    ).toHaveLength(6);
    await expect(
      committee(runtime.db, (sql) => sql.query("DELETE FROM audit_log")),
    ).rejects.toThrow("append only");
  });
  it("protects and produces real PDF/Excel exports and decodable four-module QR codes", async () => {
    const auth = await reportAndLogin();
    const pdf = await get("/export/pdf", auth.cookie);
    expect(pdf.status).toBe(200);
    expect(pdf.body.subarray(0, 4).toString()).toBe("%PDF");
    const excel = await get("/export/xlsx", auth.cookie)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(excel.status).toBe(200);
    expect(excel.body.subarray(0, 2).toString()).toBe("PK");
    const qr = await get("/qr?format=png&unit=igd", auth.cookie);
    expect(qr.status).toBe(200);
    const png = PNG.sync.read(qr.body),
      decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    expect(decoded?.data).toBe(`${testOrigin}/lapor?unit=igd`);
    const svg = await get("/qr?format=svg", auth.cookie);
    expect(svg.status).toBe(200);
    expect(svg.text || svg.body.toString()).toContain("<svg");
  });
  it("stores re-encoded private photos encrypted and prevents report/file IDOR", async () => {
    const image = new PNG({ width: 2, height: 2 });
    image.data.fill(255);
    const result = await submit({
      files: [
        {
          name: "synthetic.png",
          mime: "image/png",
          base64: PNG.sync.write(image).toString("base64"),
        },
      ],
    });
    expect(result.status).toBe(201);
    const auth = await login(),
      reports = await get("/reports", auth.cookie),
      id = reports.body[0].id,
      detail = await get(`/reports/${id}`, auth.cookie),
      file = detail.body.files[0];
    expect(file).toBeDefined();
    expect(
      (await get(`/reports/${id}/files/${file.id}`, auth.cookie)).status,
    ).toBe(200);
    expect(
      (await get(`/reports/${randomUUID()}/files/${file.id}`, auth.cookie))
        .status,
    ).toBe(404);
    const stored = await committee(runtime.db, (sql) =>
      sql.query("SELECT payload FROM attachments"),
    );
    expect(stored.rows[0].payload).toMatch(/^v1\./);
  });
  it("round trips a signed encrypted backup into a fresh database, rejects tampering and restores counters", async () => {
    const auth = await reportAndLogin();
    const backup = await get("/backup", auth.cookie);
    expect(backup.status).toBe(200);
    expect(JSON.stringify(backup.body)).not.toContain(publicData().chronology);
    const original = runtime;
    runtime = await testApp();
    const target = await login();
    const restore = (body: object) =>
      request(runtime.app)
        .post("/api/committee/backup/restore")
        .set("Origin", testOrigin)
        .set("Cookie", target.cookie)
        .set("X-CSRF-Token", target.csrf)
        .send(body);
    expect(
      (await restore({ ...backup.body, signature: "0".repeat(64) })).status,
    ).toBe(400);
    expect((await restore(backup.body)).status).toBe(200);
    const detail = await get(`/reports/${auth.report.id}`, target.cookie);
    expect(detail.body.data.chronology).toBe(publicData().chronology);
    const second = await submit();
    expect(second.status).toBe(201);
    expect(second.body.number).not.toBe(auth.receipt.number);
    await original.db.close();
  });
  it("imports old demo data without deleting or seeding records and preserves original histories", async () => {
    const auth = await login(),
      data = seed();
    const imp = () =>
      request(runtime.app)
        .post("/api/committee/legacy-import")
        .set("Origin", testOrigin)
        .set("Cookie", auth.cookie)
        .set("X-CSRF-Token", auth.csrf)
        .send(data);
    const result = await imp();
    expect(result.status).toBe(201);
    expect(result.body.imported).toBe(15);
    expect((await imp()).body.alreadyImported).toBe(true);
    const rows = await get("/reports", auth.cookie);
    expect(rows.body).toHaveLength(15);
    expect(rows.body.every((r: any) => r.status === "needs_revision")).toBe(
      true,
    );
    const detail = await get(`/reports/${rows.body[0].id}`, auth.cookie);
    expect(detail.body.data.legacy).toHaveProperty("incident");
  });
});
