import { createPortal } from "react-dom";
import type { Incident, FormData } from "../schemas/models";
import { fmt, gradeLabel } from "../utils/domain";
export const questionLabels = [
  "Tanggal dan waktu insiden",
  "Insiden",
  "Kronologis insiden",
  "Jenis insiden & penanda sentinel",
  "Orang pertama yang melaporkan",
  "Insiden terjadi pada",
  "Jenis pelayanan pasien",
  "Tempat insiden",
  "Spesialisasi pasien",
  "Unit / departemen terkait",
  "Akibat insiden terhadap pasien",
  "Tindakan segera dan hasilnya",
  "Tindakan dilakukan oleh",
  "Kejadian serupa di unit lain",
];
export function questionValues(f: FormData) {
  return [
    `${f.incidentDate} ${f.incidentTime}`,
    f.title,
    f.chronology,
    `${f.kind} · ${f.sentinel}`,
    f.firstReporter,
    f.target,
    f.service,
    `${f.unit} / ${f.room} / ${f.location}`,
    f.specialty,
    `${f.relatedUnit} ${f.otherUnit} ${f.unitNotes}`,
    f.impact,
    `${f.actionTaken}\nHasil: ${f.actionResult}\nJam: ${f.actionTime}\n${f.actionNotes}`,
    `${f.actor} ${f.team}`,
    `${f.recurring}${f.recurring === "Ya" ? `\nUnit: ${f.previousUnit}\nTanggal: ${f.previousDate}\n${f.previousDescription}\nPencegahan: ${f.prevention}` : ""}`,
  ];
}
export function PrintSheet({ incident }: { incident: Incident }) {
  const f = incident.incident;
  return createPortal(
    <article className="print-document">
      <div className="print-watermark">DATA DEMO</div>
      <header>
        <div className="print-logo">
          <img src="/assets/logo-rsas.png" alt="Logo RSAS" />
        </div>
        <div>
          <h2>RSAU Prof. dr. Abdulrachman Saleh</h2>
          <p>Sagraha Abhipraya Nawasena · Kesehatan untuk Kedaulatan</p>
          <h1>Laporan Insiden Keselamatan Pasien</h1>
          <p>KE TIM KESELAMATAN PASIEN RSAS</p>
        </div>
      </header>
      <div className="print-meta">
        <strong>RAHASIA — INTERNAL · DATA SINTETIS</strong>
        <span>{incident.displayNumber}</span>
      </div>
      <p>
        Pelaporan maksimal 2 × 24 jam · Tanggal cetak:{" "}
        {fmt(new Date().toISOString(), "dd MMM yyyy HH:mm")} (jam perangkat)
      </p>
      <h3>A. Data Pasien Demo</h3>
      <table>
        <tbody>
          {[
            ["Nama pasien", f.patientName],
            ["Nomor rekam medis", f.medicalNumber],
            ["Ruangan", f.room],
            [
              "Umur / kelompok",
              `${f.ageYears} tahun ${f.ageMonths} bulan / ${f.ageGroup}`,
            ],
            ["Jenis kelamin", f.gender],
            ["Penanggung biaya", f.payer],
            ["Tanggal masuk", `${f.admissionDate} ${f.admissionTime}`],
            ["Alasan inkonsistensi tanggal", f.dateReason || "—"],
          ].map(([k, v]) => (
            <tr key={k}>
              <th>{k}</th>
              <td>{v || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>B. Rincian Kejadian</h3>
      <table>
        <tbody>
          {questionValues(f).map((v, n) => (
            <tr key={n}>
              <th>
                {n + 1}. {questionLabels[n]}
              </th>
              <td>{v || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>C. Pembuat dan Penerima Laporan</h3>
      <div className="print-sign">
        <div>
          <b>Pembuat: {f.author}</b>
          <p>{f.authorTitle}</p>
          <p>Paraf simulasi: {f.authorInitial || "Belum dikonfirmasi"}</p>
          <p>Tanggal: {f.reportDate}</p>
        </div>
        <div>
          <b>Penerima: {f.receiver}</b>
          <p>{f.receiverTitle}</p>
          <p>Paraf simulasi: {f.receiverInitial || "Belum dikonfirmasi"}</p>
          <p>Tanggal: {f.receivedDate}</p>
        </div>
      </div>
      <h3>D. Grading Risiko</h3>
      <p>
        {incident.riskAssessment.grade
          ? `${incident.riskAssessment.grade} / ${gradeLabel[incident.riskAssessment.grade]}`
          : "Menunggu penetapan grading"}{" "}
        · Penilai: {incident.riskAssessment.assessor || "—"} ·{" "}
        {incident.riskAssessment.date}
      </p>
      <p>Alasan: {incident.riskAssessment.reason || "—"}</p>
      <p>
        Dampak: {incident.riskAssessment.impact || "—"} · Probabilitas:{" "}
        {incident.riskAssessment.probability || "—"}
      </p>
      <p>Catatan: {incident.riskAssessment.notes || "—"}</p>
      <div className="print-footer">
        RSAS | Quality & Patient Safety Management · DEMO · Paraf bukan tanda
        tangan elektronik tersertifikasi.
      </div>
    </article>,
    document.body,
  );
}
