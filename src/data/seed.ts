import {
  emptyForm,
  type Database,
  type Incident,
  type Status,
  grades,
  kinds,
} from "../schemas/models";
import { makeIncident } from "../utils/domain";
export const demoUnits = [
  "IGD (contoh)",
  "Rawat Inap (contoh)",
  "Farmasi (contoh)",
  "Rawat Jalan (contoh)",
  "Laboratorium (contoh)",
  "Kamar Operasi (contoh)",
];
export function seed(): Database {
  const titles = [
    "Kesalahan label obat terdeteksi sebelum pemberian",
    "Pasien berisiko jatuh tanpa penanda",
    "Keterlambatan hasil pemeriksaan laboratorium",
    "Identifikasi pasien sebelum pengambilan sampel",
    "Ketidaksesuaian dosis pada resep obat",
    "Serah terima pasien belum lengkap",
    "Lantai licin di area pelayanan",
    "Keterlambatan pemberian terapi",
    "Gelang identitas tidak terbaca",
    "Ketidaksesuaian penandaan sisi operasi",
    "Duplikasi permintaan pemeriksaan",
    "Obat dengan nama serupa tersimpan berdekatan",
    "Komunikasi hasil kritis tertunda",
    "Alat pemantauan tidak berfungsi",
    "Pasien hampir terjatuh saat mobilisasi",
  ];
  const states: Status[] = [
    "DILAPORKAN",
    "INVESTIGASI",
    "TINDAK_LANJUT",
    "DITERIMA",
    "SELESAI",
    "DIVERIFIKASI",
    "DRAFT",
    "SELESAI",
    "DIKEMBALIKAN_UNTUK_REVISI",
    "INVESTIGASI",
    "SELESAI",
    "ARSIP",
    "DILAPORKAN",
    "TINDAK_LANJUT",
    "SELESAI",
  ];
  const incidents: Incident[] = [];
  titles.forEach((title, n) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - (n < 6 ? n : n * 9));
    dt.setHours(8, 15, 0, 0);
    if (n === 0) dt.setTime(Date.now() - 3 * 3600000);
    const clock = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
    const date = [
      dt.getFullYear(),
      String(dt.getMonth() + 1).padStart(2, "0"),
      String(dt.getDate()).padStart(2, "0"),
    ].join("-");
    const f = {
      ...emptyForm(),
      patientName: `Pasien Demo ${String(n + 1).padStart(2, "0")}`,
      medicalNumber: `DEMO-${String(n + 1).padStart(4, "0")}`,
      room: "Ruang Simulasi A",
      ageYears: "42",
      ageMonths: "0",
      ageGroup: ">30 tahun–65 tahun",
      gender: n % 2 ? "Laki-laki" : "Perempuan",
      payer: "BPJS",
      admissionDate: date,
      admissionTime: "00:00",
      incidentDate: date,
      incidentTime: clock,
      title,
      chronology:
        "DATA SINTETIS. Saat pemeriksaan rutin, petugas menemukan kondisi yang berpotensi memengaruhi keselamatan pasien demo. Petugas melakukan konfirmasi, menghentikan proses sementara, dan melaporkan kepada kepala unit.",
      kind: kinds[n % 4],
      sentinel: n === 9 ? "Suspek kejadian sentinel" : "Belum ditentukan",
      firstReporter: n % 2 ? "Dokter" : "Perawat",
      target: "Pasien",
      service: ["Rawat inap", "Rawat jalan", "IGD / UGD"][n % 3],
      unit: demoUnits[n % 6],
      location: "Area pelayanan simulasi",
      specialty: "Penyakit Dalam",
      relatedUnit: demoUnits[(n + 2) % 6],
      impact: [
        "Tidak ada cedera",
        "Cedera ringan",
        "Cedera reversible / sedang",
      ][n % 3],
      actionTaken:
        "Menghentikan proses sementara dan melakukan konfirmasi ulang bersama tim demo.",
      actionResult: "Kondisi terkendali pada skenario simulasi.",
      actionTime: clock,
      actor: "Tim",
      team: "Dokter Demo A, Perawat Demo B",
      recurring: n % 4 === 0 ? "Ya" : "Tidak",
      previousUnit: demoUnits[1],
      previousDate: date,
      previousDescription:
        "Skenario serupa pernah dicatat pada simulasi sebelumnya.",
      prevention: "Pemeriksaan ganda dan penguatan serah terima.",
      author: "Petugas Demo",
      authorTitle: "Perawat demo",
      authorInitial: "Konfirmasi demo",
      receiver: "Kepala Unit Demo",
      receiverTitle: "Kepala unit demo",
      receiverInitial: "Konfirmasi demo",
      reportDate: date,
      receivedDate: date,
    };
    const item = makeIncident(f, incidents, states[n]);
    item.createdAt = dt.toISOString();
    item.updatedAt = dt.toISOString();
    item.submittedAt =
      states[n] === "DRAFT"
        ? null
        : new Date(
            dt.getTime() + (n > 0 && n % 5 === 0 ? 53 : 2) * 3600000,
          ).toISOString();
    if (n > 1)
      item.riskAssessment = {
        grade: grades[n % 4],
        impact: String((n % 3) + 1),
        probability: String((n % 4) + 1),
        notes: "Penilaian manual untuk demonstrasi.",
        reason: "Berdasarkan skenario sintetis, bukan rekomendasi klinis.",
        assessor: "Tim KP Demo",
        date,
      };
    incidents.push(item);
  });
  const invId = crypto.randomUUID(),
    actId = crypto.randomUUID();
  incidents[1].investigationId = invId;
  incidents[2].actionIds = [actId];
  return {
    schemaVersion: 1,
    settings: {
      schemaVersion: 1,
      name: "dr. Maya (Demo)",
      role: "Tim Keselamatan Pasien",
      matrix: "manual",
    },
    units: demoUnits,
    incidents,
    investigations: [
      {
        id: invId,
        incidentId: incidents[1].id,
        summary: "Skenario penanda risiko jatuh pada pasien demo.",
        problem: "Penanda belum dipasang saat perpindahan ruang.",
        facts: "Serah terima simulasi belum memuat konfirmasi penanda.",
        unknown: "Ketersediaan stok penanda pada waktu kejadian.",
        timeline:
          "08:15 kondisi teridentifikasi\n08:20 konfirmasi petugas\n08:30 koreksi dilakukan",
        whys: [
          "Penanda belum terpasang.",
          "Konfirmasi saat serah terima belum dilakukan.",
          "",
          "",
          "",
        ],
        fishbone: {
          manusia: "Kebutuhan pelatihan ulang (hipotesis).",
          komunikasi: "Checklist serah terima belum terisi.",
          lingkungan: "",
          prosedur: "",
          peralatan: "",
          organisasi: "",
        },
        roots: [
          "Checklist serah terima belum mencakup konfirmasi penanda (skenario demo).",
        ],
        recommendations: ["Evaluasi checklist serah terima."],
        updatedAt: new Date().toISOString(),
      },
    ],
    actions: [
      {
        id: actId,
        incidentId: incidents[2].id,
        problem: "Keterlambatan penyampaian hasil dalam skenario demo.",
        corrective: "Konfirmasi hasil melalui alur komunikasi unit.",
        preventive: "Uji checklist komunikasi hasil pemeriksaan.",
        owner: "Koordinator Demo",
        unit: demoUnits[4],
        start: incidents[2].incident.incidentDate,
        target: incidents[1].incident.incidentDate,
        realized: "",
        status: "Dalam Proses",
        evidence: "Catatan rapat simulasi.",
        evaluation: "",
        reviewer: "",
      },
    ],
    activity: incidents
      .map((i) => ({
        id: crypto.randomUUID(),
        incidentId: i.id,
        text: `${i.displayNumber} · ${i.status === "DRAFT" ? "Draft disimpan" : "Laporan demo dibuat"}`,
        at: i.createdAt,
        actor: "Petugas Demo",
      }))
      .sort((a, b) => b.at.localeCompare(a.at)),
  };
}
