import { describe, expect, it } from "vitest";
import { seed } from "../data/seed";
import { buildTrendData } from "../components/charts";
import {
  actionSchema,
  formSchema,
  nonPatientImpact,
  riskSchema,
  stepFields,
  type Incident,
} from "../schemas/models";
import { importBackup } from "../services/storage";

const manualAssessment = () => ({
  grade: "MERAH" as const,
  impact: "Dampak skenario demo",
  probability: "Probabilitas demo",
  notes: "",
  reason: "Bukti skenario demo",
  assessor: "Penilai Demo",
  date: "2026-01-01",
});
const reportOn = (date: string, kind: string): Incident => {
  const report = seed().incidents[0];
  return {
    ...report,
    incident: { ...report.incident, incidentDate: date, kind },
  };
};

describe("Dampak pasien dan non-pasien", () => {
  it("mengizinkan laporan non-pasien dengan pilihan tidak relevan tanpa identitas pasien", () => {
    const form = {
      ...seed().incidents[0].incident,
      target: "Karyawan",
      impact: nonPatientImpact,
    };
    stepFields[0].forEach((field) => {
      form[field] = "";
    });
    expect(formSchema.safeParse(form).success).toBe(true);
  });
  it("tidak mengizinkan laporan pasien menggunakan dampak tidak relevan", () => {
    const result = formSchema.safeParse({
      ...seed().incidents[0].incident,
      target: "Pasien",
      impact: nonPatientImpact,
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((i) => i.path[0])).toContain("impact");
  });
  it("memerlukan dampak terisi dan mempertahankan label historis non-pasien", () => {
    const form = { ...seed().incidents[0].incident, target: "Pengunjung" };
    expect(formSchema.safeParse({ ...form, impact: "" }).success).toBe(false);
    expect(
      formSchema.safeParse({ ...form, impact: "Tidak ada cedera" }).success,
    ).toBe(true);
    expect(
      formSchema.safeParse({ ...form, impact: nonPatientImpact }).success,
    ).toBe(true);
  });
});

describe("Validasi grading manual dan CAPA melalui schema bersama", () => {
  it("menolak penilaian yang hanya berisi spasi dan tanggal grading tidak valid", () => {
    const assessment = manualAssessment();
    for (const field of [
      "impact",
      "probability",
      "reason",
      "assessor",
    ] as const) {
      expect(
        riskSchema.safeParse({ ...assessment, [field]: "   " }).success,
      ).toBe(false);
    }
    expect(riskSchema.safeParse({ ...assessment, date: "" }).success).toBe(
      false,
    );
    expect(
      riskSchema.safeParse({ ...assessment, date: "2026-02-30" }).success,
    ).toBe(false);
  });
  it("tetap mengizinkan status menunggu grading dan menormalisasi input penilai", () => {
    expect(
      riskSchema.safeParse({
        grade: null,
        impact: "",
        probability: "",
        notes: "",
        reason: "",
        assessor: "",
        date: "",
      }).success,
    ).toBe(true);
    const parsed = riskSchema.parse({
      ...manualAssessment(),
      assessor: "  Penilai Demo  ",
    });
    expect(parsed.assessor).toBe("Penilai Demo");
  });
  it("menolak backup dengan hasil grading tanpa bukti penilai yang lengkap", () => {
    const database = seed();
    database.incidents[0].riskAssessment = {
      ...manualAssessment(),
      assessor: "",
      reason: "",
    };
    expect(() => importBackup(JSON.stringify(database))).toThrow(
      "JSON tidak valid",
    );
  });
  it("menolak uraian dan PIC CAPA yang hanya berisi spasi", () => {
    const action = seed().actions[0];
    for (const field of [
      "problem",
      "corrective",
      "preventive",
      "owner",
      "unit",
    ] as const) {
      expect(
        actionSchema.safeParse({ ...action, [field]: "   " }).success,
      ).toBe(false);
    }
    expect(actionSchema.parse({ ...action, owner: "  PIC Demo  " }).owner).toBe(
      "PIC Demo",
    );
  });
});

describe("Tren laporan mutu mengikuti periode terpilih", () => {
  it("menghitung hari pada bulan historis tanpa mengikuti bulan perangkat saat ini", () => {
    const items = [
      reportOn("2025-02-03", "KNC"),
      reportOn("2025-02-20", "KTD"),
      reportOn("2025-03-01", "KNC"),
    ];
    const data = buildTrendData(
      items,
      { start: "2025-02-01", end: "2025-02-28" },
      new Date("2026-11-10T12:00:00"),
    );
    expect(data).toHaveLength(28);
    expect(data.find((d) => d.period === "2025-02-03")?.KNC).toBe(1);
    expect(data.find((d) => d.period === "2025-02-20")?.KTD).toBe(1);
    expect(
      data.reduce((sum, d) => sum + d.KPC + d.KNC + d.KTC + d.KTD, 0),
    ).toBe(2);
  });
  it("menampilkan semua dua belas bulan pada tahun historis yang dipilih", () => {
    const data = buildTrendData(
      [reportOn("2024-01-02", "KNC"), reportOn("2024-12-20", "KTD")],
      { start: "2024-01-01", end: "2024-12-31" },
    );
    expect(data).toHaveLength(12);
    expect(data[0]).toMatchObject({ period: "2024-01", KNC: 1 });
    expect(data[11]).toMatchObject({ period: "2024-12", KTD: 1 });
  });
  it("menghormati batas tanggal dan membuat satu titik untuk laporan harian", () => {
    const data = buildTrendData(
      [reportOn("2026-01-01", "KPC"), reportOn("2026-01-02", "KNC")],
      { start: "2026-01-02", end: "2026-01-02" },
    );
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ period: "2026-01-02", KPC: 0, KNC: 1 });
  });
  it("mempertahankan enam bulan terakhir pada dashboard tanpa rentang khusus", () => {
    const data = buildTrendData([], undefined, new Date("2026-11-10T12:00:00"));
    expect(data).toHaveLength(6);
    expect(data[0].period).toBe("2026-06");
    expect(data[5].period).toBe("2026-11");
  });
});
