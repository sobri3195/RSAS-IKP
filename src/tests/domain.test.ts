import { beforeEach, describe, it, expect, vi } from "vitest";
import { seed } from "../data/seed";
import { formSchema, emptyForm, backupSchema } from "../schemas/models";
import {
  makeIncident,
  nextNumber,
  changeStatus,
  deadline,
  metrics,
  csv,
  aggregate,
} from "../utils/domain";
import {
  save,
  load,
  exportBackup,
  importBackup,
  key,
} from "../services/storage";
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
describe("Laporan dan validasi", () => {
  it("membuat draft tidak lengkap dengan UUID dan nomor unik", () => {
    const i = makeIncident(emptyForm(), []);
    expect(i.status).toBe("DRAFT");
    expect(i.id).toMatch(/^[\da-f-]{36}$/);
    expect(i.displayNumber).toMatch(/^RSAS-IKP-\d{4}-0001$/);
  });
  it("menyimpan dan membuka kembali draft", () => {
    const db = seed(),
      i = makeIncident({ ...emptyForm(), title: "Draft uji" }, db.incidents);
    db.incidents.push(i);
    save(db);
    expect(
      load().data.incidents.find((v) => v.id === i.id)?.incident.title,
    ).toBe("Draft uji");
  });
  it("mengubah laporan tanpa mengganti identitasnya", () => {
    const db = seed(),
      i = db.incidents.find((i) => i.status === "DRAFT")!;
    const edited = makeIncident(
      { ...i.incident, title: "Perubahan demo" },
      db.incidents,
      "DRAFT",
      i,
    );
    expect(edited.id).toBe(i.id);
    expect(edited.displayNumber).toBe(i.displayNumber);
    expect(edited.incident.title).toBe("Perubahan demo");
  });
  it("menolak formulir kosong", () => {
    expect(formSchema.safeParse(emptyForm()).success).toBe(false);
  });
  it("menerima semua 14 bagian formulir demo lengkap", () => {
    expect(formSchema.safeParse(seed().incidents[0].incident).success).toBe(
      true,
    );
  });
  it("memvalidasi anggota tim dan rincian kejadian berulang", () => {
    const f = {
      ...seed().incidents[0].incident,
      actor: "Tim",
      team: "",
      recurring: "Ya",
      previousDescription: "",
    };
    const r = formSchema.safeParse(f);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.path[0])).toContain("team");
      expect(r.error.issues.map((i) => i.path[0])).toContain(
        "previousDescription",
      );
    }
  });
  it("menolak tanggal masa depan dan tanggal kalender tidak valid", () => {
    const f = seed().incidents[0].incident;
    expect(
      formSchema.safeParse({ ...f, incidentDate: "2099-12-31" }).success,
    ).toBe(false);
    expect(
      formSchema.safeParse({ ...f, admissionDate: "2026-02-30" }).success,
    ).toBe(false);
  });
  it("memerlukan alasan bila tanggal masuk setelah insiden", () => {
    const f = seed().incidents[2].incident;
    expect(
      formSchema.safeParse({
        ...f,
        admissionDate: "2099-01-01",
        dateReason: "",
      }).success,
    ).toBe(false);
    expect(
      formSchema.safeParse({
        ...f,
        admissionDate: "2099-01-01",
        dateReason: "Skenario non-rawat-inap",
      }).success,
    ).toBe(true);
  });
  it("mengirim laporan dengan timestamp dan aktivitas status", () => {
    let db = seed();
    const i = db.incidents.find((i) => i.status === "DRAFT")!;
    db = changeStatus(db, i.id, "DILAPORKAN");
    expect(db.incidents.find((v) => v.id === i.id)?.submittedAt).not.toBeNull();
    expect(db.activity[0].text).toContain("Menunggu verifikasi");
  });
  it("memproses transisi dan menolak lompatan status", () => {
    const db = seed(),
      i = db.incidents[0];
    expect(changeStatus(db, i.id, "DITERIMA").incidents[0].status).toBe(
      "DITERIMA",
    );
    expect(() => changeStatus(db, i.id, "SELESAI")).toThrow();
  });
  it("grading awal belum ditetapkan, grading manual dapat disimpan", () => {
    const db = seed();
    expect(db.incidents[0].riskAssessment.grade).toBeNull();
    db.incidents[0].riskAssessment = {
      grade: "MERAH",
      impact: "Dampak demo",
      probability: "Probabilitas demo",
      reason: "Bukti demo",
      notes: "",
      assessor: "Penilai Demo",
      date: "2026-11-10",
    };
    save(db);
    expect(load().data.incidents[0].riskAssessment.grade).toBe("MERAH");
  });
  it("menyimpan investigasi dan CAPA dengan referensi yang valid", () => {
    const db = seed();
    save(db);
    const restored = load().data;
    expect(restored.investigations[0].whys).toHaveLength(5);
    expect(restored.incidents[1].investigationId).toBe(
      restored.investigations[0].id,
    );
    expect(restored.incidents[2].actionIds).toContain(restored.actions[0].id);
  });
  it("menyimpan CAPA selesai beserta bukti evaluasi", () => {
    const db = seed();
    db.actions[0] = {
      ...db.actions[0],
      status: "Selesai",
      realized: "2026-11-10",
      evidence: "Bukti demo",
      evaluation: "Uji demo lengkap",
      reviewer: "Reviewer Demo",
    };
    save(db);
    expect(load().data.actions[0].status).toBe("Selesai");
  });
});
describe("Agregasi, tenggat, dan ekspor", () => {
  it("menghitung dashboard dari dataset aktif", () => {
    const db = seed(),
      m = metrics(db.incidents);
    expect(m.total).toBe(15);
    expect(m.pending).toBe(
      db.incidents.filter((i) => ["DILAPORKAN", "DITERIMA"].includes(i.status))
        .length,
    );
    expect(m.done).toBe(5);
  });
  it("memfilter dan mengagregasi jenis dari dataset yang sama", () => {
    const items = seed().incidents.filter((i) => i.incident.kind === "KNC");
    expect(aggregate(items, (i) => i.incident.kind)).toEqual([
      { name: "KNC", value: items.length },
    ]);
    expect(metrics(items).total).toBe(items.length);
  });
  it("menghitung tenggat tepat 48 jam dan jam terlambat", () => {
    const i = seed().incidents[0];
    i.incident.incidentDate = "2026-10-01";
    i.incident.incidentTime = "10:00";
    i.submittedAt = null;
    const t = new Date("2026-10-03T10:00").getTime();
    expect(deadline(i, t).late).toBe(false);
    expect(deadline(i, t + 3 * 3600000)).toMatchObject({
      late: true,
      hours: 3,
    });
  });
  it("membekukan tenggat pada waktu submit, bukan waktu sekarang", () => {
    const i = seed().incidents[0];
    i.incident.incidentDate = "2026-10-01";
    i.incident.incidentTime = "10:00";
    i.submittedAt = new Date("2026-10-01T11:00").toISOString();
    expect(deadline(i, new Date("2099-01-01").getTime())).toMatchObject({
      late: false,
      hours: 47,
    });
  });
  it("CSV tidak menyertakan identitas pasien dan melindungi formula spreadsheet", () => {
    const db = seed();
    db.incidents[0].incident.unit = "=TEST";
    const data = csv(db.incidents);
    expect(data).not.toContain(db.incidents[0].patient.name);
    expect(data).not.toContain(db.incidents[0].patient.medicalNumber);
    expect(data).toContain("'=TEST");
  });
  it("mencegah tabrakan nomor setelah impor atau perubahan urutan", () => {
    const db = seed();
    expect(new Set(db.incidents.map((i) => i.displayNumber)).size).toBe(15);
    expect(db.incidents.map((i) => i.displayNumber)).not.toContain(
      nextNumber(db.incidents),
    );
  });
});
describe("Backup dan ketahanan penyimpanan", () => {
  it("export dan import JSON mempertahankan seluruh dataset", () => {
    const db = seed();
    expect(importBackup(exportBackup(db))).toEqual(db);
  });
  it("menolak JSON rusak, versi salah, dan ID duplikat", () => {
    expect(() => importBackup("{bad")).toThrow();
    const db = seed();
    expect(() =>
      importBackup(JSON.stringify({ ...db, schemaVersion: 2 })),
    ).toThrow();
    expect(() =>
      importBackup(
        JSON.stringify({
          ...db,
          incidents: [...db.incidents, db.incidents[0]],
        }),
      ),
    ).toThrow();
  });
  it("menolak referensi investigasi atau CAPA yang tidak ditemukan", () => {
    const db = seed();
    db.actions[0].incidentId = crypto.randomUUID();
    expect(backupSchema.safeParse(db).success).toBe(false);
  });
  it("menangani localStorage rusak tanpa menimpanya", () => {
    localStorage.setItem(key("incidents"), "{corrupted");
    const r = load();
    expect(r.error).toContain("tidak dapat dibaca");
    expect(localStorage.getItem(key("incidents"))).toBe("{corrupted");
  });
  it("mempertahankan keadaan sebelumnya saat quota error", () => {
    const db = seed();
    save(db);
    const prior = localStorage.getItem(key("incidents"));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    expect(() =>
      save({ ...db, settings: { ...db.settings, name: "Perubahan uji" } }),
    ).toThrow("Data belum tersimpan");
    expect(localStorage.getItem(key("incidents"))).toBe(prior);
  });
  it("reset menghasilkan tepat 15 data sintetis dan mempertahankan schema", () => {
    save(seed());
    const db = load().data;
    db.incidents[0].incident.title = "Diubah";
    save(db);
    save(seed());
    expect(load().data.incidents).toHaveLength(15);
    expect(load().data.incidents[0].incident.title).not.toBe("Diubah");
    expect(load().data.schemaVersion).toBe(1);
  });
});
