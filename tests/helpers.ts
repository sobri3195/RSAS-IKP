import { test, type Page } from "@playwright/test";
export function useCommittee() {
  test.use({ storageState: ".local-data/komite_mutu-session.json" });
}
export async function publicWizard(page: Page) {
  await page.goto("/lapor?unit=igd");
  await page.getByLabel("Tanggal kejadian").fill("2026-01-02");
  await page.getByLabel("Jam kejadian").fill("09:00");
  await page.getByLabel("Tanggal ditemukan").fill("2026-01-02");
  await page.getByLabel("Lokasi kejadian").fill("Ruang simulasi");
  await page.getByLabel("Jenis pelayanan").selectOption("Gawat darurat");
  await page.getByLabel("Jenis insiden").selectOption("KNC");
  await page.getByLabel("Kategori insiden").selectOption("Obat");
  await page.getByRole("button", { name: "Berikutnya" }).click();
  for (const [label, value] of [
    ["Kronologi / apa yang terjadi?", "Kronologi sintetis tanpa pasien nyata"],
    ["Bagaimana kejadian ditemukan?", "Penemuan simulasi"],
    ["Kondisi pasien setelah kejadian", "Tidak ada pasien nyata"],
    ["Dampak atau cedera", "Tidak ada cedera"],
    ["Tindakan awal yang telah dilakukan", "Koreksi simulasi"],
  ])
    await page.getByLabel(label).fill(value);
  await page.getByRole("button", { name: "Berikutnya" }).click();
}
