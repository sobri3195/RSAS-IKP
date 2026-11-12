import { backupSchema } from "../schemas/models";
const fields = [
  "settings",
  "incidents",
  "investigations",
  "actions",
  "activity",
  "units",
] as const;
// Read only on an explicit committee export action. Never initialize, seed or clear old storage.
export function legacyBackup() {
  const raw = Object.fromEntries(
    fields.map((field) => [
      field,
      JSON.parse(localStorage.getItem(`rsas_safety_v1_${field}`) || "null"),
    ]),
  );
  return JSON.stringify(
    backupSchema.parse({ schemaVersion: 1, ...raw }),
    null,
    2,
  );
}
export function rawLegacyBackup() {
  return JSON.stringify(
    Object.fromEntries(
      fields.map((field) => [
        `rsas_safety_v1_${field}`,
        localStorage.getItem(`rsas_safety_v1_${field}`),
      ]),
    ),
    null,
    2,
  );
}
