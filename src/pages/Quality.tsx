import { useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { Printer, Download, FileChartColumn, ShieldCheck } from "lucide-react";
import { useStore } from "../app/store";
import { Card, PageHeading } from "../components/ui";
import { TrendChart, Bars, RiskDonut } from "../components/charts";
import {
  aggregate,
  metrics,
  today,
  fmt,
  download,
  csv,
  statusLabel,
} from "../utils/domain";
export default function Quality() {
  const { db } = useStore();
  const [period, setPeriod] = useState("Bulanan"),
    [date, setDate] = useState(today());
  const day = new Date(`${date || today()}T12:00:00`);
  let from = date,
    to = date;
  if (period === "Mingguan") {
    from = format(startOfWeek(day, { weekStartsOn: 1 }), "yyyy-MM-dd");
    to = format(endOfWeek(day, { weekStartsOn: 1 }), "yyyy-MM-dd");
  } else if (period === "Bulanan") {
    from = format(startOfMonth(day), "yyyy-MM-dd");
    to = format(endOfMonth(day), "yyyy-MM-dd");
  } else if (period === "Triwulanan") {
    from = format(startOfQuarter(day), "yyyy-MM-dd");
    to = format(endOfQuarter(day), "yyyy-MM-dd");
  } else if (period === "Tahunan") {
    from = date.slice(0, 4) + "-01-01";
    to = date.slice(0, 4) + "-12-31";
  }
  const items = db.incidents.filter(
    (i) => i.incident.incidentDate >= from && i.incident.incidentDate <= to,
  );
  const m = metrics(items);
  const actions = db.actions.filter((a) =>
    items.some((i) => i.id === a.incidentId),
  );
  const recommendations = db.investigations
    .filter((v) => items.some((i) => i.id === v.incidentId))
    .flatMap((v) => v.recommendations.filter(Boolean));
  const summary = (
    <>
      <h2>Executive Summary</h2>
      <p>
        Ringkasan untuk Karumkit RSAS · Periode {period.toLowerCase()}{" "}
        {fmt(date)}. Terdapat <b>{m.total} laporan demo</b>, {m.pending}{" "}
        menunggu verifikasi, {m.investigation} dalam investigasi, dan {m.done}{" "}
        selesai / arsip.
      </p>
      <div className="quality-stats">
        <div>
          <b>{m.total}</b>
          <span>Laporan demo</span>
        </div>
        <div>
          <b>{m.onTime}%</b>
          <span>Laporan terkirim ≤ 48 jam</span>
        </div>
        <div>
          <b>{m.recurring}</b>
          <span>Kejadian berulang</span>
        </div>
        <div>
          <b>
            {actions.filter((a) => a.status === "Selesai").length}/
            {actions.length}
          </b>
          <span>CAPA selesai</span>
        </div>
      </div>
      <h3>Temuan Utama</h3>
      <p>
        {m.late} laporan melewati 48 jam;{" "}
        {items.filter((i) => !i.riskAssessment.grade).length} belum memiliki
        grading. Angka ini menggambarkan kelengkapan dan status data sintetis,
        bukan ukuran keselamatan klinis.
      </p>
      <h3>Rekomendasi yang Telah Dicatat</h3>
      {recommendations.length ? (
        <ul>
          {recommendations.map((r, n) => (
            <li key={n}>{r}</li>
          ))}
        </ul>
      ) : (
        <p>Belum ada rekomendasi tercatat pada periode ini.</p>
      )}
      <h3>Tindakan Perbaikan & Monitoring</h3>
      {actions.length ? (
        <ul>
          {actions.map((a) => (
            <li key={a.id}>
              {a.corrective} · PIC {a.owner} · target {fmt(a.target)} ·{" "}
              {a.status}. {a.evaluation && `Evaluasi: ${a.evaluation}`}
            </li>
          ))}
        </ul>
      ) : (
        <p>Belum ada CAPA tercatat pada periode ini.</p>
      )}
      <h3>Kesimpulan</h3>
      <p>
        Ringkasan ini memerlukan tinjauan Tim Keselamatan Pasien dan Tim Mutu.
        Tidak ada kesimpulan klinis otomatis. Evaluasi efektivitas hanya
        tersedia bila telah diinput reviewer.
      </p>
    </>
  );
  return (
    <>
      <PageHeading
        title="Laporan Mutu & Pimpinan"
        description="Ringkasan terstruktur untuk evaluasi mutu dan monitoring tindak lanjut."
      >
        <button
          className="btn secondary"
          onClick={() =>
            download(
              "rsas-laporan-mutu-demo.csv",
              csv(items),
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download size={16} />
          Ekspor CSV
        </button>
        <button className="btn primary" onClick={() => window.print()}>
          <Printer size={16} />
          Cetak Laporan Mutu
        </button>
      </PageHeading>
      <section className="quality-reference-link">
        <div>
          <b>Indikator mutu prioritas RSAS</b>
          <p>
            Telusuri target dan definisi dari dokumen acuan, terpisah dari
            laporan insiden demo.
          </p>
        </div>
        <Link className="btn secondary" to="/indikator-mutu">
          Buka Katalog Referensi <FileChartColumn size={16} />
        </Link>
      </section>
      <div className="filter-bar">
        <FileChartColumn size={18} />
        <b>Periode laporan</b>
        <label>
          <span className="sr-only">Jenis periode</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {["Harian", "Mingguan", "Bulanan", "Triwulanan", "Tahunan"].map(
              (p) => (
                <option key={p}>{p}</option>
              ),
            )}
          </select>
        </label>
        <label>
          <span className="sr-only">Tanggal acuan laporan</span>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </label>
        <span className="demo-chip">DATA DEMO</span>
      </div>
      <Card className="quality-summary">
        <div className="report-letterhead">
          <ShieldCheck size={34} />
          <div>
            <span>RSAU PROF. DR. ABDULRACHMAN SALEH</span>
            <h2>Laporan Mutu Keselamatan Pasien</h2>
            <p>Sagraha Abhipraya Nawasena · Kesehatan untuk Kedaulatan</p>
          </div>
          <span className="small-chip">{period}</span>
        </div>
        {summary}
      </Card>
      <div className="analytics-grid">
        <Card title="Grafik Tren">
          <TrendChart items={items} range={{ start: from, end: to }} />
        </Card>
        <Card title="Distribusi Risiko">
          <RiskDonut items={items} />
        </Card>
        <Card title="Jenis Insiden">
          <Bars data={aggregate(items, (i) => i.incident.kind)} />
        </Card>
        <Card title="Distribusi Unit">
          <Bars horizontal data={aggregate(items, (i) => i.incident.unit)} />
        </Card>
        <Card title="Dampak Insiden">
          <Bars horizontal data={aggregate(items, (i) => i.impact)} />
        </Card>
        <Card title="Status Penanganan">
          <Bars
            horizontal
            data={aggregate(items, (i) => statusLabel[i.status])}
          />
        </Card>
      </div>
      {createPortal(
        <article className="print-document">
          <h1>RSAU Prof. dr. Abdulrachman Saleh</h1>
          <h2>Laporan Mutu Keselamatan Pasien</h2>
          <p>
            RAHASIA — INTERNAL · DATA DEMO · Dicetak{" "}
            {fmt(new Date().toISOString(), "dd MMM yyyy HH:mm")}
          </p>
          <div className="print-watermark">DATA DEMO</div>
          {summary}
          <h3>Distribusi Periode</h3>
          {[
            ["Jenis", aggregate(items, (i) => i.incident.kind)],
            ["Unit", aggregate(items, (i) => i.incident.unit)],
            [
              "Risiko",
              aggregate(
                items,
                (i) => i.riskAssessment.grade ?? "Belum ditetapkan",
              ),
            ],
            ["Dampak", aggregate(items, (i) => i.impact)],
            ["Penanganan", aggregate(items, (i) => statusLabel[i.status])],
          ].map(([title, rows]) => (
            <section key={title as string}>
              <h4>{title as string}</h4>
              <ul>
                {(rows as { name: string; value: number }[]).map((d) => (
                  <li key={d.name}>
                    {d.name}: {d.value}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="print-footer">
            RSAS | Quality & Patient Safety Management · Data sintetis
          </div>
        </article>,
        document.body,
      )}
    </>
  );
}
