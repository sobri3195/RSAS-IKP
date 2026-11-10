import { z } from "zod";
export const statuses = [
  "DRAFT",
  "DILAPORKAN",
  "DITERIMA",
  "DIVERIFIKASI",
  "INVESTIGASI",
  "TINDAK_LANJUT",
  "SELESAI",
  "ARSIP",
  "DIKEMBALIKAN_UNTUK_REVISI",
] as const;
export const roles = [
  "Petugas pelapor",
  "Kepala unit",
  "Tim Keselamatan Pasien",
  "Tim Mutu",
  "Pimpinan RSAS",
  "Administrator demo",
] as const;
export const grades = ["BIRU", "HIJAU", "KUNING", "MERAH"] as const;
export const kinds = ["KPC", "KNC", "KTC", "KTD"] as const;
export const nonPatientImpact = "Tidak relevan (non-pasien)";
export const patientImpacts = [
  "Kematian",
  "Cedera irreversible / berat",
  "Cedera reversible / sedang",
  "Cedera ringan",
  "Tidak ada cedera",
] as const;
export const formFields = [
  "patientName",
  "medicalNumber",
  "room",
  "ageYears",
  "ageMonths",
  "ageGroup",
  "gender",
  "payer",
  "admissionDate",
  "admissionTime",
  "dateReason",
  "incidentDate",
  "incidentTime",
  "title",
  "chronology",
  "kind",
  "sentinel",
  "firstReporter",
  "target",
  "service",
  "unit",
  "location",
  "specialty",
  "relatedUnit",
  "otherUnit",
  "unitNotes",
  "impact",
  "actionTaken",
  "actionResult",
  "actionTime",
  "actionNotes",
  "actor",
  "team",
  "recurring",
  "previousUnit",
  "previousDate",
  "previousDescription",
  "prevention",
  "author",
  "authorTitle",
  "authorInitial",
  "receiver",
  "receiverTitle",
  "receiverInitial",
  "reportDate",
  "receivedDate",
] as const;
export const formBase = z.object(
  Object.fromEntries(formFields.map((f) => [f, z.string()])) as Record<
    (typeof formFields)[number],
    z.ZodString
  >,
);
export type FormData = z.infer<typeof formBase>;
export const emptyForm = (): FormData =>
  Object.fromEntries(formFields.map((f) => [f, ""])) as FormData;
