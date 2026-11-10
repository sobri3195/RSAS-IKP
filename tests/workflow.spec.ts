import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Dashboard Keselamatan Pasien" }),
  ).toBeVisible();
});
test("draft: create, autosave, refresh, reopen, edit and required validation", async ({
  page,
}) => {
  await page
    .getByRole("link", { name: "Buat Laporan", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Selanjutnya" }).click();
  await expect(page.getByText("Kolom ini wajib diisi.").first()).toBeVisible();
  await page.getByLabel("Nama pasien fiktif").fill("Pasien Demo Uji");
  await page.getByRole("button", { name: "Simpan Draft" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("rsas_safety_v1_incidents")!).length,
      ),
    )
    .toBe(16);
  await page.goto("/laporan");
  await page.getByLabel("Cari nomor atau judul laporan").fill("tanpa judul");
  await page.getByRole("link", { name: "Laporan tanpa judul" }).click();
  await page.getByRole("link", { name: "Edit Laporan" }).click();
  await expect(page.getByLabel("Nama pasien fiktif")).toHaveValue(
    "Pasien Demo Uji",
  );
  await page.getByLabel("Nama pasien fiktif").fill("Pasien Demo Ubah");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("rsas_safety_v1_incidents")!).find(
            (i: any) => i.incident.patientName === "Pasien Demo Ubah",
          )?.incident.patientName,
      ),
    )
    .toBe("Pasien Demo Ubah");
  await page.reload();
  await expect(page.getByLabel("Nama pasien fiktif")).toHaveValue(
    "Pasien Demo Ubah",
  );
});
test("wizard: complete 14 questions, review, submit and transition status", async ({
  page,
}) => {
  await page.goto("/laporan/baru");
  await page.getByLabel("Nama pasien fiktif").fill("Pasien Demo E2E");
  await page.getByLabel("Nomor rekam medis demo").fill("DEMO-E2E");
  await page.getByLabel("Ruangan", { exact: false }).fill("Ruang Demo");
  await page.getByLabel("Jenis kelamin").selectOption("Perempuan");
  await page.getByLabel("Umur (tahun)").fill("30");
  await page.getByLabel("Umur (bulan)").fill("0");
  await page.getByLabel("Kelompok umur").selectOption(">15 tahun–30 tahun");
  await page.getByLabel("Penanggung biaya").selectOption("BPJS");
  await page.getByLabel("Tanggal masuk RS").fill("2026-01-01");
  await page.getByLabel("Jam masuk RS").fill("07:00");
  await page.getByRole("button", { name: "Selanjutnya" }).click();
  await page.getByLabel("1. Tanggal insiden").fill("2026-01-01");
  await page.getByLabel("1. Jam insiden").fill("08:00");
  await page.getByLabel("2. Judul singkat insiden").fill("Insiden Demo E2E");
  await page
    .getByLabel("3. Kronologis insiden")
    .fill("Kronologi sintetis lengkap untuk pengujian alur pelaporan.");
  await page.getByLabel("4. Jenis insiden").selectOption("KNC");
  await page.getByRole("button", { name: "Selanjutnya" }).click();
  await page.getByLabel("5. Orang pertama").selectOption("Perawat");
  await page.getByLabel("7. Jenis pelayanan").selectOption("Rawat inap");
  await page.getByRole("button", { name: "Selanjutnya" }).click();
  await page.getByLabel("8. Unit tempat insiden").selectOption("IGD (contoh)");
  await page.getByLabel("8. Lokasi spesifik").fill("Area Demo");
  await page.getByLabel("9. Spesialisasi").selectOption("Anak");
  await page
    .getByLabel("10. Unit / departemen")
    .selectOption("Rawat Inap (contoh)");
  await page.getByRole("button", { name: "Selanjutnya" }).click();
  await page.getByLabel("Tidak ada cedera", { exact: true }).check();
  await page.getByRole("button", { name: "Selanjutnya" }).click();
  await page
    .getByLabel("12. Tindakan yang telah dilakukan")
    .fill("Pemeriksaan ulang skenario demo");
  await page.getByLabel("12. Hasil tindakan").fill("Kondisi demo terkendali");
  await page.getByLabel("12. Jam tindakan").fill("08:05");
  await page.getByLabel("13. Tindakan dilakukan oleh").selectOption("Perawat");
  await page
    .getByLabel("14. Pernah terjadi di unit lain?")
    .selectOption("Tidak");
  await page.getByRole("button", { name: "Selanjutnya" }).click();
  await page.getByLabel("Nama pembuat laporan").fill("Petugas Demo");
  await page.getByLabel("Jabatan pembuat").fill("Perawat");
  await page.getByLabel("Paraf pembuat").fill("PD");
  await page.getByLabel("Nama penerima laporan").fill("Kepala Demo");
  await page.getByLabel("Jabatan penerima").fill("Kepala Unit");
  await page.getByLabel("Paraf penerima").fill("KD");
  await page.getByRole("button", { name: "Selanjutnya" }).click();
  await expect(
    page.locator("#main").getByText("14. Kejadian serupa di unit lain"),
  ).toBeVisible();
  await page.getByLabel("Saya memastikan seluruh data").check();
  await page.getByRole("button", { name: "Kirim Laporan Demo" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(
    page.getByRole("heading", { name: "Insiden Demo E2E" }),
  ).toBeVisible();
  await expect(page.locator(".detail-status")).toContainText(
    "Menunggu verifikasi",
  );
  // The pending autosave debounce must not undo submission during navigation.
  await page.waitForTimeout(1800);
  await page.reload();
  await expect(page.locator(".detail-status")).toContainText(
    "Menunggu verifikasi",
  );
  await page.getByRole("button", { name: "Diterima", exact: true }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.locator(".detail-status")).toContainText("Diterima");
  await page.getByRole("tab", { name: "Workflow & Aktivitas" }).click();
  await expect(page.locator(".timeline")).toContainText(
    "Menunggu verifikasi → Diterima",
  );
});
test("manual grading, RCA, CAPA create and complete", async ({ page }) => {
  await page.goto("/grading");
  await page.getByLabel("MERAH").check();
  await page.getByLabel("Dampak yang dinilai").fill("Dampak skenario demo");
  await page
    .getByLabel("Probabilitas yang dinilai")
    .fill("Probabilitas skenario demo");
  await page.getByLabel("Alasan penilaian").fill("Bukti sintetis");
  await page.getByLabel("Nama penilai demo").fill("Penilai Demo");
  await page.getByLabel("Tanggal grading").fill("2026-01-01");
  await page.getByLabel("Saya mengonfirmasi").check();
  await page.getByRole("button", { name: "Simpan Grading Manual" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("rsas_safety_v1_incidents")!)[0]
            .riskAssessment.grade,
      ),
    )
    .toBe("MERAH");
  await page.goto("/investigasi");
  await page
    .getByRole("textbox", { name: "Masalah utama", exact: true })
    .fill("Masalah Demo Teruji");
  await page.getByRole("button", { name: "Tambahkan Akar Masalah" }).click();
  await page
    .getByLabel("Akar masalah 2")
    .fill("Akar masalah berdasarkan skenario");
  await page.getByRole("button", { name: "Simpan Investigasi" }).click();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Masalah utama", exact: true }),
  ).toHaveValue("Masalah Demo Teruji");
  await page.goto("/tindak-lanjut");
  await page.getByRole("button", { name: "Tambah CAPA" }).click();
  await page
    .getByLabel("Tindakan korektif", { exact: true })
    .fill("Uji perbaikan demo");
  await page
    .getByLabel("Tindakan preventif", { exact: true })
    .fill("Pencegahan demo");
  await page.getByLabel("Penanggung jawab demo").fill("PIC Demo");
  await page.getByLabel("Tanggal mulai").fill("2026-01-01");
  await page.getByLabel("Target selesai").fill("2026-01-03");
  await page.getByRole("button", { name: "Simpan CAPA" }).click();
  await expect(
    page.getByRole("heading", { name: "Uji perbaikan demo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit CAPA" }).click();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("Selesai");
  await page.getByLabel("Tanggal realisasi").fill("2026-01-02");
  await page.getByLabel("Bukti (catatan teks demo)").fill("Bukti teks demo");
  await page.getByLabel("Evaluasi efektivitas").fill("Evaluasi demo selesai");
  await page.getByLabel("Catatan reviewer").fill("Ditinjau reviewer demo");
  await page.getByRole("button", { name: "Simpan CAPA" }).click();
  await expect(page.locator(".capa-summary")).toContainText("100%");
  await page.reload();
  await expect(page.locator(".action-item")).toContainText("Selesai");
});
test("search, unit filter and dashboard counts use persisted data", async ({
  page,
}) => {
  await expect(page.locator(".kpi").first().locator("strong")).toContainText(
    "15",
  );
  await page
    .getByRole("combobox", { name: "Filter unit", exact: true })
    .selectOption("IGD (contoh)");
  await expect(page.locator(".kpi").first().locator("strong")).toContainText(
    "03",
  );
  await page.goto("/laporan");
  await page
    .getByLabel("Cari nomor atau judul laporan")
    .fill("Kesalahan label");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText(
    `RSAS-IKP-${new Date().getFullYear()}-0001`,
  );
});
test("JSON export, validated restore, invalid restore and reset", async ({
  page,
}) => {
  await page.goto("/pengaturan");
  const dlPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor JSON", exact: true }).click();
  const dl = await dlPromise;
  expect(dl.suggestedFilename()).toBe("rsas-safety-demo-backup.json");
  const backup = await page.evaluate(() => ({
    schemaVersion: 1,
    ...Object.fromEntries(
      [
        "settings",
        "incidents",
        "investigations",
        "actions",
        "activity",
        "units",
      ].map((f) => [
        f,
        JSON.parse(localStorage.getItem("rsas_safety_v1_" + f)!),
      ]),
    ),
  }));
  await page.getByLabel("Berkas backup JSON").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  });
  await expect(page.getByRole("status")).toContainText("JSON tidak valid");
  await page.getByLabel("Berkas backup JSON").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByRole("dialog")).toContainText(
    "15 laporan tervalidasi",
  );
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Hapus Semua Laporan Demo" }).click();
  // Exercise keyboard cancellation as well as pointer confirmation.
  await page.getByRole("button", { name: "Batal", exact: true }).press("Enter");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".storage-summary")).toContainText("15 laporan");
  await page
    .getByRole("button", { name: "Reset ke 15 Contoh Insiden" })
    .click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.locator(".storage-summary")).toContainText("15 laporan");
});
test("corrupt localStorage is preserved until explicit recovery", async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem("rsas_safety_v1_incidents", "{broken"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("tidak dapat dibaca");
  expect(
    await page.evaluate(() => localStorage.getItem("rsas_safety_v1_incidents")),
  ).toBe("{broken");
  await page.goto("/pengaturan");
  await page
    .getByRole("button", { name: "Reset ke 15 Contoh Insiden" })
    .click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.getByRole("alert")).not.toBeVisible();
});
test("A4 print includes complete questions and demo watermark", async ({
  page,
}) => {
  await page
    .getByRole("link", {
      name: "Kesalahan label obat terdeteksi sebelum pemberian",
      exact: true,
    })
    .first()
    .click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-document")).toBeVisible();
  await expect(
    page.locator(".print-document tbody").nth(1).locator("tr"),
  ).toHaveCount(14);
  await expect(page.locator(".print-watermark")).toBeVisible();
  await expect(page.locator(".print-document")).toContainText("Pembuat");
  await expect(page.locator("#root")).not.toBeVisible();
  await page.pdf({
    path: "test-results/rsas-demo-report.pdf",
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
});
test("all pages render without runtime errors, mobile navigation has no overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const url of [
    "/verifikasi",
    "/grading",
    "/investigasi",
    "/tindak-lanjut",
    "/analisis",
    "/mutu",
    "/aktivitas",
    "/unit",
    "/pengaturan",
    "/bantuan",
    "/login",
  ]) {
    await page.goto(url);
    await expect(page.locator("h1,h2").first()).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Buka menu" }).click();
  await page.getByRole("link", { name: "Semua Laporan", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Semua Laporan Insiden" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/laporan/baru");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/rsas-mobile-form.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
