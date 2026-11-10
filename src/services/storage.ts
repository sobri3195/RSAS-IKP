import { backupSchema, type Database } from "../schemas/models";
import { seed } from "../data/seed";
const fields = [
  "settings",
  "incidents",
  "investigations",
  "actions",
  "activity",
  "units",
] as const;
export const key = (field: string) => `rsas_safety_v1_${field}`;
export function load(): { data: Database; error: string } {
  try {
    if (!fields.some((f) => localStorage.getItem(key(f)) !== null)) {
      const data = seed();
      save(data);
      return { data, error: "" };
    }
    const raw = Object.fromEntries(
      fields.map((f) => [
        f,
        JSON.parse(localStorage.getItem(key(f)) || "null"),
      ]),
    );
    return {
      data: backupSchema.parse({ schemaVersion: 1, ...raw }),
      error: "",
    };
  } catch {
    return {
      data: seed(),
      error:
        "Penyimpanan demo tidak dapat dibaca atau diakses. Data asli tidak ditimpa. Ekspor salinan mentah atau pulihkan/reset melalui Pengaturan.",
    };
  }
}
export function save(data: Database) {
  const validated = backupSchema.parse(data);
  const previous = fields.map((f) => localStorage.getItem(key(f)));
  try {
    fields.forEach((f) =>
      localStorage.setItem(key(f), JSON.stringify(validated[f])),
    );
  } catch {
    fields.forEach((f, n) => {
      try {
        if (previous[n] === null) localStorage.removeItem(key(f));
        else localStorage.setItem(key(f), previous[n]!);
      } catch {
        /* Browser may deny all writes; UI keeps the last in-memory state. */
      }
    });
    throw new Error(
      "Data belum tersimpan. Penyimpanan browser penuh atau tidak diizinkan. Ekspor cadangan dan periksa pengaturan browser.",
    );
  }
}
export const exportBackup = (db: Database) =>
  JSON.stringify(backupSchema.parse(db), null, 2);
export function importBackup(text: string): Database {
  if (text.length > 15_000_000)
    throw new Error("Berkas terlalu besar (maksimal 15 MB).");
  try {
    return backupSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(
      "JSON tidak valid, versi tidak sesuai, data tidak lengkap, atau terdapat ID / nomor duplikat.",
    );
  }
}
export const rawBackup = () =>
  JSON.stringify(
    Object.fromEntries(
      fields.map((f) => [key(f), localStorage.getItem(key(f))]),
    ),
    null,
    2,
  );
