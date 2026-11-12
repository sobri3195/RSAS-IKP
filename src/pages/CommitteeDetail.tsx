import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Save, Plus, Download } from "lucide-react";
import { api, json, downloadApi } from "../services/api";
import { Card } from "../components/ui";
import {
  reportKinds,
  statusNames,
  transitions,
  reviewInput,
  type ReportDetail,
  type ReviewInput,
} from "../../shared/report";

export default function CommitteeDetail() {
  const { id } = useParams(),
    [report, setReport] = useState<ReportDetail | null>(null),
    [review, setReview] = useState<ReviewInput | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const row = await api<ReportDetail>(`/committee/reports/${id}`);
      setReport(row);
      setReview({
        version: row.version,
        status: row.status,
        kind: row.kind,
        category: row.category,
        note: "",
        risk: row.data.risk,
        investigation: row.data.investigation,
        actions: row.data.actions,
      });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    setReport(null);
    setReview(null);
    void load();
  }, [id]);
  if (!report || !review)
    return <p role="status">{error || "Memuat laporan dari server…"}</p>;
  const locked = ["closed", "archived"].includes(report.status);
  const inv = review.investigation;
  const updateInv = (key: keyof typeof inv, value: unknown) =>
    setReview({ ...review, investigation: { ...inv, [key]: value } });
  return (
    <>
      <Link className="text-link" to="/komite/dashboard">
        ← Kembali ke daftar laporan
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            LAPORAN INTERNAL · VERSI {report.version}
          </div>
          <h1>{report.number}</h1>
          <p>
            {statusNames[report.status]} · diterima{" "}
            {new Date(report.created_at).toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
            })}{" "}
            WIB
          </p>
        </div>
      </div>
      <Card title="Informasi laporan">
        <dl className="report-review">
          {[
            [
              "Tanggal kejadian",
              `${report.data.incidentDate} ${report.data.incidentTime} WIB`,
            ],
            ["Tanggal ditemukan", report.data.discoveredDate],
            ["Unit", report.unit],
            ["Lokasi", report.data.location],
            ["Pelayanan", report.data.service],
            ["Kronologi", report.data.chronology],
            ["Penemuan", report.data.discovery],
            ["Kondisi pasien", report.data.patientCondition],
            ["Dampak", report.data.impact],
            ["Tindakan awal", report.data.immediateAction],
            ["Atasan diberi tahu", report.data.supervisorNotified],
            ["Referensi pasien", report.data.patientReference],
            ["Nomor rekam medis", report.data.medicalNumber],
            ["Faktor kontribusi", report.data.contributingFactors],
            ["Pelapor", report.data.reporterName],
            ["Jabatan", report.data.reporterTitle],
            ["Kontak tindak lanjut", report.data.contact],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "Tidak diberikan"}</dd>
            </div>
          ))}
        </dl>
        {report.files.map((f) => (
          <button
            key={f.id}
            className="btn secondary"
            onClick={() =>
              downloadApi(
                `/committee/reports/${id}/files/${f.id}`,
                f.name,
              ).catch((e) => setError(e.message))
            }
          >
            <Download size={16} />
            {f.name}
          </button>
        ))}
        {!locked && (
          <label className="field">
            Unggah bukti foto (PNG/JPEG, maksimum 1 MB, jika diizinkan kebijakan
            RS)
            <input
              type="file"
              accept="image/png,image/jpeg"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (
                  file.size > 1_000_000 ||
                  !["image/png", "image/jpeg"].includes(file.type)
                ) {
                  setError("Pilih foto PNG/JPEG maksimum 1 MB.");
                  return;
                }
                if (
                  !window.confirm(
                    "Unggah foto dan muat ulang laporan? Simpan isian review yang belum tersimpan terlebih dahulu.",
                  )
                )
                  return;
                setBusy(true);
                try {
                  const base64 = await new Promise<string>(
                    (resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () =>
                        resolve(String(reader.result).split(",")[1]);
                      reader.onerror = reject;
                      reader.readAsDataURL(file);
                    },
                  );
                  await api(
                    `/committee/reports/${id}/files`,
                    json("POST", {
                      version: report.version,
                      file: { name: file.name, mime: file.type, base64 },
                    }),
                  );
                  await load();
                  setMessage(
                    "Bukti foto tersimpan privat dan dicatat di audit.",
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
        )}
        {report.data.legacy != null && (
          <details>
            <summary>Data asal impor (tersimpan utuh)</summary>
            <pre className="legacy-record">
              {JSON.stringify(report.data.legacy, null, 2)}
            </pre>
          </details>
        )}
      </Card>
      {error && (
        <p className="warning-note" role="alert">
          {error}
          <button className="btn secondary" onClick={() => void load()}>
            Muat ulang laporan
          </button>
        </p>
      )}
      {message && (
        <p className="info-note" role="status">
          {message}
        </p>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setMessage("");
          const result = reviewInput.safeParse(review);
          if (!result.success) {
            setError(result.error.issues.map((i) => i.message).join(" "));
            return;
          }
          setBusy(true);
          try {
            await api(`/committee/reports/${id}`, json("PATCH", result.data));
            setMessage("Perubahan tersimpan di server dengan audit trail.");
            await load();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Card title="Validasi & klasifikasi">
          <div className="form-grid">
            <label className="field">
              Status
              <select
                aria-label="Status"
                value={review.status}
                disabled={report.status === "archived"}
                onChange={(e) =>
                  setReview({
                    ...review,
                    status: e.target.value as ReviewInput["status"],
                  })
                }
              >
                {[report.status, ...transitions[report.status]].map((s) => (
                  <option key={s} value={s}>
                    {statusNames[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Jenis insiden terverifikasi
              <select
                disabled={locked}
                value={review.kind}
                onChange={(e) =>
                  setReview({
                    ...review,
                    kind: e.target.value as ReviewInput["kind"],
                  })
                }
              >
                {reportKinds.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Kategori insiden
              <input
                disabled={locked}
                required
                maxLength={120}
                value={review.category}
                onChange={(e) =>
                  setReview({ ...review, category: e.target.value })
                }
              />
            </label>
            <label className="field span-2">
              Catatan validasi / alasan perubahan / koreksi terotorisasi
              <textarea
                required
                maxLength={2000}
                value={review.note}
                onChange={(e) => setReview({ ...review, note: e.target.value })}
              />
            </label>
          </div>
          <p className="muted small">
            Pengembalian memakai status Perlu perbaikan. Pelapor hanya dapat
            memantau status; koordinasikan koreksi melalui kanal institusi.
            Seluruh perubahan dicatat oleh server.
          </p>
        </Card>
        {["under_review", "needs_revision"].includes(report.status) && (
          <Card title="Koreksi terotorisasi">
            <p className="info-note">
              Koreksi oleh Komite Mutu berdasarkan klarifikasi pelapor. Isian
              asli dipertahankan dalam riwayat terenkripsi. Cantumkan sumber
              klarifikasi pada catatan validasi.
            </p>
            <div className="form-grid">
              {(
                [
                  ["chronology", "Koreksi kronologi"],
                  ["discovery", "Koreksi penemuan"],
                  ["patientCondition", "Koreksi kondisi pasien"],
                  ["impact", "Koreksi dampak"],
                  ["immediateAction", "Koreksi tindakan awal"],
                  ["patientReference", "Koreksi referensi pasien"],
                  ["medicalNumber", "Koreksi nomor rekam medis"],
                ] as const
              ).map(([key, label]) => (
                <label className="field" key={key}>
                  {label}
                  <textarea
                    maxLength={
                      key === "chronology"
                        ? 10000
                        : key === "patientReference"
                          ? 120
                          : key === "medicalNumber"
                            ? 100
                            : 2000
                    }
                    value={review.corrections?.[key] ?? report.data[key]}
                    onChange={(e) =>
                      setReview({
                        ...review,
                        corrections: {
                          ...review.corrections,
                          [key]: e.target.value,
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </Card>
        )}
        <fieldset disabled={locked} className="unstyled">
          <Card title="Grading risiko manual">
            <p className="info-note">
              Matriks resmi belum dikonfigurasi. Penilaian ditetapkan Komite
              Mutu; tidak ada skor otomatis.
            </p>
            <div className="form-grid">
              <label className="field">
                Grading
                <select
                  value={review.risk.grade || ""}
                  onChange={(e) =>
                    setReview({
                      ...review,
                      risk: {
                        ...review.risk,
                        grade: (e.target.value ||
                          null) as ReviewInput["risk"]["grade"],
                      },
                    })
                  }
                >
                  <option value="">Belum dinilai</option>
                  {["BIRU", "HIJAU", "KUNING", "MERAH"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
              {(
                [
                  ["impact", "Dampak penilaian"],
                  ["probability", "Probabilitas"],
                  ["reason", "Alasan grading"],
                ] as const
              ).map(([key, label]) => (
                <label className="field" key={key}>
                  {label}
                  <textarea
                    maxLength={2000}
                    value={review.risk[key]}
                    onChange={(e) =>
                      setReview({
                        ...review,
                        risk: { ...review.risk, [key]: e.target.value },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </Card>
          <Card title="Investigasi & Root Cause Analysis">
            <div className="form-grid">
              <label className="field">
                PIC investigasi
                <input
                  maxLength={120}
                  value={inv.owner}
                  onChange={(e) => updateInv("owner", e.target.value)}
                />
              </label>
              <label className="field">
                Tenggat investigasi / RCA
                <input
                  type="date"
                  value={inv.deadline}
                  onChange={(e) => updateInv("deadline", e.target.value)}
                />
              </label>
              {(
                [
                  ["summary", "Ringkasan investigasi"],
                  ["facts", "Fakta dan bukti"],
                  ["timeline", "Timeline"],
                  ["roots", "Akar masalah"],
                  ["recommendations", "Rekomendasi"],
                ] as const
              ).map(([key, label]) => (
                <label className="field span-2" key={key}>
                  {label}
                  <textarea
                    maxLength={10000}
                    value={inv[key]}
                    onChange={(e) => updateInv(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <h3>Five Whys</h3>
            <div className="form-grid">
              {inv.whys.map((w, i) => (
                <label className="field" key={i}>
                  Mengapa {i + 1}?
                  <textarea
                    maxLength={2000}
                    value={w}
                    onChange={(e) =>
                      updateInv(
                        "whys",
                        inv.whys.map((v, n) => (n === i ? e.target.value : v)),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <h3>Fishbone · faktor kontribusi</h3>
            <div className="form-grid">
              {Object.entries(inv.fishbone).map(([key, value]) => (
                <label className="field capitalize" key={key}>
                  {key}
                  <textarea
                    maxLength={2000}
                    value={value}
                    onChange={(e) =>
                      updateInv("fishbone", {
                        ...inv.fishbone,
                        [key]: e.target.value,
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </Card>
          <Card title="Tindakan korektif dan preventif (CAPA)">
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                setReview({
                  ...review,
                  actions: [
                    ...review.actions,
                    {
                      id: crypto.randomUUID(),
                      corrective: "",
                      preventive: "",
                      owner: "",
                      deadline: "",
                      done: false,
                      evidence: "",
                      evaluation: "",
                      reviewer: "",
                    },
                  ],
                })
              }
            >
              <Plus size={16} />
              Tambah tindakan
            </button>
            {review.actions.map((a, index) => (
              <div className="secure-action" key={a.id}>
                <h3>Tindakan {index + 1}</h3>
                <div className="form-grid">
                  {(
                    [
                      ["corrective", "Tindakan korektif"],
                      ["preventive", "Tindakan preventif"],
                      ["owner", "PIC tindakan"],
                      ["deadline", "Tenggat tindakan"],
                      ["evidence", "Bukti tindak lanjut"],
                      ["evaluation", "Evaluasi efektivitas"],
                      ["reviewer", "Reviewer"],
                    ] as const
                  ).map(([key, label]) => (
                    <label className="field" key={key}>
                      {label}
                      <input
                        type={key === "deadline" ? "date" : "text"}
                        maxLength={
                          key === "owner" || key === "reviewer" ? 120 : 4000
                        }
                        value={a[key]}
                        onChange={(e) =>
                          setReview({
                            ...review,
                            actions: review.actions.map((v) =>
                              v.id === a.id
                                ? { ...v, [key]: e.target.value }
                                : v,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={a.done}
                      onChange={(e) =>
                        setReview({
                          ...review,
                          actions: review.actions.map((v) =>
                            v.id === a.id
                              ? { ...v, done: e.target.checked }
                              : v,
                          ),
                        })
                      }
                    />
                    Tindakan selesai dan dievaluasi
                  </label>
                </div>
              </div>
            ))}
          </Card>
        </fieldset>
        <div className="report-form-actions">
          <Link className="btn secondary" to={`/komite/audit?reportId=${id}`}>
            Lihat audit laporan
          </Link>
          <button
            className="btn primary"
            disabled={busy || report.status === "archived"}
          >
            <Save size={16} />
            {busy ? "Menyimpan…" : "Simpan validasi & tindak lanjut"}
          </button>
        </div>
      </form>
    </>
  );
}
