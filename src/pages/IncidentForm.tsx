import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Check,
  ShieldCheck,
  UserRound,
  FileText,
  Users,
  MapPin,
  HeartPulse,
  ListChecks,
  PenLine,
  ClipboardCheck,
  Printer,
} from "lucide-react";
import { useStore } from "../app/store";
import {
  emptyForm,
  formSchema,
  stepFields,
  type FormData,
  type Incident,
} from "../schemas/models";
import { makeIncident, today } from "../utils/domain";
import { Card, PageHeading, Empty, Confirm } from "../components/ui";
import {
  PrintSheet,
  questionValues,
  questionLabels,
} from "../components/print";
const steps = [
  ["Data Pasien", UserRound],
  ["Rincian Kejadian", FileText],
  ["Pelapor & Target", Users],
  ["Tempat & Unit", MapPin],
  ["Dampak Insiden", HeartPulse],
  ["Tindakan", ListChecks],
  ["Pengesahan", PenLine],
  ["Review & Kirim", ClipboardCheck],
] as const;
export default function IncidentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const latest = useRef(store);
  latest.current = store;
  const existing = store.db.incidents.find((i) => i.id === id);
  const savedRef = useRef<Incident | undefined>(existing);
  const sent = useRef(false);
  const [step, setStep] = useState(0),
    [confirm, setConfirm] = useState(false),
    [saving, setSaving] = useState(""),
    [certify, setCertify] = useState(false);
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: existing?.incident ?? {
      ...emptyForm(),
      target: "Pasien",
      sentinel: "Belum ditentukan",
      reportDate: today(),
      receivedDate: today(),
    },
  });
  const values = useWatch({ control }) as FormData;
  const persist = (status: "DRAFT" | "DILAPORKAN", quiet = false) => {
    // A queued debounce can fire while a lazy route is loading after submission.
    // Never allow that draft write to downgrade an already submitted report.
    if (status === "DRAFT" && sent.current) return null;
    const s = latest.current;
    const i = makeIncident(
      getValues(),
      s.db.incidents,
      status,
      savedRef.current,
    );
    if (
      s.upsert(
        i,
        status === "DRAFT" ? "Draft demo disimpan" : "Laporan demo dikirim",
      )
    ) {
      savedRef.current = i;
      setSaving(
        `Tersimpan ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
      );
      if (!quiet)
        s.notify(
          status === "DRAFT"
            ? "Draft berhasil disimpan."
            : "Laporan demo berhasil dikirim.",
        );
      return i;
    }
    return null;
  };
  const serialized = JSON.stringify(values);
  useEffect(() => {
    if (sent.current || (!values.patientName && !values.title)) return;
    if (
      savedRef.current &&
      serialized === JSON.stringify(savedRef.current.incident)
    )
      return;
    const timer = setTimeout(() => persist("DRAFT", true), 1400);
    return () => clearTimeout(timer);
  }, [serialized]);
  if (id && !existing)
    return (
      <Empty title="Draft tidak ditemukan">
        <Link className="btn primary" to="/laporan">
          Kembali ke laporan
        </Link>
      </Empty>
    );
  if (
    existing &&
    !["DRAFT", "DIKEMBALIKAN_UNTUK_REVISI"].includes(existing.status)
  )
    return (
      <Empty
        title="Laporan sudah dikirim"
        description="Buka detail untuk memproses laporan."
      >
        <Link className="btn primary" to={`/laporan/${existing.id}`}>
          Buka detail
        </Link>
      </Empty>
    );
  const field = (
    name: keyof FormData,
    label: string,
    options?: string[],
    type = "text",
    wide = false,
  ) => (
    <label className={`field ${wide ? "span-2" : ""}`} key={name}>
      <span>
        {label}
        {stepFields[step]?.includes(name) &&
          !(step === 0 && values.target !== "Pasien") &&
          ![
            "team",
            "previousUnit",
            "previousDate",
            "previousDescription",
            "prevention",
          ].includes(name) && <em> *</em>}
      </span>
      {type === "textarea" ? (
        <textarea rows={4} {...register(name)} aria-invalid={!!errors[name]} />
      ) : options ? (
        <select {...register(name)} aria-invalid={!!errors[name]}>
          <option value="">
            Pilih {label.toLowerCase().replace(/^\d+\. /, "")}
          </option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          {...register(name)}
          aria-invalid={!!errors[name]}
          min={type === "number" ? 0 : undefined}
        />
      )}
      {errors[name] && (
        <small className="field-error">{errors[name]?.message}</small>
      )}
    </label>
  );
  const unitOpts = [...store.db.units, "Lain-lain"];
  async function next() {
    const fields = [
      ...stepFields[step],
      ...(step === 0 ? (["ageYears", "ageMonths", "dateReason"] as const) : []),
      ...(step === 3 ? (["otherUnit"] as const) : []),
    ];
    if (await trigger(fields)) {
      setStep((s) => Math.min(7, s + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  return (
    <>
      <PageHeading
        title={id ? "Lanjutkan Laporan Insiden" : "Buat Laporan Insiden"}
        description="Pencatatan yang lengkap membantu kita belajar dan mencegah kejadian berulang."
      >
        <Link className="btn secondary" to="/laporan">
          <ChevronLeft size={16} />
          Kembali
        </Link>
      </PageHeading>
      <div className="form-notice">
        <ShieldCheck size={22} />
        <div>
          <b>RAHASIA — LAPORAN INTERNAL · DATA DEMO</b>
          <p>
            Pelaporan maksimal 2 × 24 jam. Gunakan hanya identitas fiktif. Paraf
            adalah konfirmasi simulasi.
          </p>
        </div>
        <span>{saving || "Draft disimpan otomatis"}</span>
      </div>
      <div className="wizard-layout">
        <aside className="wizard-steps">
          {steps.map(([label, Icon], n) => (
            <button
              type="button"
              className={`${n === step ? "current" : ""} ${n < step ? "complete" : ""}`}
              key={label}
              onClick={() => {
                if (n < step) setStep(n);
              }}
              disabled={n > step}
            >
              <span>{n < step ? <Check size={15} /> : <Icon size={16} />}</span>
              <div>
                <small>LANGKAH {n + 1}</small>
                <b>{label}</b>
              </div>
              {n === step && <ChevronRight size={14} />}
            </button>
          ))}
          <div className="wizard-help">
            <ShieldCheck size={21} />
            <b>Budaya adil & terbuka</b>
            <p>Fokus pada pembelajaran dan perbaikan sistem.</p>
            <Link to="/bantuan">Baca panduan pelaporan ↗</Link>
          </div>
        </aside>
        <form
          noValidate
          onSubmit={
            step < 7
              ? (e) => {
                  e.preventDefault();
                  next();
                }
              : handleSubmit(
                  () => setConfirm(true),
                  (errs) => {
                    const first = Object.keys(errs)[0];
                    const n = stepFields.findIndex((a) =>
                      a.includes(first as keyof FormData),
                    );
                    setStep(n < 0 ? 0 : n);
                    store.notify("Periksa kolom yang wajib diisi.");
                  },
                )
          }
        >
          <Card className="form-card">
            <div className="form-card-title">
              <span>
                FORMULIR LAPORAN INSIDEN · TIM KESELAMATAN PASIEN RSAS
              </span>
              <h2>{steps[step][0]}</h2>
              <p>
                Langkah {step + 1} dari 8 <span>·</span> Tanda <em>*</em> wajib
                diisi saat pengiriman.
              </p>
            </div>
            <div className="form-grid">
              {step === 0 && (
                <>
                  <label className="checkbox-field span-2">
                    <input
                      type="checkbox"
                      checked={values.target !== "Pasien"}
                      onChange={(e) =>
                        setValue(
                          "target",
                          e.target.checked ? "Karyawan" : "Pasien",
                        )
                      }
                    />
                    Laporan ini tidak menyangkut pasien (data pasien tidak
                    wajib).
                  </label>
                  {values.target !== "Pasien" && (
                    <div className="warning-note span-2">
                      Insiden non-pasien mungkin perlu diarahkan ke mekanisme K3
                      RS sesuai SOP. Lewati kolom data pasien yang tidak
                      relevan.
                    </div>
                  )}
                  {field("patientName", "Nama pasien fiktif")}
                  {field("medicalNumber", "Nomor rekam medis demo")}
                  {field("room", "Ruangan")}
                  {field("gender", "Jenis kelamin", ["Laki-laki", "Perempuan"])}
                  {field("ageYears", "Umur (tahun)", undefined, "number")}
                  {field("ageMonths", "Umur (bulan)", undefined, "number")}
                  {field("ageGroup", "Kelompok umur", [
                    "0–1 bulan",
                    ">1 bulan–1 tahun",
                    ">1 tahun–5 tahun",
                    ">5 tahun–15 tahun",
                    ">15 tahun–30 tahun",
                    ">30 tahun–65 tahun",
                    ">65 tahun",
                  ])}
                  {field("payer", "Penanggung biaya", [
                    "Pribadi",
                    "BPJS",
                    "Asuransi swasta",
                    "Pemerintah",
                    "Perusahaan",
                    "Lain-lain",
                  ])}
                  {field(
                    "admissionDate",
                    "Tanggal masuk RS",
                    undefined,
                    "date",
                  )}
                  {field("admissionTime", "Jam masuk RS", undefined, "time")}
                  {field(
                    "dateReason",
                    "Alasan jika tanggal masuk melewati insiden",
                    undefined,
                    "textarea",
                    true,
                  )}
                </>
              )}
              {step === 1 && (
                <>
                  {field(
                    "incidentDate",
                    "1. Tanggal insiden",
                    undefined,
                    "date",
                  )}
                  {field("incidentTime", "1. Jam insiden", undefined, "time")}
                  {field(
                    "title",
                    "2. Judul singkat insiden",
                    undefined,
                    "text",
                    true,
                  )}
                  {field(
                    "chronology",
                    "3. Kronologis insiden",
                    undefined,
                    "textarea",
                    true,
                  )}
                  {field("kind", "4. Jenis insiden", [
                    "KPC",
                    "KNC",
                    "KTC",
                    "KTD",
                  ])}
                  {field("sentinel", "Penanda sentinel", [
                    "Belum ditentukan",
                    "Suspek kejadian sentinel",
                    ...(["Tim Keselamatan Pasien", "Kepala unit"].includes(
                      store.db.settings.role,
                    )
                      ? ["Sentinel terkonfirmasi"]
                      : []),
                  ])}
                  <div className="info-note span-2">
                    KPC: Kondisi Potensial Cedera · KNC: Kejadian Nyaris Cedera
                    · KTC: Kejadian Tidak Cedera · KTD: Kejadian Tidak
                    Diharapkan. Sentinel harus diverifikasi petugas berwenang;
                    tidak semua KTD adalah sentinel.
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  {field(
                    "firstReporter",
                    "5. Orang pertama yang melaporkan",
                    [
                      "Dokter",
                      "Perawat",
                      "Petugas lainnya",
                      "Pasien",
                      "Keluarga / pendamping pasien",
                      "Pengunjung",
                      "Lain-lain",
                    ],
                    undefined,
                    true,
                  )}
                  {field("target", "6. Insiden terjadi pada", [
                    "Pasien",
                    "Karyawan",
                    "Pengunjung",
                    "Pendamping",
                    "Keluarga pasien",
                    "Lain-lain",
                  ])}
                  {field("service", "7. Jenis pelayanan pasien", [
                    "Rawat inap",
                    "Rawat jalan",
                    "IGD / UGD",
                    "Lain-lain",
                    "Tidak relevan (non-pasien)",
                  ])}
                  {values.target !== "Pasien" && (
                    <div className="warning-note span-2">
                      Kejadian non-pasien mungkin perlu diarahkan ke mekanisme
                      K3 RS sesuai SOP. Gunakan keterangan “Tidak relevan” untuk
                      data pasien yang tidak terkait.
                    </div>
                  )}
                </>
              )}
              {step === 3 && (
                <>
                  {field("unit", "8. Unit tempat insiden", store.db.units)}
                  {field("location", "8. Lokasi spesifik")}
                  {field("specialty", "9. Spesialisasi pasien", [
                    "Penyakit Dalam",
                    "Anak",
                    "Bedah",
                    "Obstetri dan Ginekologi",
                    "THT",
                    "Mata",
                    "Saraf",
                    "Anestesi",
                    "Kulit dan Kelamin",
                    "Jantung",
                    "Paru",
                    "Jiwa",
                    "Lain-lain",
                    "Tidak relevan",
                  ])}
                  {field(
                    "relatedUnit",
                    "10. Unit / departemen terkait",
                    unitOpts,
                  )}
                  {values.relatedUnit === "Lain-lain" &&
                    field(
                      "otherUnit",
                      "Nama unit lainnya",
                      undefined,
                      "text",
                      true,
                    )}
                  {field(
                    "unitNotes",
                    "10. Keterangan unit terkait",
                    undefined,
                    "textarea",
                    true,
                  )}
                  <div className="info-note span-2">
                    Unit bertanda “contoh” adalah master data sintetis, bukan
                    daftar unit resmi RSAS.
                  </div>
                </>
              )}
              {step === 4 && (
                <>
                  <fieldset className="radio-fieldset span-2">
                    <legend>
                      11. Akibat insiden terhadap pasien <em>*</em>
                    </legend>
                    {[
                      "Kematian",
                      "Cedera irreversible / berat",
                      "Cedera reversible / sedang",
                      "Cedera ringan",
                      "Tidak ada cedera",
                    ].map((o) => (
                      <label className="radio-option" key={o}>
                        <input type="radio" value={o} {...register("impact")} />
                        <span>{o}</span>
                      </label>
                    ))}
                    {errors.impact && (
                      <span className="field-error">
                        {errors.impact.message}
                      </span>
                    )}
                  </fieldset>
                  {["Kematian", "Cedera irreversible / berat"].includes(
                    values.impact,
                  ) && (
                    <div className="warning-note span-2">
                      Dampak serius: segera ikuti prosedur klinis dan eskalasi
                      pelaporan yang berlaku. Prototipe ini tidak menentukan
                      keputusan klinis.
                    </div>
                  )}
                </>
              )}
              {step === 5 && (
                <>
                  {field(
                    "actionTaken",
                    "12. Tindakan yang telah dilakukan",
                    undefined,
                    "textarea",
                    true,
                  )}
                  {field(
                    "actionResult",
                    "12. Hasil tindakan",
                    undefined,
                    "textarea",
                    true,
                  )}
                  {field("actionTime", "12. Jam tindakan", undefined, "time")}
                  {field("actor", "13. Tindakan dilakukan oleh", [
                    "Tim",
                    "Dokter",
                    "Perawat",
                    "Petugas lainnya",
                  ])}
                  {values.actor === "Tim" &&
                    field("team", "Anggota tim demo", undefined, "text", true)}
                  {field(
                    "actionNotes",
                    "Keterangan tambahan",
                    undefined,
                    "textarea",
                    true,
                  )}
                  {field(
                    "recurring",
                    "14. Pernah terjadi di unit lain?",
                    ["Ya", "Tidak"],
                    undefined,
                    true,
                  )}
                  {values.recurring === "Ya" && (
                    <>
                      {field(
                        "previousUnit",
                        "Unit kejadian sebelumnya",
                        unitOpts,
                      )}
                      {field(
                        "previousDate",
                        "Tanggal kejadian sebelumnya",
                        undefined,
                        "date",
                      )}
                      {field(
                        "previousDescription",
                        "Penjelasan kejadian sebelumnya",
                        undefined,
                        "textarea",
                        true,
                      )}
                      {field(
                        "prevention",
                        "Langkah pencegahan yang pernah dilakukan",
                        undefined,
                        "textarea",
                        true,
                      )}
                    </>
                  )}
                </>
              )}
              {step === 6 && (
                <>
                  {field("author", "Nama pembuat laporan (demo)")}
                  {field("authorTitle", "Jabatan pembuat")}
                  {field("authorInitial", "Paraf pembuat (ketik inisial demo)")}
                  {field("reportDate", "Tanggal laporan", undefined, "date")}
                  {field("receiver", "Nama penerima laporan (demo)")}
                  {field("receiverTitle", "Jabatan penerima")}
                  {field(
                    "receiverInitial",
                    "Paraf penerima (ketik inisial demo)",
                  )}
                  {field(
                    "receivedDate",
                    "Tanggal penerimaan",
                    undefined,
                    "date",
                  )}
                  <div className="info-note span-2">
                    Paraf hanya konfirmasi identitas simulasi, bukan tanda
                    tangan elektronik tersertifikasi. Grading ditetapkan secara
                    terpisah oleh atasan pelapor / Tim Keselamatan Pasien.
                  </div>
                </>
              )}
              {step === 7 && (
                <div className="review-section span-2">
                  <div className="review-heading">
                    <h3>Data pasien demo</h3>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setStep(0)}
                    >
                      Edit data pasien
                    </button>
                  </div>
                  <p>
                    {values.patientName} · {values.medicalNumber} ·{" "}
                    {values.room}
                  </p>
                  <p>
                    {values.ageYears} tahun {values.ageMonths} bulan ·{" "}
                    {values.ageGroup} · {values.gender} · {values.payer}
                  </p>
                  <p>
                    Masuk: {values.admissionDate} {values.admissionTime} ·{" "}
                    {values.dateReason ||
                      "Tidak ada catatan inkonsistensi tanggal."}
                  </p>
                  {questionValues(values).map((v, n) => (
                    <div className="review-item" key={n}>
                      <div>
                        <b>
                          {n + 1}. {questionLabels[n]}
                        </b>
                        <button
                          type="button"
                          className="text-link"
                          onClick={() =>
                            setStep(
                              n < 4
                                ? 1
                                : n < 7
                                  ? 2
                                  : n < 10
                                    ? 3
                                    : n === 10
                                      ? 4
                                      : 5,
                            )
                          }
                        >
                          Edit
                        </button>
                      </div>
                      <p>{v || "—"}</p>
                    </div>
                  ))}
                  <div className="review-heading">
                    <h3>Pengesahan demo</h3>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setStep(6)}
                    >
                      Edit pengesahan
                    </button>
                  </div>
                  <p>
                    Pembuat: {values.author} ({values.authorTitle}) · Paraf:{" "}
                    {values.authorInitial} · {values.reportDate}
                  </p>
                  <p>
                    Penerima: {values.receiver} ({values.receiverTitle}) ·
                    Paraf: {values.receiverInitial} · {values.receivedDate}
                  </p>
                  <p>Grading: Menunggu penetapan grading</p>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={certify}
                      onChange={(e) => setCertify(e.target.checked)}
                    />
                    Saya memastikan seluruh data bersifat sintetis dan memahami
                    bahwa ini adalah simulasi.
                  </label>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => window.print()}
                  >
                    <Printer size={16} />
                    Preview / cetak data sintetis
                  </button>
                </div>
              )}
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => persist("DRAFT")}
              >
                <Save size={16} />
                Simpan Draft
              </button>
              <div>
                {step > 0 && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setStep(step - 1)}
                  >
                    <ChevronLeft size={16} />
                    Kembali
                  </button>
                )}
                <button
                  type="submit"
                  className="btn primary"
                  disabled={step === 7 && !certify}
                >
                  {step === 7 ? (
                    <>
                      <Send size={16} />
                      Kirim Laporan Demo
                    </>
                  ) : (
                    <>
                      Selanjutnya
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </form>
      </div>
      {step === 7 && (
        <PrintSheet
          incident={makeIncident(
            getValues(),
            store.db.incidents,
            "DRAFT",
            savedRef.current,
          )}
        />
      )}
      {confirm && (
        <Confirm
          title="Kirim laporan demo?"
          description="Laporan akan masuk ke antrean verifikasi demo. Pastikan tidak ada identitas pasien nyata."
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            sent.current = true;
            const i = persist("DILAPORKAN");
            if (i) navigate(`/laporan/${i.id}`);
            else sent.current = false;
            setConfirm(false);
          }}
        />
      )}
    </>
  );
}
