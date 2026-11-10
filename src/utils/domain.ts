import { format, isValid, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { Incident, FormData, Database, Status } from "../schemas/models";
export const statusLabel: Record<Status, string> = {
  DRAFT: "Draft",
  DILAPORKAN: "Menunggu verifikasi",
  DITERIMA: "Diterima",
  DIVERIFIKASI: "Diverifikasi",
  INVESTIGASI: "Investigasi",
  TINDAK_LANJUT: "Tindak lanjut",
  SELESAI: "Selesai",
  ARSIP: "Arsip",
  DIKEMBALIKAN_UNTUK_REVISI: "Perlu revisi",
};
export const gradeLabel = {
  BIRU: "Rendah",
  HIJAU: "Sedang",
  KUNING: "Tinggi",
  MERAH: "Ekstrem",
};
export const colors = {
  BIRU: "#5099e4",
  HIJAU: "#48af9a",
  KUNING: "#eab651",
  MERAH: "#ed7379",
};
export const fmt = (s: string, pattern = "dd MMM yyyy") => {
  const d = parseISO(s);
  return isValid(d) ? format(d, pattern, { locale: id }) : "—";
};
export const today = () => format(new Date(), "yyyy-MM-dd");
export function deadline(i: Incident, now = Date.now()) {
  const t = new Date(
    `${i.incident.incidentDate}T${i.incident.incidentTime}`,
  ).getTime();
  const end = t + 48 * 3600000;
  const reference = i.submittedAt ? new Date(i.submittedAt).getTime() : now;
  return {
    hours: Math.ceil(Math.abs(end - reference) / 3600000),
    late: reference > end,
    valid: Number.isFinite(t),
    end,
  };
}
export function nextNumber(
  incidents: Incident[],
  year = new Date().getFullYear(),
) {
  let n = 1;
  const taken = new Set(incidents.map((i) => i.displayNumber));
  while (taken.has(`RSAS-IKP-${year}-${String(n).padStart(4, "0")}`)) n++;
  return `RSAS-IKP-${year}-${String(n).padStart(4, "0")}`;
}
export function makeIncident(
  form: FormData,
  incidents: Incident[],
  status: Status = "DRAFT",
  existing?: Incident,
): Incident {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? crypto.randomUUID(),
    displayNumber: existing?.displayNumber ?? nextNumber(incidents),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    submittedAt:
      status === "DILAPORKAN"
        ? (existing?.submittedAt ?? now)
        : (existing?.submittedAt ?? null),
    status,
    patient: { name: form.patientName, medicalNumber: form.medicalNumber },
    incident: form,
    reporter: form.author,
    immediateAction: form.actionTaken,
    impact: form.impact,
    approval: { author: form.authorInitial, receiver: form.receiverInitial },
    riskAssessment: existing?.riskAssessment ?? {
      grade: null,
      impact: "",
      probability: "",
      notes: "",
      reason: "",
      assessor: "",
      date: "",
    },
    investigationId: existing?.investigationId ?? null,
    actionIds: existing?.actionIds ?? [],
  };
}
export const transitions: Record<Status, Status[]> = {
  DRAFT: ["DILAPORKAN"],
  DILAPORKAN: ["DITERIMA", "DIKEMBALIKAN_UNTUK_REVISI"],
  DITERIMA: ["DIVERIFIKASI", "DIKEMBALIKAN_UNTUK_REVISI"],
  DIVERIFIKASI: ["INVESTIGASI", "TINDAK_LANJUT"],
  INVESTIGASI: ["TINDAK_LANJUT"],
  TINDAK_LANJUT: ["SELESAI"],
  SELESAI: ["ARSIP"],
  ARSIP: [],
  DIKEMBALIKAN_UNTUK_REVISI: ["DILAPORKAN"],
};
export function changeStatus(
  db: Database,
  id: string,
  status: Status,
): Database {
  const i = db.incidents.find((i) => i.id === id);
  if (!i || !transitions[i.status].includes(status))
    throw new Error("Transisi status tidak diizinkan.");
  const now = new Date().toISOString();
  return {
    ...db,
    incidents: db.incidents.map((v) =>
      v.id === id
        ? {
            ...v,
            status,
            updatedAt: now,
            submittedAt:
              status === "DILAPORKAN" ? (v.submittedAt ?? now) : v.submittedAt,
          }
        : v,
    ),
    activity: [
      {
        id: crypto.randomUUID(),
        incidentId: id,
        text: `Status: ${statusLabel[i.status]} → ${statusLabel[status]}`,
        at: now,
        actor: db.settings.role,
      },
      ...db.activity,
    ],
  };
}
export function aggregate(items: Incident[], get: (i: Incident) => string) {
  return Object.entries(
    items.reduce<Record<string, number>>((a, i) => {
      const k = get(i) || "Belum diisi";
      a[k] = (a[k] ?? 0) + 1;
      return a;
    }, {}),
  ).map(([name, value]) => ({ name, value }));
}
export function metrics(items: Incident[], now = new Date()) {
  const sent = items.filter((i) => i.submittedAt);
  return {
    total: items.length,
    month: items.filter(
      (i) => fmt(i.createdAt, "yyyy-MM") === format(now, "yyyy-MM"),
    ).length,
    today: items.filter(
      (i) => fmt(i.createdAt, "yyyy-MM-dd") === format(now, "yyyy-MM-dd"),
    ).length,
    pending: items.filter((i) => ["DILAPORKAN", "DITERIMA"].includes(i.status))
      .length,
    investigation: items.filter((i) => i.status === "INVESTIGASI").length,
    done: items.filter((i) => ["SELESAI", "ARSIP"].includes(i.status)).length,
    recurring: items.filter((i) => i.incident.recurring === "Ya").length,
    late: items.filter(
      (i) =>
        deadline(i, now.getTime()).late && deadline(i, now.getTime()).valid,
    ).length,
    onTime: sent.length
      ? Math.round(
          (sent.filter((i) => !deadline(i).late).length / sent.length) * 100,
        )
      : 0,
  };
}
export function download(
  name: string,
  data: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(items: Incident[]) {
  const quote = (v: unknown) =>
    `"${String(v)
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`;
  return (
    "\uFEFF" +
    [
      [
        "Nomor",
        "Tanggal insiden",
        "Jenis",
        "Unit",
        "Grading",
        "Status",
        "Berulang",
      ],
      ...items.map((i) => [
        i.displayNumber,
        i.incident.incidentDate,
        i.incident.kind,
        i.incident.unit,
        i.riskAssessment.grade ?? "Belum ditetapkan",
        statusLabel[i.status],
        i.incident.recurring,
      ]),
    ]
      .map((row) => row.map(quote).join(","))
      .join("\r\n")
  );
}
