import { test, expect, request } from "@playwright/test";
import { publicWizard } from "./helpers";
import { fixturePassword, testOrigin } from "../server/testing";
import { totp } from "../server/security";

test("root and QR unit links open the public form with no private navigation or storage", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/lapor$/);
  await expect(
    page.getByRole("heading", { name: /Laporkan untuk/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /dashboard|komite|analitik|login/i }),
  ).toHaveCount(0);
  await expect(page.locator(".committee-sidebar")).toHaveCount(0);
  await page.goto("/lapor?unit=igd");
  await expect(page.getByLabel("Unit pelapor")).toHaveValue("igd");
  await page.getByLabel("Unit pelapor").selectOption("farmasi");
  await expect(page.getByLabel("Unit pelapor")).toHaveValue("farmasi");
  await page.goto("/lapor?unit=unknown");
  await page.reload();
  await expect(page.getByLabel("Unit pelapor")).toHaveValue("");
  await expect
    .poll(() => page.evaluate(() => Object.keys(localStorage).length))
    .toBe(0);
});

test("public reporting validates fields, submits anonymously, tracks safely and issues a patient-free receipt", async ({
  page,
}) => {
  await page.goto("/lapor");
  await page.getByRole("button", { name: "Berikutnya" }).click();
  await expect(page.getByText("Kolom ini wajib diisi.").first()).toBeVisible();
  await publicWizard(page);
  await page
    .getByLabel("Referensi pasien minimal")
    .fill("SYNTHETIC-ONLY-REFERENCE");
  await page.getByLabel("Nomor rekam medis").fill("TEST-NOT-A-PATIENT");
  await page.getByRole("button", { name: "Berikutnya" }).click();
  await expect(
    page.getByText("SYNTHETIC-ONLY-REFERENCE", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Laporan dibuat berdasarkan fakta").check();
  await page.getByRole("button", { name: "KIRIM LAPORAN IKP" }).click();
  await expect(
    page.getByRole("heading", { name: "Terima kasih telah melaporkan." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/lapor/);
  await expect(
    page.getByText("SYNTHETIC-ONLY-REFERENCE", { exact: true }),
  ).toHaveCount(0);
  const code = await page.locator(".tracking-code").innerText();
  expect(code).toMatch(/^[a-f\d]{64}$/);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Simpan bukti penerimaan" }).click();
  const receipt = await download;
  const stream = await receipt.createReadStream();
  const chunks: Buffer[] = [];
  for await (const part of stream!) chunks.push(part);
  const text = Buffer.concat(chunks).toString();
  expect(text).toContain("IKP-RSAS-");
  expect(text).not.toContain("TEST-NOT-A-PATIENT");
  expect(
    await page.evaluate(() => [localStorage.length, sessionStorage.length]),
  ).toEqual([0, 0]);
  await page
    .getByRole("link", { name: "Cek status laporan", exact: true })
    .click();
  await page.getByLabel("Kode pelacakan rahasia").fill(code);
  await page.getByRole("button", { name: "Cek status", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Laporan baru");
  await expect(
    page.getByText("SYNTHETIC-ONLY-REFERENCE", { exact: true }),
  ).toHaveCount(0);
});

test("mobile form fits the viewport and refresh clears sensitive drafts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await publicWizard(page);
  await page.getByLabel("Referensi pasien minimal").fill("SYNTHETIC-DRAFT");
  await expect(page.getByRole("status")).toContainText(
    "Draft sementara diperbarui",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain("SYNTHETIC-DRAFT");
  await page.screenshot({
    path: "test-results/public-report-mobile.png",
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Informasi kejadian", exact: true }),
  ).toBeVisible();
});

test("a failed network submission preserves the in-memory form and can be retried", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await publicWizard(page);
  await page.getByRole("button", { name: "Berikutnya" }).click();
  await page.getByLabel("Laporan dibuat berdasarkan fakta").check();
  await page.route("**/api/public/reports", (route) => route.abort("failed"));
  await page.getByRole("button", { name: "KIRIM LAPORAN IKP" }).click();
  await expect(page.getByRole("alert")).toContainText("Koneksi terputus");
  await expect(
    page.getByText("Kronologi sintetis tanpa pasien nyata", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "KIRIM LAPORAN IKP" }),
  ).toBeEnabled();
  await page.unroute("**/api/public/reports");
  await page.getByRole("button", { name: "KIRIM LAPORAN IKP" }).click();
  await expect(
    page.getByRole("heading", { name: "Terima kasih telah melaporkan." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("direct private URLs and old routes require login without returning report data", async ({
  page,
  request,
}) => {
  for (const path of [
    "/komite/dashboard",
    "/laporan",
    "/analisis",
    "/pengaturan",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/komite\/login$/);
    await expect(page.locator(".committee-sidebar")).toHaveCount(0);
  }
  for (const path of [
    "/api/committee/reports",
    "/api/committee/export/pdf",
    "/api/committee/export/xlsx",
    "/api/committee/backup",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(401);
  }
});

test.describe("authenticated ordinary user", () => {
  test.use({ storageState: ".local-data/user-session.json" });
  test("receives HTTP 403 and cannot reach the dashboard after refresh", async ({
    page,
    request,
  }) => {
    await page.goto("/komite/dashboard");
    await expect(
      page.getByRole("heading", { name: "403 · Akses ditolak" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "403 · Akses ditolak" }),
    ).toBeVisible();
    expect((await request.get("/api/committee/reports")).status()).toBe(403);
    expect((await request.get("/api/committee/export/xlsx")).status()).toBe(
      403,
    );
  });
});

test("committee invitation, real password plus MFA login, review, audit, logout and cookie replay", async ({
  page,
}) => {
  const manager = await request.newContext({
    baseURL: testOrigin,
    storageState: ".local-data/komite_mutu-session.json",
    extraHTTPHeaders: { Origin: testOrigin },
  });
  const session = await (await manager.get("/api/auth/session")).json();
  const email = `synthetic-${Date.now()}@example.test`;
  const inviteResponse = await manager.post("/api/committee/accounts", {
    headers: { "X-CSRF-Token": session.csrf },
    data: { name: "Synthetic browser reviewer", email },
  });
  expect(inviteResponse.status()).toBe(201);
  const invitation = (await inviteResponse.json()).invitation;
  const setup = await (
    await manager.post("/api/auth/enroll/start", { data: { invitation } })
  ).json();
  expect(
    (
      await manager.post("/api/auth/enroll/complete", {
        data: {
          invitation,
          password: fixturePassword,
          otp: totp(setup.secret).generate(),
        },
      })
    ).status(),
  ).toBe(204);
  await page.goto("/komite/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(fixturePassword);
  await page
    .getByLabel("Kode autentikator MFA")
    .fill(totp(setup.secret).generate({ timestamp: Date.now() + 30000 }));
  await page.getByRole("button", { name: "Masuk ke Komite Mutu" }).click();
  await expect(
    page.getByRole("heading", { name: "Dashboard Keselamatan Pasien" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".committee-main tbody tr")
      .filter({ has: page.getByRole("link", { name: /IKP-RSAS-/ }) })
      .first(),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /IKP-RSAS-/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Informasi laporan", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("under_review");
  await page
    .getByLabel("Catatan validasi")
    .fill("Peninjauan browser dengan data sintetis");
  await page
    .getByRole("button", { name: "Simpan validasi & tindak lanjut" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Perubahan tersimpan di server",
  );
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true }),
  ).toHaveValue("under_review");
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("validated");
  await page
    .getByLabel("Catatan validasi")
    .fill("Validasi browser dengan data sintetis");
  await page
    .getByRole("button", { name: "Simpan validasi & tindak lanjut" })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true }),
  ).toHaveValue("validated");
  await page.getByRole("link", { name: "Lihat audit laporan" }).click();
  await expect(
    page.getByText("report.reviewed", { exact: true }).first(),
  ).toBeVisible();
  const cookies = await page.context().cookies();
  const old = cookies.find((c) => c.name === "rsas_session")!;
  expect(old.httpOnly).toBe(true);
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await expect(page).toHaveURL(/\/komite\/login$/);
  const replay = await request.newContext({
    baseURL: testOrigin,
    extraHTTPHeaders: { Cookie: `rsas_session=${old.value}` },
  });
  expect((await replay.get("/api/committee/reports")).status()).toBe(401);
  await replay.dispose();
  await manager.dispose();
  await page.goto("/komite/dashboard");
  await expect(page).toHaveURL(/\/komite\/login$/);
});

test.describe("committee tools", () => {
  test.use({ storageState: ".local-data/komite_mutu-session.json" });
  test("QR downloads, private exports and dashboard filters work on real API data", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/komite/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard Keselamatan Pasien" }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Unit", exact: true })
      .selectOption("igd");
    await expect(page).toHaveURL(/unit=igd/);
    await expect(
      page.getByRole("link", { name: /IKP-RSAS-/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "KNC: 1", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "2026-01: 1", exact: true }).click();
    await expect(page).toHaveURL(/from=2026-01-01/);
    await expect(page.locator(".recharts-pie-sector path")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /IKP-RSAS-/ }).first(),
    ).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: "test-results/committee-dashboard.png",
      fullPage: true,
    });
    const dl = page.waitForEvent("download");
    await page.getByRole("button", { name: "Ekspor Excel" }).click();
    expect((await dl).suggestedFilename()).toBe("rsas-ikp.xlsx");
    await page.getByRole("link", { name: "QR pelaporan" }).click();
    await page.getByLabel("Unit otomatis").selectOption("igd");
    await expect(page.locator(".qr-poster code")).toContainText(
      "/lapor?unit=igd",
    );
    const qr = page.waitForEvent("download");
    await page.getByRole("button", { name: "Unduh QR SVG" }).click();
    expect((await qr).suggestedFilename()).toBe("rsas-lapor.svg");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".qr-poster")).toBeVisible();
    await page.emulateMedia({ media: "screen" });
    await page.screenshot({
      path: "test-results/committee-qr.png",
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
});
