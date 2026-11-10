import { Link } from "react-router-dom";
import { Download, Printer, ArrowUpRight } from "lucide-react";
import { useStore } from "../app/store";
import { Filters, useFilters } from "../components/filters";
import { PageHeading, Card, IncidentTable } from "../components/ui";
import {
  Bars,
  RiskDonut,
  TrendChart,
  TimelinessChart,
} from "../components/charts";
import {
  aggregate,
  metrics,
  csv,
  download,
  deadline,
  statusLabel,
  today,
} from "../utils/domain";
export default function Analytics() {
  const { db } = useStore();
  const f = useFilters(db.incidents),
    m = metrics(f.items);
  const actions = db.actions.filter((a) =>
    f.items.some((i) => i.id === a.incidentId),
  );
  const numbers = [
    ["Total laporan", m.total],
    ["Bulan ini", m.month],
    ["Hari ini", m.today],
    ...["KPC", "KNC", "KTC", "KTD"].map((k) => [
      k,
      f.items.filter((i) => i.incident.kind === k).length,
    ]),
    [
      "Sentinel terkonfirmasi",
      f.items.filter((i) => i.incident.sentinel === "Sentinel terkonfirmasi")
        .length,
    ],
    ["Menunggu verifikasi", m.pending],
    ["Dalam investigasi", m.investigation],
    ["Selesai / arsip", m.done],
    ["Melewati 48 jam", m.late],
    ["Insiden berulang", m.recurring],
    [
      "CAPA belum selesai",
      actions.filter((a) => a.status !== "Selesai").length,
    ],
  ];
  return (
    <>
      <PageHeading
        title="Analisis & Statistik"
        description="Ubah catatan insiden menjadi bahan pembelajaran dan perbaikan."
      >
        <button
          className="btn secondary"
          onClick={() =>
            download(
              "rsas-analitik-demo.csv",
              csv(f.items),
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download size={16} />
          Ekspor CSV
        </button>
        <button className="btn primary" onClick={() => window.print()}>
          <Printer size={16} />
          Cetak Ringkasan
        </button>
      </PageHeading>
      <Filters f={f} />
      <div className="analytics-metrics">
        {numbers.map(([label, value]) => (
          <div className="card mini-stat" key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
      <div className="analytics-grid">
        <Card
          title="Tren Ketepatan Waktu Pelaporan"
          subtitle="6 bulan terakhir · laporan terkirim · jam perangkat"
        >
          <TimelinessChart items={f.items} />
        </Card>
        <Card
          title="Kejadian Berulang"
          subtitle="Berdasarkan keterangan pelapor"
        >
          <Bars
            data={aggregate(f.items, (i) =>
              i.incident.recurring === "Ya"
                ? "Berulang"
                : i.incident.recurring === "Tidak"
                  ? "Tidak berulang"
                  : "Belum diisi",
            )}
          />
        </Card>
        <Card
          title="Tren Bulanan"
          subtitle="6 bulan terakhir · mengikuti filter"
        >
          <TrendChart items={f.items} />
        </Card>
        <Card title="Distribusi Grading">
          <RiskDonut items={f.items} />
        </Card>
        <Card title="Jenis Insiden">
          <Bars data={aggregate(f.items, (i) => i.incident.kind)} />
        </Card>
        <Card title="Sebaran Unit">
          <Bars
            horizontal
            data={aggregate(f.items, (i) =>
              i.incident.unit.replace(" (contoh)", ""),
            )}
          />
        </Card>
        <Card title="Jenis Pelayanan">
          <Bars data={aggregate(f.items, (i) => i.incident.service)} />
        </Card>
        <Card title="Distribusi Dampak Cedera">
          <Bars horizontal data={aggregate(f.items, (i) => i.impact)} />
        </Card>
        <Card title="Status Verifikasi & Penanganan">
          <Bars
            horizontal
            data={aggregate(f.items, (i) => statusLabel[i.status])}
          />
        </Card>
        <Card title="Status CAPA">
          <Bars
            data={Object.entries(
              actions.reduce<Record<string, number>>((a, v) => {
                const s =
                  v.status !== "Selesai" && v.target < today()
                    ? "Terlambat"
                    : v.status;
                a[s] = (a[s] ?? 0) + 1;
                return a;
              }, {}),
            ).map(([name, value]) => ({ name, value }))}
          />
        </Card>
        <Card
          title="Ketepatan Waktu Pelaporan"
          subtitle="Laporan terkirim · berbasis jam perangkat"
        >
          <Bars
            data={aggregate(
              f.items.filter((i) => i.submittedAt),
              (i) => (deadline(i).late ? "> 48 jam" : "≤ 48 jam"),
            )}
          />
        </Card>
        <Card
          title="Shift Insiden"
          subtitle="Pembagian shift contoh, bukan SOP resmi"
        >
          <Bars
            data={aggregate(f.items, (i) => {
              const hour = Number(i.incident.incidentTime.slice(0, 2));
              return !i.incident.incidentTime
                ? "Belum diisi"
                : hour >= 7 && hour < 14
                  ? "Pagi (07–14)"
                  : hour >= 14 && hour < 21
                    ? "Sore (14–21)"
                    : "Malam (21–07)";
            })}
          />
        </Card>
      </div>
      <Card
        title="Evaluasi Kejadian Berulang"
        subtitle={`${m.recurring} laporan memiliki catatan kejadian serupa di unit lain.`}
      >
        <IncidentTable
          compact
          items={f.items.filter((i) => i.incident.recurring === "Ya")}
        />
      </Card>
      <p className="info-note">
        Seluruh statistik berasal dari data sintetis tersimpan dan filter aktif.
        Bukan data aktual atau kesimpulan klinis RSAS. CSV tidak memuat nama
        pasien atau nomor rekam medis.
      </p>
    </>
  );
}
