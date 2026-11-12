import { z } from "zod";

export const units = [
  { id: "igd", name: "IGD" },
  { id: "rawat-inap", name: "Rawat Inap" },
  { id: "rawat-jalan", name: "Rawat Jalan" },
  { id: "icu", name: "ICU" },
  { id: "kamar-operasi", name: "Kamar Operasi" },
  { id: "farmasi", name: "Farmasi" },
  { id: "laboratorium", name: "Laboratorium" },
  { id: "radiologi", name: "Radiologi" },
  { id: "lainnya", name: "Lainnya" },
] as const;
export const reportKinds = ["KPCS", "KNC", "KTC", "KTD", "Sentinel"] as const;
export const reportStatuses = [
  "submitted",
  "under_review",
  "validated",
  "investigation",
  "action_plan",
  "effectiveness_review",
  "closed",
  "needs_revision",
  "archived",
] as const;
export const statusNames: Record<ReportStatus, string> = {
  submitted: "Laporan baru",
  under_review: "Dalam peninjauan",
  validated: "Tervalidasi",
  investigation: "Investigasi",
  action_plan: "Rencana tindakan",
  effectiveness_review: "Evaluasi efektivitas",
  closed: "Selesai",
  needs_revision: "Perlu perbaikan",
  archived: "Diarsipkan",
};
export type ReportStatus = (typeof reportStatuses)[number];
export const transitions: Record<ReportStatus, ReportStatus[]> = {
  submitted: ["under_review", "needs_revision"],
  under_review: ["validated", "needs_revision"],
  validated: ["investigation"],
  investigation: ["action_plan", "needs_revision"],
  action_plan: ["effectiveness_review"],
  effectiveness_review: ["closed", "action_plan"],
  closed: ["archived"],
  archived: [],
  needs_revision: ["under_review"],
};
const text = (max = 2000) => z.string().trim().max(max);
const required = (max = 2000) => text(max).min(1, "Kolom ini wajib diisi.");
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    "Tanggal tidak valid.",
  );
export const reportInput = z
  .object({
    incidentDate: date,
    incidentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    discoveredDate: date,
    unit: required(120),
    location: required(200),
    service: required(120),
    kind: z.enum(reportKinds),
    category: required(120),
    chronology: required(10000),
    discovery: required(2000),
    patientCondition: required(2000),
    impact: required(2000),
    immediateAction: required(4000),
    supervisorNotified: z.enum(["Ya", "Tidak", "Belum"]),
    patientReference: text(120),
    medicalNumber: text(100),
    contributingFactors: text(4000),
    reporterName: text(120),
    reporterTitle: text(120),
    contact: text(200),
    factual: z.literal(true, { error: "Konfirmasi pernyataan fakta." }),
  })
  .strict()
  .superRefine((r, c) => {
    const at = new Date(
      `${r.incidentDate}T${r.incidentTime}:00+07:00`,
    ).getTime();
    if (at > Date.now())
      c.addIssue({
        code: "custom",
        path: ["incidentDate"],
        message: "Waktu kejadian tidak boleh di masa depan.",
      });
    if (
      r.discoveredDate < r.incidentDate ||
      new Date(`${r.discoveredDate}T00:00:00+07:00`).getTime() > Date.now()
    )
      c.addIssue({
        code: "custom",
        path: ["discoveredDate"],
        message: "Periksa tanggal ditemukan.",
      });
  });
export type ReportInput = z.infer<typeof reportInput>;
export const newReport = (): ReportInput => ({
  incidentDate: "",
  incidentTime: "",
  discoveredDate: "",
  unit: "",
  location: "",
  service: "",
  kind: "KNC",
  category: "",
  chronology: "",
  discovery: "",
  patientCondition: "",
  impact: "",
  immediateAction: "",
  supervisorNotified: "Belum",
  patientReference: "",
  medicalNumber: "",
  contributingFactors: "",
  reporterName: "",
  reporterTitle: "",
  contact: "",
  factual: false as true,
});
export const riskInput = z
  .object({
    grade: z.enum(["BIRU", "HIJAU", "KUNING", "MERAH"]).nullable(),
    impact: text(),
    probability: text(),
    reason: text(),
  })
  .strict()
  .superRefine((r, c) => {
    if (r.grade && (!r.impact || !r.probability || !r.reason))
      c.addIssue({
        code: "custom",
        message: "Grading memerlukan dampak, probabilitas, dan alasan penilai.",
      });
  });