export const stepFields: (keyof FormData)[][] = [
  [
    "patientName",
    "medicalNumber",
    "room",
    "ageGroup",
    "gender",
    "payer",
    "admissionDate",
    "admissionTime",
  ],
  ["incidentDate", "incidentTime", "title", "chronology", "kind", "sentinel"],
  ["firstReporter", "target", "service"],
  ["unit", "location", "specialty", "relatedUnit"],
  ["impact"],
  [
    "actionTaken",
    "actionResult",
    "actionTime",
    "actor",
    "team",
    "recurring",
    "previousUnit",
    "previousDate",
    "previousDescription",
    "prevention",
  ],
  [
    "author",
    "authorTitle",
    "authorInitial",
    "receiver",
    "receiverTitle",
    "receiverInitial",
    "reportDate",
    "receivedDate",
  ],
  [],
];
export const formSchema = formBase.superRefine((d, ctx) => {
  const required = stepFields
    .flat()
    .filter(
      (f) =>
        ![
          "team",
          "previousUnit",
          "previousDate",
          "previousDescription",
          "prevention",
        ].includes(f) &&
        !(d.target && d.target !== "Pasien" && stepFields[0].includes(f)),
    );
  required.forEach((f) => {
    if (!d[f].trim())
      ctx.addIssue({
        code: "custom",
        path: [f],
        message: "Kolom ini wajib diisi.",
      });
  });
  if (d.actor === "Tim" && !d.team.trim())
    ctx.addIssue({
      code: "custom",
      path: ["team"],
      message: "Isi anggota tim.",
    });
  if (d.relatedUnit === "Lain-lain" && !d.otherUnit.trim())
    ctx.addIssue({
      code: "custom",
      path: ["otherUnit"],
      message: "Isi nama unit lainnya.",
    });
  if (d.recurring === "Ya")
    (
      [
        "previousUnit",
        "previousDate",
        "previousDescription",
        "prevention",
      ] as const
    ).forEach((f) => {
      if (!d[f].trim())
        ctx.addIssue({
          code: "custom",
          path: [f],
          message: "Wajib untuk kejadian berulang.",
        });
    });
  const dateFields = [
    "admissionDate",
    "incidentDate",
    "reportDate",
    "receivedDate",
    ...(d.recurring === "Ya" ? ["previousDate"] : []),
  ] as const;
  dateFields.forEach((f) => {
    const v = d[f as keyof FormData];
    if (
      v &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(v) ||
        isNaN(new Date(v).getTime()) ||
        new Date(v).toISOString().slice(0, 10) !== v)
    )
      ctx.addIssue({
        code: "custom",
        path: [f],
        message: "Tanggal tidak valid.",
      });
  });
  ["admissionTime", "incidentTime", "actionTime"].forEach((f) => {
    if (
      d[f as keyof FormData] &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(d[f as keyof FormData])
    )
      ctx.addIssue({ code: "custom", path: [f], message: "Jam tidak valid." });
  });
  const incident = new Date(`${d.incidentDate}T${d.incidentTime}`),
    admission = new Date(`${d.admissionDate}T${d.admissionTime}`);
  if (incident.getTime() > Date.now())
    ctx.addIssue({
      code: "custom",
      path: ["incidentDate"],
      message: "Waktu insiden tidak boleh di masa depan.",
    });
  if (admission > incident && !d.dateReason.trim())
    ctx.addIssue({
      code: "custom",
      path: ["dateReason"],
      message: "Jelaskan alasan tanggal masuk melewati waktu insiden.",
    });
  if (d.reportDate && d.incidentDate && d.reportDate < d.incidentDate)
    ctx.addIssue({
      code: "custom",
      path: ["reportDate"],
      message: "Tanggal laporan tidak boleh mendahului insiden.",
    });
  if (d.receivedDate && d.reportDate && d.receivedDate < d.reportDate)
    ctx.addIssue({
      code: "custom",
      path: ["receivedDate"],
      message: "Tanggal penerimaan tidak boleh mendahului laporan.",
    });
  if (!kinds.includes(d.kind as (typeof kinds)[number]))
    ctx.addIssue({
      code: "custom",
      path: ["kind"],
      message: "Pilih jenis insiden.",
    });
  if (d.target === "Pasien" && d.impact === nonPatientImpact)
    ctx.addIssue({
      code: "custom",
      path: ["impact"],
      message: "Pilih dampak terhadap pasien yang sesuai.",
    });
  // Existing demo backups may contain a clinical label for a non-patient case.
  // Preserve those historical values; the wizard now offers only explicit N/A.
  ["ageYears", "ageMonths"].forEach((f) => {
    if (
      d[f as keyof FormData] &&
      (!/^\d+$/.test(d[f as keyof FormData]) ||
        Number(d[f as keyof FormData]) > (f === "ageMonths" ? 11 : 130))
    )
      ctx.addIssue({
        code: "custom",
        path: [f],
        message:
          f === "ageMonths" ? "Gunakan 0–11 bulan." : "Umur tidak valid.",
      });
  });
});
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    "Tanggal tidak valid",
  );
export const riskSchema = z
  .object({
    grade: z.enum(grades).nullable(),
    impact: z.string().trim(),
    probability: z.string().trim(),
    notes: z.string(),
    reason: z.string().trim(),
    assessor: z.string().trim(),
    date: z.string(),
  })
  .superRefine((risk, ctx) => {
    if (risk.grade === null) return;
    for (const field of [
      "impact",
      "probability",
      "reason",
      "assessor",
    ] as const) {
      if (!risk[field])
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Kolom ini wajib diisi untuk penetapan grading.",
        });
    }
    if (!dateString.safeParse(risk.date).success)
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message: "Tanggal grading tidak valid.",
      });
  });
