import { test, expect } from "@playwright/test";
import { useCommittee } from "./helpers";
useCommittee();

test("reference catalogue searches, filters and preserves conflicting source targets", async ({
  page,
}) => {
  await page.goto("/indikator-mutu");
  await expect(
    page.getByRole("heading", { name: "Katalog Indikator Mutu", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".reference-stats")).toContainText("34");
  await page.getByLabel("Cari indikator mutu").fill("IMP-RS-05");
  await expect(page.locator(".reference-target-summary > span")).toHaveCount(1);
  await page.getByLabel("Cari indikator mutu").fill("IMP-RS-06");
  await expect(page.locator(".reference-list tbody tr")).toHaveCount(1);
  await expect(page.locator(".reference-target-summary")).toContainText("≥95%");
  await expect(page.locator(".reference-target-summary")).toContainText("100%");
  await page
    .getByRole("link", { name: "Profil IMP-RS-06", exact: true })
    .click();
  await expect(page.locator(".reference-issues")).toContainText(
    "Target berbeda",
  );
  await expect(page.locator(".reference-targets")).toContainText("≥95%");
  await expect(page.locator(".reference-targets")).toContainText("100%");
  await expect(page.locator(".reference-citations")).toContainText("hlm. 10");
  await expect(page.locator(".reference-profile")).toContainText("Numerator");
  await page.goto("/indikator-mutu");
  await page
    .getByRole("combobox", { name: "Lingkup indikator", exact: true })
    .selectOption("Unit");
  await page
    .getByRole("combobox", { name: "Unit referensi", exact: true })
    .selectOption("Humas");
  await expect(page.locator(".reference-list tbody tr")).toHaveCount(1);
  await expect(page.locator(".reference-code")).toContainText(
    "ID katalog UNIT-HUMAS",
  );
  await page.getByRole("link", { name: "Profil UNIT-HUMAS" }).click();
  await expect(page.locator(".reference-issues")).toContainText("tidak");
  await expect(page.locator(".reference-profile")).toContainText(
    "Tidak tersedia pada dokumen yang disediakan.",
  );
});

test("reference JSON exports only filtered catalogue entries and source metadata", async ({
  page,
}) => {
  await page.goto("/indikator-mutu");
  await page.getByLabel("Cari indikator mutu").fill("IMP-RS-06");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor Katalog" }).click();
  const dl = await pending;
  const stream = await dl.createReadStream();
  const buffers: Buffer[] = [];
  for await (const chunk of stream!) buffers.push(chunk);
  const data = JSON.parse(Buffer.concat(buffers).toString("utf8"));
  expect(data.indicators).toHaveLength(1);
  expect(data.indicators[0].id).toBe("RS-06");
  expect(Object.keys(data.sources)).toHaveLength(3);
  expect(data.incidents).toBeUndefined();
  expect(data.patients).toBeUndefined();
  expect(
    data.indicators[0].targetSources.map((t: { value: string }) => t.value),
  ).toEqual(["≥95%", "100%"]);
});

test("reference detail prints provenance, not an achievement report, and mobile has no page overflow", async ({
  page,
}) => {
  await page.goto("/indikator-mutu/RS-06");
  await expect(
    page.getByRole("heading", { name: "Target dalam Dokumen" }),
  ).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-document")).toBeVisible();
  await expect(page.locator(".print-document")).toContainText(
    "BUKAN LAPORAN CAPAIAN",
  );
  await expect(page.locator(".print-document")).toContainText("Target berbeda");
  await expect(page.locator(".print-document")).toContainText("hlm. 10");
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/indikator-mutu");
  await expect(
    page.getByRole("heading", { name: "Katalog Indikator Mutu", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Cari indikator mutu").fill("tanpa-hasil-xyz");
  await expect(
    page.getByRole("heading", { name: "Tidak ada indikator sesuai filter" }),
  ).toBeVisible();
  await page.goto("/indikator-mutu/tidak-ada");
  await expect(
    page.getByRole("heading", { name: "Indikator tidak ditemukan" }),
  ).toBeVisible();
});
