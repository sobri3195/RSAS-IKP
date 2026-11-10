import { useState } from "react";
import {
  Save,
  Plus,
  CheckCircle2,
  ClipboardList,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { useStore } from "../app/store";
import { Card, Grade, Modal, Confirm, Empty } from "./ui";
import {
  grades,
  riskSchema,
  actionStatuses,
  actionSchema,
  type Incident,
  type Investigation,
  type Action,
} from "../schemas/models";
import { colors, gradeLabel, today, fmt } from "../utils/domain";
export function RiskEditor({ incident }: { incident: Incident }) {
  const { db, upsert, notify } = useStore();
  const [risk, setRisk] = useState(incident.riskAssessment);
  const allowed = ["Kepala unit", "Tim Keselamatan Pasien"].includes(
    db.settings.role,
  );
  return (
    <Card
      title="Penilaian Grading Risiko"
      subtitle="Penetapan manual oleh atasan pelapor / Tim Keselamatan Pasien"
    >
      <div className="info-note">
        Matriks SOP resmi RSAS belum dikonfigurasi. Tidak ada skor otomatis atau
        rekomendasi.{" "}
        {incident.riskAssessment.grade
          ? "Hasil tersimpan adalah penilaian manual."
          : "Menunggu penetapan grading."}
      </div>
      {!allowed && (
        <div className="warning-note">
          Ganti role simulasi ke Kepala unit atau Tim Keselamatan Pasien untuk
          melakukan penilaian. Ini hanya pembatasan UI.
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!allowed) return;
          if (!risk.grade) return notify("Pilih salah satu grading.");
          const assessment = riskSchema.safeParse(risk);
          if (!assessment.success)
            return notify(assessment.error.issues[0].message);
          if (
            upsert(
              {
                ...incident,
                riskAssessment: assessment.data,
                updatedAt: new Date().toISOString(),
              },
              `Grading manual ditetapkan: ${risk.grade}`,
            )
          )
            notify("Grading manual tersimpan.");
        }}
      >
        <fieldset className="grade-picker" disabled={!allowed}>
          <legend>Hasil penilaian manual</legend>
          {grades.map((g) => (
            <label
              key={g}
              className={risk.grade === g ? "chosen" : ""}
              style={{ borderColor: risk.grade === g ? colors[g] : undefined }}
            >
              <input
                type="radio"
                name="grade"
                value={g}
                checked={risk.grade === g}
                onChange={() => setRisk({ ...risk, grade: g })}
              />
              <span style={{ background: colors[g] }} />
              <b>{g}</b>
              <small>{gradeLabel[g]}</small>
            </label>
          ))}
        </fieldset>
        <fieldset disabled={!allowed} className="form-grid unstyled">
          <label className="field">
            Dampak yang dinilai
            <input
              required
              value={risk.impact}
              onChange={(e) => setRisk({ ...risk, impact: e.target.value })}
              placeholder="Uraikan dampak sesuai bukti"
            />
          </label>
          <label className="field">
            Probabilitas yang dinilai
            <input
              required
              value={risk.probability}
              onChange={(e) =>
                setRisk({ ...risk, probability: e.target.value })
              }
              placeholder="Uraikan frekuensi / kemungkinan"
            />
          </label>
          <label className="field span-2">
            Alasan penilaian
            <textarea
              required
              value={risk.reason}
              onChange={(e) => setRisk({ ...risk, reason: e.target.value })}
            />
          </label>
          <label className="field span-2">
            Catatan assessor
            <textarea
              value={risk.notes}
              onChange={(e) => setRisk({ ...risk, notes: e.target.value })}
            />
          </label>
          <label className="field">
            Nama penilai demo
            <input
              required
              value={risk.assessor}
              onChange={(e) => setRisk({ ...risk, assessor: e.target.value })}
            />
          </label>
          <label className="field">
            Tanggal grading
            <input
              type="date"
              required
              max={today()}
              value={risk.date}
              onChange={(e) => setRisk({ ...risk, date: e.target.value })}
            />
          </label>
          <label className="checkbox-field span-2">
            <input type="checkbox" required />
            Saya mengonfirmasi hasil penilaian manual untuk skenario demo ini.
          </label>
          <div className="span-2">
            <button className="btn primary">
              <Save size={16} />
              Simpan Grading Manual
            </button>
          </div>
        </fieldset>
      </form>
    </Card>
  );
}
const factors = [
  "manusia",
  "komunikasi",
  "lingkungan",
  "prosedur",
  "peralatan",
  "organisasi",
] as const;
function Fishbone({ data }: { data: Investigation["fishbone"] }) {
  return (
    <div className="fishbone">
      <svg
        viewBox="0 0 720 240"
        role="img"
        aria-label="Diagram fishbone enam faktor, berdasarkan input pengguna"
      >
        <line
          x1="25"
          y1="120"
          x2="625"
          y2="120"
          stroke="#64869d"
          strokeWidth="3"
        />
        {factors.map((f, n) => {
          const x = 90 + (n % 3) * 175,
            top = n < 3;
          return (
            <g key={f}>
              <line
                x1={x}
                y1={top ? 30 : 210}
                x2={x + 60}
                y2="120"
                stroke="#8dabb9"
                strokeWidth="2"
              />
              <rect
                x={x - 35}
                y={top ? 7 : 208}
                width="150"
                height="25"
                rx="5"
                fill={data[f] ? "#e4f3f1" : "#f0f3f6"}
              />
              <text
                x={x + 40}
                y={top ? 24 : 225}
                textAnchor="middle"
                fill="#3e5b70"
                fontSize="13"
              >
                {f[0].toUpperCase() + f.slice(1)} {data[f] ? "✓" : ""}
              </text>
            </g>
          );
        })}
        <rect x="625" y="92" width="90" height="56" rx="8" fill="#183a53" />
        <text x="670" y="117" textAnchor="middle" fill="white" fontSize="12">
          Masalah
        </text>
        <text x="670" y="135" textAnchor="middle" fill="white" fontSize="12">
          utama
        </text>
      </svg>
      <small>
        Faktor berisi input ditandai ✓. Diagram tidak menyimpulkan penyebab.
      </small>
    </div>
  );
}
export function InvestigationEditor({ incident }: { incident: Incident }) {
  const { db, commit, log, notify } = useStore();
  const existing = db.investigations.find((v) => v.incidentId === incident.id);
  const [inv, setInv] = useState<Investigation>(
    existing ?? {
      id: crypto.randomUUID(),
      incidentId: incident.id,
      summary: incident.incident.title,
      problem: "",
      facts: "",
      unknown: "",
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
      roots: [""],
      recommendations: [""],
      updatedAt: new Date().toISOString(),
    },
  );
  const fields = [
    ["summary", "Ringkasan kejadian"],
    ["problem", "Masalah utama"],
    ["facts", "Fakta yang diketahui"],
    ["unknown", "Informasi yang belum tersedia"],
    ["timeline", "Timeline insiden (waktu dan peristiwa)"],
  ] as const;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const next = {
          ...inv,
          roots: inv.roots.filter((r) => r.trim()),
          recommendations: inv.recommendations.filter((r) => r.trim()),
          updatedAt: new Date().toISOString(),
        };
        if (
          commit(
            log(
              {
                ...db,
                investigations: [
                  ...db.investigations.filter(
                    (v) => v.incidentId !== incident.id,
                  ),
                  next,
                ],
                incidents: db.incidents.map((i) =>
                  i.id === incident.id
                    ? {
                        ...i,
                        investigationId: next.id,
                        updatedAt: next.updatedAt,
                      }
                    : i,
                ),
              },
              "Investigasi dan RCA demo disimpan",
              incident.id,
            ),
          )
        )
          notify("Investigasi tersimpan.");
      }}
    >
      <Card
        title="Investigasi & Root Cause Analysis"
        subtitle="Catat bukti, bedakan fakta dengan hipotesis, dan sepakati akar masalah."
      >
        <div className="info-note">
          Semua analisis berasal dari input pengguna. Tidak ada kesimpulan
          klinis otomatis.
        </div>
        <div className="form-grid">
          {fields.map(([key, label]) => (
            <label
              className={`field ${["summary", "timeline"].includes(key) ? "span-2" : ""}`}
              key={key}
            >
              {label}
              <textarea
                required={["summary", "problem", "facts"].includes(key)}
                value={inv[key]}
                onChange={(e) => setInv({ ...inv, [key]: e.target.value })}
                rows={key === "timeline" ? 4 : 3}
              />
            </label>
          ))}
        </div>
      </Card>
      <Card
        title="Five Whys"
        subtitle="Telusuri penyebab berdasarkan bukti yang tersedia."
      >
        <div className="whys">
          {inv.whys.map((w, n) => (
            <label className="field" key={n}>
              <span>
                <b>{n + 1}</b>Mengapa {n + 1}?
              </span>
              <input
                value={w}
                onChange={(e) =>
                  setInv({
                    ...inv,
                    whys: inv.whys.map((v, k) =>
                      k === n ? e.target.value : v,
                    ),
                  })
                }
                placeholder="Catat jawaban dan bukti pendukung..."
              />
            </label>
          ))}
        </div>
      </Card>
      <Card
        title="Fishbone Analysis"
        subtitle="Enam kelompok faktor kontribusi"
      >
        <Fishbone data={inv.fishbone} />
        <div className="form-grid">
          {factors.map((f) => (
            <label key={f} className="field capitalize">
              Faktor {f}
              <textarea
                value={inv.fishbone[f]}
                onChange={(e) =>
                  setInv({
                    ...inv,
                    fishbone: { ...inv.fishbone, [f]: e.target.value },
                  })
                }
              />
            </label>
          ))}
        </div>
      </Card>
      <Card title="Akar Masalah & Rekomendasi">
        <div className="form-grid">
          <div>
            {inv.roots.map((r, n) => (
              <label className="field" key={n}>
                Akar masalah {n + 1}
                <textarea
                  value={r}
                  onChange={(e) =>
                    setInv({
                      ...inv,
                      roots: inv.roots.map((v, k) =>
                        k === n ? e.target.value : v,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <button
              type="button"
              className="btn secondary"
              onClick={() => setInv({ ...inv, roots: [...inv.roots, ""] })}
            >
              <Plus size={15} />
              Tambahkan Akar Masalah
            </button>
          </div>
          <div>
            {inv.recommendations.map((r, n) => (
              <label className="field" key={n}>
                Rekomendasi {n + 1}
                <textarea
                  value={r}
                  onChange={(e) =>
                    setInv({
                      ...inv,
                      recommendations: inv.recommendations.map((v, k) =>
                        k === n ? e.target.value : v,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                setInv({
                  ...inv,
                  recommendations: [...inv.recommendations, ""],
                })
              }
            >
              <Plus size={15} />
              Tambahkan Rekomendasi
            </button>
          </div>
        </div>
        <div className="form-actions">
          <span className="muted">Tersimpan hanya pada browser ini.</span>
          <button className="btn primary">
            <Save size={16} />
            Simpan Investigasi
          </button>
        </div>
      </Card>
    </form>
  );
}
export function CapaEditor({ incident }: { incident: Incident }) {
  const { db, commit, log, notify } = useStore();
  const actions = db.actions.filter((a) => a.incidentId === incident.id);
  const [edit, setEdit] = useState<Action | null>(null),
    [remove, setRemove] = useState<Action | null>(null);
  const done = actions.filter((a) => a.status === "Selesai").length;
  const add = () =>
    setEdit({
      id: crypto.randomUUID(),
      incidentId: incident.id,
      problem: incident.incident.title,
      corrective: "",
      preventive: "",
      owner: "",
      unit: incident.incident.unit,
      start: today(),
      target: "",
      realized: "",
      status: "Belum Dimulai",
      evidence: "",
      evaluation: "",
      reviewer: "",
    });
  return (
    <>
      <Card
        title="Tindak Lanjut / CAPA"
        subtitle="Corrective and Preventive Action · perbaikan yang dapat dipantau"
        action={
          <button className="btn primary" onClick={add}>
            <Plus size={16} />
            Tambah CAPA
          </button>
        }
      >
        <div className="capa-summary">
          <div>
            <strong>
              {done}/{actions.length}
            </strong>
            <span>tindakan selesai</span>
          </div>
          <div className="progress">
            <i
              style={{
                width: `${actions.length ? (done / actions.length) * 100 : 0}%`,
              }}
            />
          </div>
          <b>
            {actions.length ? Math.round((done / actions.length) * 100) : 0}%
          </b>
        </div>
        {!actions.length ? (
          <Empty
            title="Belum ada tindak lanjut"
            description="Tambahkan tindakan korektif dan preventif untuk laporan ini."
          />
        ) : (
          actions.map((a) => (
            <div className="action-item" key={a.id}>
              <div className="action-item-head">
                <span
                  className={`badge ${a.status === "Selesai" ? "status-selesai" : a.target < today() ? "late-badge" : ""}`}
                >
                  {a.status !== "Selesai" && a.target < today()
                    ? "Terlambat"
                    : a.status}
                </span>
                <code>CAPA-{a.id.slice(0, 8)}</code>
                <button
                  className="icon-btn"
                  onClick={() => setEdit(a)}
                  aria-label="Edit CAPA"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => setRemove(a)}
                  aria-label="Hapus CAPA"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3>{a.corrective}</h3>
              <p>
                <b>Preventif:</b> {a.preventive}
              </p>
              <div className="action-metadata">
                <span>PIC: {a.owner}</span>
                <span>{a.unit}</span>
                <span>Target: {fmt(a.target)}</span>
              </div>
              {a.evaluation && (
                <p className="info-note">Evaluasi: {a.evaluation}</p>
              )}
            </div>
          ))
        )}
      </Card>
      {edit && (
        <Modal
          title={
            actions.some((a) => a.id === edit.id)
              ? "Edit Tindak Lanjut"
              : "Tambah Tindak Lanjut"
          }
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!actionSchema.safeParse(edit).success)
                return notify("Lengkapi data CAPA.");
              if (edit.target < edit.start)
                return notify(
                  "Target selesai tidak boleh mendahului tanggal mulai.",
                );
              if (edit.realized && edit.realized < edit.start)
                return notify(
                  "Realisasi tidak boleh mendahului tanggal mulai.",
                );
              if (
                edit.status === "Selesai" &&
                (!edit.realized ||
                  !edit.evidence.trim() ||
                  !edit.evaluation.trim() ||
                  !edit.reviewer.trim())
              )
                return notify(
                  "Tindakan selesai memerlukan tanggal realisasi, bukti, evaluasi, dan catatan reviewer.",
                );
              const exists = db.actions.some((a) => a.id === edit.id);
              if (
                commit(
                  log(
                    {
                      ...db,
                      actions: exists
                        ? db.actions.map((a) => (a.id === edit.id ? edit : a))
                        : [...db.actions, edit],
                      incidents: db.incidents.map((i) =>
                        i.id === incident.id
                          ? {
                              ...i,
                              actionIds: Array.from(
                                new Set([...i.actionIds, edit.id]),
                              ),
                            }
                          : i,
                      ),
                    },
                    `CAPA ${exists ? "diperbarui" : "ditambahkan"}: ${edit.status}`,
                    incident.id,
                  ),
                )
              ) {
                notify("Tindak lanjut tersimpan.");
                setEdit(null);
              }
            }}
          >
            <div className="form-grid">
              {(
                [
                  ["problem", "Permasalahan"],
                  ["corrective", "Tindakan korektif"],
                  ["preventive", "Tindakan preventif"],
                  ["owner", "Penanggung jawab demo"],
                  ["start", "Tanggal mulai"],
                  ["target", "Target selesai"],
                  ["realized", "Tanggal realisasi"],
                  ["evidence", "Bukti (catatan teks demo)"],
                  ["evaluation", "Evaluasi efektivitas"],
                  ["reviewer", "Catatan reviewer"],
                ] as const
              ).map(([k, l]) => (
                <label
                  className={`field ${["problem", "corrective", "preventive", "evidence", "evaluation", "reviewer"].includes(k) ? "span-2" : ""}`}
                  key={k}
                >
                  {l}
                  {["start", "target", "realized"].includes(k) ? (
                    <input
                      type="date"
                      required={k !== "realized" || edit.status === "Selesai"}
                      max={k === "realized" ? today() : undefined}
                      value={edit[k]}
                      onChange={(e) =>
                        setEdit({ ...edit, [k]: e.target.value })
                      }
                    />
                  ) : (
                    <textarea
                      required={
                        [
                          "problem",
                          "corrective",
                          "preventive",
                          "owner",
                        ].includes(k) ||
                        (edit.status === "Selesai" &&
                          ["evidence", "evaluation", "reviewer"].includes(k))
                      }
                      rows={2}
                      value={edit[k]}
                      onChange={(e) =>
                        setEdit({ ...edit, [k]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}
              <label className="field">
                Unit
                <select
                  value={edit.unit}
                  onChange={(e) => setEdit({ ...edit, unit: e.target.value })}
                >
                  {db.units.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Status
                <select
                  value={edit.status}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      status: e.target.value as Action["status"],
                    })
                  }
                >
                  {actionStatuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setEdit(null)}
              >
                Batal
              </button>
              <button className="btn primary">
                <Save size={16} />
                Simpan CAPA
              </button>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <Confirm
          danger
          title="Hapus tindakan demo?"
          description="Tindakan dan referensinya akan dihapus dari browser ini."
          onClose={() => setRemove(null)}
          onConfirm={() => {
            if (
              commit(
                log(
                  {
                    ...db,
                    actions: db.actions.filter((a) => a.id !== remove.id),
                    incidents: db.incidents.map((i) => ({
                      ...i,
                      actionIds: i.actionIds.filter((id) => id !== remove.id),
                    })),
                  },
                  "CAPA demo dihapus",
                  incident.id,
                ),
              )
            )
              setRemove(null);
          }}
        />
      )}
    </>
  );
}

export function VerificationEditor({ incident }: { incident: Incident }) {
  const { db, upsert, notify } = useStore();
  const [kind, setKind] = useState(incident.incident.kind),
    [sentinel, setSentinel] = useState(incident.incident.sentinel),
    [reason, setReason] = useState("");
  const allowed = ["Kepala unit", "Tim Keselamatan Pasien"].includes(
    db.settings.role,
  );
  return (
    <Card
      title="Verifikasi Klasifikasi"
      subtitle="Penilaian petugas berwenang · simulasi UI"
    >
      <form
        className="verification-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!allowed) return;
          const next = {
            ...incident,
            incident: { ...incident.incident, kind, sentinel },
            updatedAt: new Date().toISOString(),
          };
          if (
            upsert(
              next,
              `Klasifikasi diverifikasi: ${kind}, ${sentinel}. Catatan: ${reason}`,
            )
          ) {
            notify("Klasifikasi insiden tersimpan.");
            setReason("");
          }
        }}
      >
        <fieldset disabled={!allowed} className="unstyled">
          <label className="field">
            Jenis insiden hasil verifikasi
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {["KPC", "KNC", "KTC", "KTD"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Status sentinel hasil verifikasi
            <select
              value={sentinel}
              onChange={(e) => setSentinel(e.target.value)}
            >
              {[
                "Belum ditentukan",
                "Suspek kejadian sentinel",
                "Sentinel terkonfirmasi",
              ].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Catatan verifikator demo
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button className="btn primary full-width">
            <Save size={15} />
            Simpan Klasifikasi
          </button>
        </fieldset>
        {!allowed && (
          <p className="muted small">
            Gunakan role simulasi Kepala unit atau Tim Keselamatan Pasien.
          </p>
        )}
      </form>
    </Card>
  );
}
