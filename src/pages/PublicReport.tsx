import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "../components/ui";
import { api, json, ApiError, downloadBlob } from "../services/api";
import {
  newReport,
  reportInput,
  reportKinds,
  statusNames,
  type ReportInput,
  type ReportStatus,
} from "../../shared/report";
import "../styles/secure.css";

const steps = [
  "Informasi kejadian",
  "Detail kejadian",
  "Informasi pendukung",
  "Konfirmasi & kirim",
];
const stepFields = [
  [
    "incidentDate",
    "incidentTime",
    "discoveredDate",
    "unit",
    "location",
    "service",
    "kind",
    "category",
  ],
  [
    "chronology",
    "discovery",
    "patientCondition",
    "impact",
    "immediateAction",
    "supervisorNotified",
  ],
  [
    "patientReference",
    "medicalNumber",
    "contributingFactors",
    "reporterName",
    "reporterTitle",
    "contact",
  ],
  ["factual"],
];
const labels: Record<keyof ReportInput, string> = {
  incidentDate: "Tanggal kejadian",
  incidentTime: "Jam kejadian (WIB)",
  discoveredDate: "Tanggal ditemukan",
  unit: "Unit pelapor",
  location: "Lokasi kejadian",
  service: "Jenis pelayanan",
  kind: "Jenis insiden",
  category: "Kategori insiden",
  chronology: "Kronologi / apa yang terjadi?",
  discovery: "Bagaimana kejadian ditemukan?",
  patientCondition: "Kondisi pasien setelah kejadian",
  impact: "Dampak atau cedera",
  immediateAction: "Tindakan awal yang telah dilakukan",
  supervisorNotified: "Sudah dilaporkan kepada atasan langsung?",
  patientReference: "Referensi pasien minimal (jika diperlukan SOP)",
  medicalNumber: "Nomor rekam medis (hanya jika diperlukan)",
  contributingFactors: "Faktor kontribusi awal",
  reporterName: "Nama pelapor (opsional)",
  reporterTitle: "Jabatan pelapor (opsional)",
  contact: "Kontak tindak lanjut (opsional)",
  factual: "Laporan dibuat berdasarkan fakta yang saya ketahui.",
};
// Deliberately memory-only. No clinical drafts, file bytes or credentials enter browser storage.
let memoryDraft: ReportInput | null = null;
type Receipt = { number: string; trackingCode: string; receivedAt: string };
export function PublicHeader() {
  return (
    <header className="public-brand">
      <Logo />
      <div>
        <small>RSAU PROF. DR. ABDULRACHMAN SALEH</small>
        <strong>RSAS-SAFETY</strong>
        <span>Sistem Pelaporan Insiden Keselamatan Pasien</span>
      </div>
    </header>
  );
}
export default function PublicReport() {
  const [params] = useSearchParams();
  const [form, setForm] = useState<ReportInput>(
    () =>
      memoryDraft || {
        ...newReport(),
        unit: "",
      },
  );
  const [config, setConfig] = useState<{
      challenge: string;
      attachments: boolean;
      units: { id: string; name: string }[];
    } | null>(null),
    [step, setStep] = useState(0);
  const [error, setError] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState<Receipt | null>(null),
    [saved, setSaved] = useState(false),
    [files, setFiles] = useState<File[]>([]);
  const [website, setWebsite] = useState(""),
    idem = useRef(crypto.randomUUID()),
    heading = useRef<HTMLHeadingElement>(null);
  const refreshConfig = () =>
    api<{
      challenge: string;
      attachments: boolean;
      units: { id: string; name: string }[];
    }>("/public/config")
      .then((value) => {
        setConfig(value);
        const unit = params.get("unit");
        if (unit && value.units.some((u) => u.id === unit))
          setForm((previous) =>
            previous.unit ? previous : { ...previous, unit },
          );
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    void refreshConfig();
  }, []);
  useEffect(() => {
    setSaved(false);
    const timer = setTimeout(() => {
      memoryDraft = form;
      setSaved(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [form]);
  useEffect(() => {
    heading.current?.focus();
  }, [step, receipt]);
  const units = config?.units || [];
  const set = (key: keyof ReportInput, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  function validate(current: number) {
    const result = reportInput.safeParse(form),
      messages: Record<string, string> = {};
    if (!result.success)
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (stepFields[current].includes(key)) messages[key] = issue.message;
      }
    setErrors(messages);
    return !Object.keys(messages).length;
  }
  async function submit() {
    const parsed = reportInput.safeParse(form);
    if (!parsed.success) {
      const issue = parsed.error.issues[0],
        key = String(issue.path[0]);
      setStep(
        Math.max(
          0,
          stepFields.findIndex((s) => s.includes(key)),
        ),
      );
      setErrors({ [key]: issue.message });
      return;
    }
    if (!config || busy) return;
    setBusy(true);
    setError("");
    try {
      const uploads = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          mime: f.type,
          base64: await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          }),
        })),
      );
      const result = await api<Receipt>(
        "/public/reports",
        json("POST", {
          report: parsed.data,
          idempotencyKey: idem.current,
          challenge: config.challenge,
          website,
          files: uploads,
        }),
      );
      memoryDraft = null;
      setForm(newReport());
      setFiles([]);
      setReceipt(result);
    } catch (e) {
      const err = e as ApiError;
      setError(
        err.message || "Berkas tidak dapat dibaca. Periksa dan coba kembali.",
      );
      if (err.issues?.length)
        setErrors(
          Object.fromEntries(
            err.issues.map((i) => [i.path.replace("report.", ""), i.message]),
          ),
        );
      if (err.status === 400) void refreshConfig();
    } finally {
      setBusy(false);
    }
  }
  function field(
    key: keyof ReportInput,
    type = "text",
    options?: readonly string[] | readonly { id: string; name: string }[],
  ) {
    return (
      <label
        className={`field ${["chronology", "immediateAction", "contributingFactors"].includes(key) ? "span-2" : ""}`}
        key={key}
      >
        <span>
          {labels[key]}
          {stepFields[0].includes(key) || stepFields[1].includes(key)
            ? " *"
            : ""}
        </span>
        {options ? (
          <select
            aria-invalid={!!errors[key]}
            value={String(form[key])}
            onChange={(e) => set(key, e.target.value)}
          >
            <option value="">Pilih…</option>
            {options.map((o) =>
              typeof o === "string" ? (
                <option key={o}>{o}</option>
              ) : (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ),
            )}
          </select>
        ) : type === "textarea" ? (
          <textarea
            aria-invalid={!!errors[key]}
            maxLength={key === "chronology" ? 10000 : 2000}
            rows={4}
            value={String(form[key])}
            onChange={(e) => set(key, e.target.value)}
          />
        ) : (
          <input
            type={type}
            aria-invalid={!!errors[key]}
            autoComplete="off"
            maxLength={200}
            value={String(form[key])}
            onChange={(e) => set(key, e.target.value)}
          />
        )}
        {errors[key] && <small className="field-error">{errors[key]}</small>}
      </label>
    );
  }
  return (
    <div className="public-page">
      <PublicHeader />
      <main className="report-shell">
        {receipt ? (
          <section className="card receipt">
            <CheckCircle2 size={48} />
            <p className="eyebrow">LAPORAN DITERIMA</p>
            <h1 ref={heading} tabIndex={-1}>
              Terima kasih telah melaporkan.
            </h1>
            <p>Komite Mutu akan meninjau laporan Anda.</p>
            <dl>
              <dt>Nomor laporan</dt>
              <dd>{receipt.number}</dd>
              <dt>Kode pelacakan rahasia</dt>
              <dd className="tracking-code">{receipt.trackingCode}</dd>
              <dt>Diterima</dt>
              <dd>
                {new Date(receipt.receivedAt).toLocaleString("id-ID", {
                  timeZone: "Asia/Jakarta",
                })}{" "}
                WIB
              </dd>
            </dl>
            <p>
              Simpan kode ini secara pribadi. Bukti penerimaan tidak memuat data
              pasien.
            </p>
            <div className="button-row">
              <button
                className="btn secondary"
                onClick={() =>
                  downloadBlob(
                    new Blob(
                      [
                        `RSAS-SAFETY\n${receipt.number}\nKode pelacakan: ${receipt.trackingCode}\nDiterima: ${receipt.receivedAt}\nSimpan kode secara pribadi.`,
                      ],
                      { type: "text/plain" },
                    ),
                    "bukti-penerimaan-ikp.txt",
                  )
                }
              >
                <Download size={16} />
                Simpan bukti penerimaan
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  idem.current = crypto.randomUUID();
                  setReceipt(null);
                  setStep(0);
                  void refreshConfig();
                }}
              >
                Buat Laporan Baru
              </button>
            </div>
            <Link className="text-link" to="/lacak">
              Cek status laporan
            </Link>
          </section>
        ) : (
          <>
            <div className="report-intro">
              <span className="eyebrow">
                <ShieldCheck size={16} /> PELAPORAN TANPA LOGIN
              </span>
              <h1>
                Laporkan untuk pelayanan
                <br />
                yang lebih aman.
              </h1>
              <p>
                Setiap laporan membantu kami belajar dan memperbaiki pelayanan.
                Isi sesuai fakta yang Anda ketahui.
              </p>
            </div>
            <ol className="report-steps" aria-label="Progres formulir">
              {steps.map((s, i) => (
                <li
                  key={s}
                  aria-current={step === i ? "step" : undefined}
                  className={i <= step ? "active" : ""}
                >
                  <span>{i < step ? "✓" : i + 1}</span>
                  <b>{s}</b>
                </li>
              ))}
            </ol>
            <form
              className="card public-form"
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                if (step < 3) {
                  if (validate(step)) setStep(step + 1);
                } else void submit();
              }}
            >
              <div className="form-section-heading">
                <span>LANGKAH {step + 1} DARI 4</span>
                <h2 ref={heading} tabIndex={-1}>
                  {steps[step]}
                </h2>
                <p>
                  {step === 2
                    ? "Isi identitas minimal yang diperlukan SOP. Kolom pendukung bersifat opsional."
                    : "Kolom bertanda * wajib diisi."}
                </p>
              </div>
              {error && (
                <p className="warning-note" role="alert">
                  {error}
                </p>
              )}
              <div className="form-grid">
                {step === 0 && (
                  <>
                    {field("incidentDate", "date")}
                    {field("incidentTime", "time")}
                    {field("discoveredDate", "date")}
                    <div className="info-note">
                      Tanggal pelaporan dicatat otomatis oleh server setelah
                      diterima.
                    </div>
                    {field("unit", "text", units)}
                    {field("location")}
                    {field("service", "text", [
                      "Rawat jalan",
                      "Rawat inap",
                      "Gawat darurat",
                      "Penunjang",
                      "Lainnya",
                    ])}
                    {field("kind", "text", reportKinds)}
                    {field("category", "text", [
                      "Obat",
                      "Identifikasi pasien",
                      "Jatuh",
                      "Infeksi",
                      "Prosedur",
                      "Alat medis",
                      "Komunikasi",
                      "Lainnya",
                    ])}
                  </>
                )}
                {step === 1 && (
                  <>
                    {field("chronology", "textarea")}
                    {field("discovery", "textarea")}
                    {field("patientCondition", "textarea")}
                    {field("impact", "textarea")}
                    {field("immediateAction", "textarea")}
                    {field("supervisorNotified", "text", [
                      "Ya",
                      "Tidak",
                      "Belum",
                    ])}
                  </>
                )}
                {step === 2 && (
                  <>
                    {field("patientReference")}
                    {field("medicalNumber")}
                    {field("contributingFactors", "textarea")}
                    {field("reporterName")}
                    {field("reporterTitle")}
                    {field("contact")}
                    {config?.attachments ? (
                      <label className="field span-2">
                        Lampiran foto sesuai kebijakan RS (opsional, maksimal 3
                        PNG/JPEG, 1 MB/foto)
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          multiple
                          onChange={(e) => {
                            const chosen = Array.from(e.target.files || []);
                            if (
                              chosen.length > 3 ||
                              chosen.some(
                                (f) =>
                                  f.size > 1000000 ||
                                  !["image/png", "image/jpeg"].includes(f.type),
                              )
                            ) {
                              setError(
                                "Pilih maksimal 3 foto PNG/JPEG, 1 MB per foto.",
                              );
                              e.target.value = "";
                              return;
                            }
                            setFiles(chosen);
                            setError("");
                          }}
                        />
                      </label>
                    ) : (
                      <p className="info-note span-2">
                        Lampiran belum diaktifkan sesuai kebijakan RS. Catat
                        informasi pendukung yang diperlukan pada formulir.
                      </p>
                    )}
                  </>
                )}
                {step === 3 && (
                  <>
                    <dl className="report-review span-2">
                      {Object.entries(form)
                        .filter(([k, v]) => k !== "factual" && v)
                        .map(([k, v]) => (
                          <div key={k}>
                            <dt>{labels[k as keyof ReportInput]}</dt>
                            <dd>
                              {k === "unit"
                                ? units.find((u) => u.id === v)?.name
                                : v}
                            </dd>
                          </div>
                        ))}
                      {files.length > 0 && (
                        <div>
                          <dt>Lampiran foto</dt>
                          <dd>{files.length} foto</dd>
                        </div>
                      )}
                    </dl>
                    <label className="check-label span-2">
                      <input
                        type="checkbox"
                        checked={form.factual}
                        onChange={(e) => set("factual", e.target.checked)}
                      />
                      {labels.factual}
                    </label>
                    {errors.factual && (
                      <p className="field-error">{errors.factual}</p>
                    )}
                  </>
                )}
              </div>
              <label className="honeypot" aria-hidden="true">
                Website
                <input
                  tabIndex={-1}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
              <div className="report-form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  disabled={step === 0 || busy}
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft size={16} />
                  Sebelumnya
                </button>
                <button className="btn primary" disabled={busy || !config}>
                  {step === 3 ? (
                    <>
                      <ClipboardCheck size={18} />
                      {busy ? "Mengirim…" : "KIRIM LAPORAN IKP"}
                    </>
                  ) : (
                    <>
                      Berikutnya
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
            <div className="draft-note" role="status">
              <ShieldCheck size={16} />
              <span>
                {saved
                  ? "Draft sementara diperbarui di memori."
                  : "Memperbarui draft sementara…"}{" "}
                Isian tidak disimpan di browser secara persisten dan akan hilang
                saat halaman dimuat ulang.
              </span>
            </div>
            <footer className="public-footer">
              <span>RSAS · Quality & Patient Safety</span>
              <Link to="/lacak">Cek status dengan kode pelacakan</Link>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
export function TrackReport() {
  const [code, setCode] = useState(""),
    [result, setResult] = useState<{
      number: string;
      status: ReportStatus;
      updated_at: string;
    } | null>(null),
    [error, setError] = useState("");
  return (
    <div className="public-page">
      <PublicHeader />
      <main className="report-shell narrow">
        <form
          className="card public-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setResult(null);
            try {
              setResult(
                await api("/public/track", json("POST", { code: code.trim() })),
              );
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <h1>Cek status laporan</h1>
          <p>Hanya nomor, status, dan waktu pembaruan yang ditampilkan.</p>
          <label className="field">
            Kode pelacakan rahasia
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button className="btn primary">Cek status</button>
          {error && (
            <p className="warning-note" role="alert">
              {error}
            </p>
          )}
          {result && (
            <div className="info-note" role="status">
              {result.number} · {statusNames[result.status]} ·{" "}
              {new Date(result.updated_at).toLocaleDateString("id-ID")}
            </div>
          )}
          <Link to="/lapor" className="text-link">
            Kembali ke formulir
          </Link>
        </form>
      </main>
    </div>
  );
}