export const incidentSchema = z.object({
  id: z.string().uuid(),
  displayNumber: z.string().regex(/^RSAS-IKP-\d{4}-\d{4,}$/),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  submittedAt: z.string().datetime().nullable(),
  status: z.enum(statuses),
  patient: z.object({ name: z.string(), medicalNumber: z.string() }),
  incident: formBase,
  reporter: z.string(),
  immediateAction: z.string(),
  impact: z.string(),
  approval: z.object({ author: z.string(), receiver: z.string() }),
  riskAssessment: riskSchema,
  investigationId: z.string().uuid().nullable(),
  actionIds: z.array(z.string().uuid()),
});
export const investigationSchema = z.object({
  id: z.string().uuid(),
  incidentId: z.string().uuid(),
  summary: z.string(),
  problem: z.string(),
  facts: z.string(),
  unknown: z.string(),
  timeline: z.string(),
  whys: z.array(z.string()).length(5),
  fishbone: z.object({
    manusia: z.string(),
    komunikasi: z.string(),
    lingkungan: z.string(),
    prosedur: z.string(),
    peralatan: z.string(),
    organisasi: z.string(),
  }),
  roots: z.array(z.string()),
  recommendations: z.array(z.string()),
  updatedAt: z.string().datetime(),
});
export const actionStatuses = [
  "Belum Dimulai",
  "Dalam Proses",
  "Menunggu Evaluasi",
  "Selesai",
] as const;
export const actionSchema = z
  .object({
    id: z.string().uuid(),
    incidentId: z.string().uuid(),
    problem: z.string().trim().min(1),
    corrective: z.string().trim().min(1),
    preventive: z.string().trim().min(1),
    owner: z.string().trim().min(1),
    unit: z.string().trim().min(1),
    start: dateString,
    target: dateString,
    realized: z.union([z.literal(""), dateString]),
    status: z.enum(actionStatuses),
    evidence: z.string(),
    evaluation: z.string(),
    reviewer: z.string(),
  })
  .superRefine((a, c) => {
    if (a.target < a.start)
      c.addIssue({
        code: "custom",
        path: ["target"],
        message: "Target tidak boleh mendahului tanggal mulai.",
      });
    if (a.realized && a.realized < a.start)
      c.addIssue({
        code: "custom",
        path: ["realized"],
        message: "Tanggal realisasi tidak valid.",
      });
    if (
      a.status === "Selesai" &&
      (!a.realized ||
        !a.evidence.trim() ||
        !a.evaluation.trim() ||
        !a.reviewer.trim())
    )
      c.addIssue({
        code: "custom",
        message:
          "CAPA selesai memerlukan realisasi, bukti, evaluasi, dan reviewer.",
      });
  });
export const activitySchema = z.object({
  id: z.string().uuid(),
  incidentId: z.string().nullable(),
  text: z.string(),
  at: z.string().datetime(),
  actor: z.string(),
});
export const settingsSchema = z.object({
  role: z.enum(roles),
  name: z.string(),
  matrix: z.literal("manual"),
  schemaVersion: z.literal(1),
});
export const backupSchema = z
  .object({
    schemaVersion: z.literal(1),
    settings: settingsSchema,
    incidents: z.array(incidentSchema).max(10000),
    investigations: z.array(investigationSchema).max(10000),
    actions: z.array(actionSchema).max(20000),
    activity: z.array(activitySchema).max(50000),
    units: z.array(z.string().min(1)).min(1).max(200),
  })
  .superRefine((d, c) => {
    const check = (values: string[], path: string) => {
      if (new Set(values).size !== values.length)
        c.addIssue({
          code: "custom",
          path: [path],
          message: "ID / nomor duplikat.",
        });
    };
    check(
      d.incidents.map((i) => i.id),
      "incidents",
    );
    check(
      d.incidents.map((i) => i.displayNumber),
      "incidents",
    );
    check(
      d.actions.map((i) => i.id),
      "actions",
    );
    check(
      d.investigations.map((i) => i.id),
      "investigations",
    );
    check(
      d.activity.map((i) => i.id),
      "activity",
    );
    check(d.units, "units");
    const ids = new Set(d.incidents.map((i) => i.id));
    [...d.actions, ...d.investigations].forEach((i) => {
      if (!ids.has(i.incidentId))
        c.addIssue({
          code: "custom",
          message: "Referensi insiden tidak ditemukan.",
        });
    });
    d.activity.forEach((a) => {
      if (a.incidentId && !ids.has(a.incidentId))
        c.addIssue({
          code: "custom",
          message: "Referensi aktivitas tidak ditemukan.",
        });
    });
    d.incidents.forEach((i) => {
      if (
        i.status !== "DRAFT" &&
        i.status !== "DIKEMBALIKAN_UNTUK_REVISI" &&
        !formSchema.safeParse(i.incident).success
      )
        c.addIssue({
          code: "custom",
          message: "Isi laporan yang telah dikirim tidak lengkap.",
        });
      if (
        i.investigationId &&
        !d.investigations.some(
          (v) => v.id === i.investigationId && v.incidentId === i.id,
        )
      )
        c.addIssue({
          code: "custom",
          message: "Referensi investigasi tidak valid.",
        });
      if (
        i.actionIds.some(
          (id) => !d.actions.some((a) => a.id === id && a.incidentId === i.id),
        )
      )
        c.addIssue({ code: "custom", message: "Referensi CAPA tidak valid." });
    });
  });
export type Incident = z.infer<typeof incidentSchema>;
export type Investigation = z.infer<typeof investigationSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Database = z.infer<typeof backupSchema>;
export type Status = Incident["status"];
