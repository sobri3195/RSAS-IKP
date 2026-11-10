import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Printer,
  Clock3,
  ChevronRight,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useStore } from "../app/store";
import {
  Card,
  Grade,
  StatusBadge,
  PageHeading,
  Empty,
  Deadline,
  Confirm,
} from "../components/ui";
import {
  PrintSheet,
  questionLabels,
  questionValues,
} from "../components/print";
import {
  VerificationEditor,
  RiskEditor,
  InvestigationEditor,
  CapaEditor,
} from "../components/workbenches";
import { fmt, changeStatus, transitions, statusLabel } from "../utils/domain";
import type { Status } from "../schemas/models";
export default function Detail() {
  const { id } = useParams();
  const { db, commit, notify } = useStore();
  const i = db.incidents.find((v) => v.id === id);
  const [tab, setTab] = useState("Ringkasan"),
    [next, setNext] = useState<Status | null>(null);
  if (!i)
    return (
      <Empty
        title="Laporan tidak ditemukan"
        description="Laporan mungkin sudah dihapus atau tidak ada pada browser ini."
      >
        <Link className="btn primary" to="/laporan">
          Kembali ke daftar
        </Link>
      </Empty>
    );
  return (
    <>
      <Link className="back-link" to="/laporan">
        <ArrowLeft size={14} />
        Semua laporan
      </Link>
      <PageHeading
        eyebrow={i.displayNumber}
        title={i.incident.title || "Draft tanpa judul"}
        description={`Dibuat ${fmt(i.createdAt, "dd MMM yyyy, HH:mm")} · ${i.incident.unit || "Unit belum diisi"} · DATA DEMO`}
      >
        <button className="btn secondary" onClick={() => window.print()}>
          <Printer size={16} />
          Cetak A4
        </button>
        {["DRAFT", "DIKEMBALIKAN_UNTUK_REVISI"].includes(i.status) && (
          <Link className="btn primary" to={`/laporan/${i.id}/edit`}>
            <Pencil size={16} />
            Edit Laporan
          </Link>
        )}
      </PageHeading>
      <div className="detail-status">
        <StatusBadge status={i.status} />
        <Grade grade={i.riskAssessment.grade} />
        <span>
          <Clock3 size={15} />
          <Deadline incident={i} />
        </span>
        <small>Tenggat & timestamp berbasis jam perangkat.</small>
      </div>
      <div className="tabs" role="tablist">
        {[
          "Ringkasan",
          "Workflow & Aktivitas",
          "Grading Risiko",
          "Investigasi & RCA",
          "Tindak Lanjut",
        ].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Ringkasan" && (
        <div className="detail-grid">
          <div>
            <Card
              title="Data Pasien Demo"
              subtitle="Identitas sintetis · tidak merujuk pasien nyata"
            >
              <dl className="detail-dl">
                {[
                  ["Nama fiktif", i.incident.patientName],
                  ["No. rekam medis demo", i.incident.medicalNumber],
                  ["Ruangan", i.incident.room],
                  [
                    "Umur",
                    `${i.incident.ageYears} tahun ${i.incident.ageMonths} bulan`,
                  ],
                  ["Kelompok umur", i.incident.ageGroup],
                  ["Jenis kelamin", i.incident.gender],
                  ["Penanggung biaya", i.incident.payer],
                  [
                    "Tanggal masuk",
                    `${i.incident.admissionDate} ${i.incident.admissionTime}`,
                  ],
                  ["Alasan tanggal", i.incident.dateReason],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card title="Rincian Insiden · 14 Butir">
              {questionValues(i.incident).map((v, n) => (
                <div className="detail-question" key={n}>
                  <span>{String(n + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{questionLabels[n]}</h3>
                    <p>{v || "Belum diisi"}</p>
                  </div>
                </div>
              ))}
            </Card>
            <Card title="Pengesahan Simulasi">
              <div className="form-grid">
                <div>
                  <h3>Pembuat laporan</h3>
                  <p>
                    {i.incident.author} · {i.incident.authorTitle}
                  </p>
                  <p>
                    Paraf: {i.incident.authorInitial || "—"} ·{" "}
                    {i.incident.reportDate}
                  </p>
                </div>
                <div>
                  <h3>Penerima laporan</h3>
                  <p>
                    {i.incident.receiver} · {i.incident.receiverTitle}
                  </p>
                  <p>
                    Paraf: {i.incident.receiverInitial || "—"} ·{" "}
                    {i.incident.receivedDate}
                  </p>
                </div>
              </div>
              <p className="muted">
                Paraf demo bukan tanda tangan elektronik tersertifikasi.
              </p>
            </Card>
          </div>
          <div>
            <Card title="Alur Penanganan" subtitle="Simulasi workflow internal">
              <div className="workflow-current">
                <ShieldCheck size={23} />
                <div>
                  <small>STATUS SAAT INI</small>
                  <b>{statusLabel[i.status]}</b>
                </div>
              </div>
              {transitions[i.status].map((s) => (
                <button
                  key={s}
                  className="btn secondary full-width"
                  onClick={() => {
                    if (s === "DILAPORKAN") {
                      notify("Lengkapi dan kirim melalui Edit Laporan.");
                      return;
                    }
                    setNext(s);
                  }}
                >
                  {statusLabel[s]}
                  <ChevronRight size={15} />
                </button>
              ))}
              {!transitions[i.status].length && (
                <p className="muted">Laporan telah diarsipkan.</p>
              )}
              <p className="small muted">
                Role aktif: {db.settings.role}. Seluruh perubahan adalah
                simulasi UI.
              </p>
            </Card>
            {!["DRAFT", "ARSIP"].includes(i.status) && (
              <VerificationEditor key={i.id} incident={i} />
            )}
            <Card title="Catatan Keselamatan">
              <p className="muted">
                Fokus pada perbaikan sistem. Pisahkan fakta, hipotesis, dan
                rekomendasi pada investigasi.
              </p>
              <Link to="/bantuan" className="text-link">
                Baca panduan
                <ChevronRight size={14} />
              </Link>
            </Card>
          </div>
        </div>
      )}
      {tab === "Workflow & Aktivitas" && (
        <Card
          title="Timeline Laporan"
          subtitle="Riwayat lokal dapat diubah. Ini bukan audit trail yang tidak dapat dimodifikasi."
        >
          <div className="timeline">
            {db.activity
              .filter((a) => a.incidentId === i.id)
              .map((a) => (
                <div key={a.id}>
                  <span />
                  <div>
                    <b>{a.text}</b>
                    <p>
                      {a.actor} · {fmt(a.at, "dd MMM yyyy, HH:mm:ss")}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
      {tab === "Grading Risiko" && <RiskEditor key={i.id} incident={i} />}
      {tab === "Investigasi & RCA" && (
        <InvestigationEditor key={i.id} incident={i} />
      )}
      {tab === "Tindak Lanjut" && <CapaEditor key={i.id} incident={i} />}
      {next && (
        <Confirm
          title={`${statusLabel[next]}?`}
          description={`Status ${i.displayNumber} akan diubah dan dicatat pada aktivitas demo lokal.`}
          onClose={() => setNext(null)}
          onConfirm={() => {
            if (commit(changeStatus(db, i.id, next))) {
              notify("Status laporan diperbarui.");
              setNext(null);
            }
          }}
        />
      )}
      <PrintSheet incident={i} />
    </>
  );
}