export const investigationInput = z
  .object({
    owner: text(120),
    deadline: z.union([date, z.literal("")]),
    summary: text(10000),
    facts: text(10000),
    timeline: text(10000),
    whys: z.array(text(2000)).length(5),
    fishbone: z
      .object({
        manusia: text(),
        komunikasi: text(),
        lingkungan: text(),
        prosedur: text(),
        peralatan: text(),
        organisasi: text(),
      })
      .strict(),
    roots: text(10000),
    recommendations: text(10000),
  })
  .strict();
export const actionInput = z
  .object({
    id: z.string().uuid(),
    corrective: required(4000),
    preventive: required(4000),
    owner: required(120),
    deadline: date,
    done: z.boolean(),
    evidence: text(4000),
    evaluation: text(4000),
    reviewer: text(120),
  })
  .strict()
  .superRefine((a, c) => {
    if (a.done && (!a.evidence || !a.evaluation || !a.reviewer))
      c.addIssue({
        code: "custom",
        message: "Tindakan selesai memerlukan bukti, evaluasi, dan reviewer.",
      });
  });
export const reviewInput = z
  .object({
    version: z.number().int().positive(),
    status: z.enum(reportStatuses),
    kind: z.enum(reportKinds),
    category: required(120),
    note: required(2000),
    risk: riskInput,
    investigation: investigationInput,
    actions: z.array(actionInput).max(100),
    corrections: z
      .object({
        chronology: required(10000),
        discovery: required(),
        patientCondition: required(),
        impact: required(),
        immediateAction: required(4000),
        patientReference: text(120),
        medicalNumber: text(100),
        contributingFactors: text(4000),
        reporterName: text(120),
        reporterTitle: text(120),
        contact: text(200),
      })
      .partial()
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((r, c) => {
    if (new Set(r.actions.map((a) => a.id)).size !== r.actions.length)
      c.addIssue({ code: "custom", message: "ID tindakan duplikat." });
    if (
      [
        "investigation",
        "action_plan",
        "effectiveness_review",
        "closed",
      ].includes(r.status) &&
      (!r.investigation.owner || !r.investigation.deadline)
    )
      c.addIssue({
        code: "custom",
        message: "Tetapkan PIC dan tenggat investigasi.",
      });
    if (
      ["action_plan", "effectiveness_review", "closed"].includes(r.status) &&
      (!r.investigation.facts || !r.investigation.roots)
    )
      c.addIssue({
        code: "custom",
        message: "Lengkapi fakta dan akar masalah investigasi.",
      });
    if (
      ["effectiveness_review", "closed"].includes(r.status) &&
      !r.actions.length
    )
      c.addIssue({
        code: "custom",
        message: "Tambahkan rencana tindak lanjut.",
      });
    if (
      r.status === "closed" &&
      (!r.risk.grade || r.actions.some((a) => !a.done))
    )
      c.addIssue({
        code: "custom",
        message:
          "Penutupan memerlukan grading dan semua tindakan selesai dievaluasi.",
      });
  });
export type ReviewInput = z.infer<typeof reviewInput>;
export const emptyReview = (): Omit<
  ReviewInput,
  "version" | "status" | "kind" | "category" | "note" | "corrections"
> => ({
  risk: { grade: null, impact: "", probability: "", reason: "" },
  investigation: {
    owner: "",
    deadline: "",
    summary: "",
    facts: "",
    timeline: "",
    whys: ["", "", "", "", ""],
    fishbone: {
      manusia: "",
      komunikasi: "",
      lingkungan: "",
      prosedur: "",
      peralatan: "",
      organisasi: "",
    },
    roots: "",
    recommendations: "",
  },
  actions: [],
});
export interface ReportSummary {
  id: string;
  number: string;
  status: ReportStatus;
  kind: (typeof reportKinds)[number];
  unit: string;
  category: string;
  grade: string | null;
  incident_at: string;
  created_at: string;
  updated_at: string;
  version: number;
  deadline: string | null;
}
export interface ReportDetail extends ReportSummary {
  data: ReportInput & ReturnType<typeof emptyReview> & { legacy?: unknown };
  files: { id: string; name: string; mime: string }[];
}
export interface SessionUser {
  id: string;
  name: string;
  role: string;
  canManageAccounts: boolean;
  csrf: string;
}
