import { Link } from "react-router-dom";
import {
  Plus,
  ArrowUpRight,
  ClipboardList,
  CalendarDays,
  Clock3,
  CheckCheck,
  ArrowRight,
  ShieldCheck,
  Activity,
  Download,
  ChevronRight,
  HeartPulse,
} from "lucide-react";
import { useStore } from "../app/store";
import { PageHeading, Card, IncidentTable, MoreLink } from "../components/ui";
import { Filters, useFilters } from "../components/filters";
import { TrendChart, RiskDonut, palette } from "../components/charts";
import { metrics, fmt, download, csv, today } from "../utils/domain";
import { AdditionalIndicators } from "../components/indicators";
export default function Dashboard() {
  const { db } = useStore();
  const f = useFilters(db.incidents);
  const m = metrics(f.items);
  const pending = f.items.filter((i) =>
    ["DILAPORKAN", "DITERIMA"].includes(i.status),
  );
  const tasks = pending.slice(0, 2);
  return (
    <>
      <PageHeading
        eyebrow="OVERVIEW · KESELAMATAN PASIEN"
        title="Dashboard Keselamatan Pasien"
        description="Pantau, pelajari, dan tingkatkan keselamatan pasien bersama."
      >
        <span className="heading-date">
          <CalendarDays size={16} />
          {fmt(today(), "EEEE, dd MMM yyyy")}
        </span>
        <Link className="btn primary" to="/laporan/baru">
          <Plus size={17} />
          Buat Laporan
        </Link>
      </PageHeading>
      <section className="welcome-banner">
        <div>
          <span className="welcome-kicker">
            <span />
            BUDAYA KESELAMATAN DIMULAI DARI KITA
          </span>
          <h2>
            Setiap laporan, satu langkah
            <br />
            menuju pelayanan lebih aman.
          </h2>
          <p>
            Laporkan tanpa takut. Belajar tanpa menyalahkan.
            <br />
            Bersama RSAS, wujudkan keselamatan pasien yang berkelanjutan.
          </p>
          <Link to="/bantuan">
            Kenali alur pelaporan <ArrowRight size={15} />
          </Link>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-dot dot-one" />
          <div className="art-dot dot-two" />
          <div className="art-cross">+</div>
          <div className="shield-halo">
            <ShieldCheck size={83} strokeWidth={1.15} />
          </div>
          <div className="safety-tag">
            <span>
              <HeartPulse size={19} />
            </span>
            <div>
              <b>Patient safety first</b>
              <small>Komitmen bersama, setiap hari.</small>
            </div>
            <CheckCheck size={18} />
          </div>
        </div>
        <span className="hero-hospital">RSAU Prof. dr. Abdulrachman Saleh</span>
      </section>
      <Filters f={f} />
      <div className="kpi-grid">
        {[
          {
            label: "Total Laporan Insiden",
            value: m.total,
            icon: ClipboardList,
            cls: "blue",
            note: `${m.month} laporan dibuat bulan ini`,
            link: "/laporan",
          },
          {
            label: "Menunggu Verifikasi",
            value: m.pending,
            icon: Clock3,
            cls: "amber",
            note: "Perlu ditinjau oleh tim terkait",
            link: "/verifikasi",
          },
          {
            label: "Dalam Investigasi",
            value: m.investigation,
            icon: Activity,
            cls: "purple",
            note: "Penelusuran & analisis akar masalah",
            link: "/investigasi",
          },
          {
            label: "Laporan Selesai",
            value: m.done,
            icon: CheckCheck,
            cls: "teal",
            note: `${m.total ? Math.round((m.done / m.total) * 100) : 0}% dari laporan terfilter`,
            link: "/laporan?status=SELESAI",
          },
        ].map((k) => (
          <Link to={k.link} className="card kpi" key={k.label}>
            <div className="kpi-top">
              <span className={`kpi-icon ${k.cls}`}>
                <k.icon size={21} />
              </span>
              <ArrowUpRight size={17} />
            </div>
            <span className="kpi-label">{k.label}</span>
            <strong>
              {String(k.value).padStart(2, "0")}
              <span>laporan</span>
            </strong>
            <p>
              <i className={k.cls} />
              {k.note}
            </p>
          </Link>
        ))}
      </div>
      <AdditionalIndicators items={f.items} actions={db.actions} />
      <div className="chart-grid">
        <Card
          title="Tren Pelaporan Insiden"
          subtitle="Sebaran jenis insiden dalam 6 bulan terakhir"
          action={
            <div className="small-chip">
              <CalendarDays size={13} />6 bulan
            </div>
          }
        >
          <div className="chart-legend">
            {["KPC", "KNC", "KTC", "KTD"].map((k, n) => (
              <span key={k}>
                <i style={{ background: palette[n] }} />
                {k}
              </span>
            ))}
          </div>
          <TrendChart items={f.items} />
          <div className="chart-foot">
            <span>
              <span className="tiny-dot" />
              Data sintetis · mengikuti filter aktif
            </span>
            <Link to="/analisis">
              Lihat analisis <ArrowUpRight size={13} />
            </Link>
          </div>
        </Card>
        <Card
          title="Distribusi Risiko"
          subtitle="Hasil grading manual laporan demo"
          action={
            <Link
              className="icon-btn"
              aria-label="Buka grading risiko"
              to="/grading"
            >
              <ArrowUpRight size={17} />
            </Link>
          }
        >
          <RiskDonut items={f.items} />
          <div className="chart-foot">
            <ShieldCheck size={14} />
            <span>Grading ditetapkan oleh penilai demo.</span>
          </div>
        </Card>
      </div>
      <div className="section-row">
        <div>
          <h2>
            Laporan Insiden Terbaru{" "}
            <span className="count-pill">{f.items.length}</span>
          </h2>
          <p>Ringkasan laporan untuk ditinjau dan ditindaklanjuti.</p>
        </div>
        <MoreLink to="/laporan">Lihat semua laporan</MoreLink>
      </div>
      <Card className="table-card">
        <IncidentTable
          items={[...f.items]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 5)}
          compact
        />
      </Card>
      <div className="bottom-grid">
        <Card
          title="Perlu Perhatian"
          subtitle="Prioritas kerja Tim Keselamatan Pasien"
          action={<span className="count-pill amber">{pending.length}</span>}
        >
          {tasks.length ? (
            tasks.map((i) => (
              <Link
                className="attention-item"
                to={`/laporan/${i.id}`}
                key={i.id}
              >
                <span className="attention-icon">
                  <Clock3 size={17} />
                </span>
                <div>
                  <b>{i.incident.title}</b>
                  <small>{i.displayNumber} · Menunggu verifikasi</small>
                </div>
                <ChevronRight size={16} />
              </Link>
            ))
          ) : (
            <p className="muted padded">
              Tidak ada verifikasi tertunda pada filter ini.
            </p>
          )}
          <Link className="card-bottom-link" to="/verifikasi">
            Tinjau antrean verifikasi <ArrowRight size={15} />
          </Link>
        </Card>
        <Card className="commitment-card">
          <div className="commitment-icon">
            <ShieldCheck size={25} />
          </div>
          <div className="eyebrow">KOMITMEN RSAS</div>
          <h2>
            Pelaporan untuk perbaikan,
            <br />
            bukan untuk menyalahkan.
          </h2>
          <p>
            Bangun budaya adil, terbuka, dan saling belajar dalam setiap
            pelayanan.
          </p>
          <Link to="/bantuan">
            Panduan pelaporan <ArrowUpRight size={15} />
          </Link>
        </Card>
      </div>
      <div className="data-caption">
        <span>
          <i />
          Seluruh angka berasal dari data demo tersimpan.
        </span>
        <button
          onClick={() =>
            download(
              "rsas-statistik-demo.csv",
              csv(f.items),
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download size={14} />
          Ekspor statistik
        </button>
      </div>
    </>
  );
}
