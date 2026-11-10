import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Info,
  Printer,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  qualityIndicators,
  qualitySources,
  type QualityCitation,
  type QualityIndicator,
} from "../data/qualityIndicators";
import { Card, Empty, PageHeading } from "../components/ui";
import { download, fmt } from "../utils/domain";

function displayCode(item: QualityIndicator) {
  return item.code ?? `ID katalog ${item.id}`;
}
function sameTitle(a: string, b: string) {
  const normalize = (s: string) =>
    s.toLocaleLowerCase("id").replace(/\s+/g, " ").trim();
  return normalize(a) === normalize(b);
}
function summaryTargets(item: QualityIndicator) {
  return [
    ...new Map(
      item.targetSources.map((t) => [t.value.replace(/\s+/g, ""), t.value]),
    ).values(),
  ];
}

function citationLabel(c: QualityCitation) {
  return `${qualitySources[c.source].title} · hlm. ${c.pages.join(", ")}`;
}
function Citations({ citations }: { citations: QualityCitation[] }) {
  return (
    <ul className="reference-citations">
      {citations.map((c, n) => (
        <li key={n}>
          <FileText size={14} />
          <span>{citationLabel(c)}</span>
        </li>
      ))}
    </ul>
  );
}
function SourceTargets({ item }: { item: QualityIndicator }) {
  return (
    <div className="reference-targets">
      {item.targetSources.map((target, n) => (
        <div key={n}>
          <strong>{target.value}</strong>
          <small>{citationLabel(target.citation)}</small>
        </div>
      ))}
      {!item.targetSources.length && (
        <p className="muted">
          Target tidak tercantum pada dokumen yang tersedia.
        </p>
      )}
    </div>
  );
}
const profileFields: [keyof QualityIndicator, string][] = [
  ["definition", "Definisi operasional"],
  ["numerator", "Numerator (pembilang)"],
  ["denominator", "Denominator (penyebut)"],
  ["formula", "Formula pengukuran"],
  ["inclusion", "Kriteria inklusi"],
  ["exclusion", "Kriteria eksklusi"],
  ["collectionMethod", "Metode pengumpulan"],
  ["collectionPeriod", "Periode pengumpulan"],
  ["analysisPeriod", "Periode analisis"],
  ["dataSource", "Sumber data"],
  ["instrument", "Instrumen pengumpulan"],
  ["sampling", "Metode sampling"],
  ["responsibleRole", "Penanggung jawab (jabatan)"],
];
function Profile({ item }: { item: QualityIndicator }) {
  return (
    <>
      <Card
        title="Target dalam Dokumen"
        subtitle="Target sumber dipertahankan; bukan data hasil pengukuran."
      >
        <div className="reference-card-content">
          <SourceTargets item={item} />
          {item.targetSources.length > 1 && (
            <p className="muted small">
              Baca setiap sumber secara terpisah. Kesamaan atau perbedaan target
              tidak menetapkan SOP yang berlaku.
            </p>
          )}
        </div>
      </Card>
      {item.issues.length > 0 && (
        <section
          className="reference-issues"
          aria-label="Catatan verifikasi sumber"
        >
          <div>
            <TriangleAlert size={18} />
            <h2>Perlu konfirmasi sumber</h2>
          </div>
          <ul>
            {item.issues.map((issue, n) => (
              <li key={n}>{issue}</li>
            ))}
          </ul>
        </section>
      )}
      <Card
        title="Profil Indikator"
        subtitle="Ringkasan referensi dari dokumen terlampir, tanpa data capaian."
      >
        <dl className="reference-profile">
          {profileFields.map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>
                {(item[key] as string | null) || (
                  <span className="reference-missing">
                    Tidak tersedia pada dokumen yang disediakan.
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card
        title="Jejak Sumber"
        subtitle="Nomor halaman mengikuti urutan halaman PDF."
      >
        <div className="reference-card-content">
          <Citations citations={item.citations} />
          <p className="muted small">
            Ringkasan mempertahankan makna sumber; tata bahasa dan spasi
            dirapikan. Metadata dokumen tidak membuktikan persetujuan atau
            keberlakuan SOP terkini.
          </p>
        </div>
      </Card>
    </>
  );
}
function CatalogPrint({
  items,
  detail,
}: {
  items: QualityIndicator[];
  detail?: QualityIndicator;
}) {
  return createPortal(
    <article className="print-document reference-print">
      <div className="print-watermark">REFERENSI</div>
      <header>
        <div className="print-logo">
          <img src="/assets/logo-rsas.png" alt="Logo RSAS" />
        </div>
        <div>
          <h2>RSAU Prof. dr. Abdulrachman Saleh</h2>
          <p>Sagraha Abhipraya Nawasena · Kesehatan untuk Kedaulatan</p>
          <h1>Katalog Referensi Indikator Mutu</h1>
        </div>
      </header>
      <div className="print-meta">
        <strong>PROTOTIPE · BUKAN LAPORAN CAPAIAN</strong>
        <span>{fmt(new Date().toISOString(), "dd MMM yyyy HH:mm")}</span>
      </div>
      <p>
        Target adalah kutipan dokumen, bukan hasil pengukuran. Perbedaan sumber
        dan rincian yang belum tersedia memerlukan konfirmasi Tim Mutu RSAS.
      </p>
      {detail ? (
        <>
          <h3>
            {displayCode(detail)} · {detail.title}
          </h3>
          <p>
            {detail.scope} · {detail.unit}
          </p>
          <h3>Target Sumber</h3>
          {detail.targetSources.map((t, n) => (
            <p key={n}>
              <b>{t.value}</b> — {citationLabel(t.citation)}
            </p>
          ))}
          {detail.issues.length > 0 && (
            <>
              <h3>Catatan Verifikasi</h3>
              <ul>
                {detail.issues.map((issue, n) => (
                  <li key={n}>{issue}</li>
                ))}
              </ul>
            </>
          )}
          <table>
            <tbody>
              {profileFields.map(([key, label]) => (
                <tr key={key}>
                  <th>{label}</th>
                  <td>
                    {(detail[key] as string | null) ||
                      "Tidak tersedia pada dokumen yang disediakan."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Sumber</h3>
          {detail.citations.map((c, n) => (
            <p key={n}>{citationLabel(c)}</p>
          ))}
        </>
      ) : (
        <>
          {items.map((item) => (
            <section key={item.id}>
              <h3>
                {displayCode(item)} · {item.title}
              </h3>
              <p>
                {item.scope} · {item.unit}
              </p>
              {item.targetSources.map((t, n) => (
                <p key={n}>
                  Target: <b>{t.value}</b> — {citationLabel(t.citation)}
                </p>
              ))}
              {item.issues.map((issue, n) => (
                <p key={n}>Catatan: {issue}</p>
              ))}
              <p>Sumber: {item.citations.map(citationLabel).join("; ")}</p>
            </section>
          ))}
          {!items.length && <p>Tidak ada indikator sesuai filter.</p>}
        </>
      )}
      <div className="print-footer">
        RSAS | Quality & Patient Safety Management · Referensi dokumen, tanpa
        data pasien atau capaian aktual.
      </div>
    </article>,
    document.body,
  );
}
export default function QualityCatalog() {
  const { id } = useParams();
  const detail = id ? qualityIndicators.find((i) => i.id === id) : undefined;
  const [query, setQuery] = useState(""),
    [scope, setScope] = useState(""),
    [unit, setUnit] = useState(""),
    [review, setReview] = useState(false),
    [page, setPage] = useState(1);
  const filtered = useMemo(
    () =>
      qualityIndicators.filter(
        (item) =>
          (!scope || item.scope === scope) &&
          (!unit || item.unit === unit) &&
          (!review || item.issues.length > 0) &&
          [
            item.id,
            item.code ?? "",
            item.title,
            item.summaryTitle,
            item.unit,
            item.group,
            item.definition ?? "",
          ]
            .join(" ")
            .toLocaleLowerCase("id")
            .includes(query.toLocaleLowerCase("id")),
      ),
    [query, scope, unit, review],
  );
  const units = [
    ...new Set(
      qualityIndicators
        .filter((i) => !scope || i.scope === scope)
        .map((i) => i.unit),
    ),
  ].sort((a, b) => a.localeCompare(b, "id"));
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const exportItems = (items: QualityIndicator[]) =>
    download(
      "rsas-katalog-referensi-indikator.json",
      JSON.stringify(
        {
          schemaVersion: 1,
          kind: "Katalog referensi indikator mutu",
          exportedAt: new Date().toISOString(),
          notice:
            "Referensi dokumen terlampir. Tidak memuat data capaian, pasien, atau penetapan SOP terkini.",
          sources: qualitySources,
          indicators: items,
        },
        null,
        2,
      ),
    );
  if (id && !detail)
    return (
      <Empty
        title="Indikator tidak ditemukan"
        description="Kode indikator tidak tersedia pada katalog referensi."
      >
        <Link className="btn primary" to="/indikator-mutu">
          Kembali ke katalog
        </Link>
      </Empty>
    );
  if (detail)
    return (
      <>
        <Link to="/indikator-mutu" className="back-link">
          <ArrowLeft size={14} />
          Katalog indikator mutu
        </Link>
        <PageHeading
          eyebrow={`${displayCode(detail)} · REFERENSI DOKUMEN`}
          title={detail.title}
          description={`${detail.scope} · ${detail.unit} · ${detail.group} · ${detail.type}`}
        >
          <button
            className="btn secondary"
            onClick={() => exportItems([detail])}
          >
            <Download size={16} />
            Ekspor Referensi
          </button>
          <button className="btn primary" onClick={() => window.print()}>
            <Printer size={16} />
            Cetak Profil
          </button>
        </PageHeading>
        <div className="info-note">
          <Info size={17} />
          <span>
            Profil ini berisi <b>referensi target dan definisi</b>, bukan angka
            capaian. Target yang berbeda atau informasi yang belum tersedia
            perlu dikonfirmasi Tim Mutu RSAS.
          </span>
        </div>
        <div className="reference-detail">
          {!sameTitle(detail.summaryTitle, detail.title) && (
            <div className="info-note">
              Judul pada daftar ringkas: {detail.summaryTitle}
            </div>
          )}
          <Profile item={detail} />
        </div>
        <CatalogPrint items={[detail]} detail={detail} />
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="RSAS · REFERENSI MUTU"
        title="Katalog Indikator Mutu"
        description="Telusuri indikator prioritas rumah sakit dan unit beserta sumbernya."
      >
        <button className="btn secondary" onClick={() => exportItems(filtered)}>
          <Download size={16} />
          Ekspor Katalog
        </button>
        <button className="btn primary" onClick={() => window.print()}>
          <Printer size={16} />
          Cetak Referensi
        </button>
      </PageHeading>
      <section className="reference-hero">
        <div className="reference-book">
          <BookOpen size={32} strokeWidth={1.4} />
        </div>
        <div>
          <span>BERDASARKAN DOKUMEN TERLAMPIR</span>
          <h2>
            Referensi yang jelas.
            <br />
            Setiap indikator dapat ditelusuri.
          </h2>
          <p>
            Katalog ini tidak menghitung atau mengarang capaian mutu. Definisi
            dan target disajikan bersama sumber halaman dan catatan
            verifikasinya.
          </p>
        </div>
        <span className="reference-tag">
          <FileText size={15} />
          {Object.keys(qualitySources).length} dokumen acuan
        </span>
      </section>
      <div className="reference-stats">
        {[
          [qualityIndicators.length, "Indikator referensi"],
          [
            qualityIndicators.filter((i) => i.scope === "Rumah sakit").length,
            "Prioritas rumah sakit",
          ],
          [
            qualityIndicators.filter((i) => i.scope === "Unit").length,
            "Prioritas unit",
          ],
          [
            qualityIndicators.filter((i) => i.issues.length > 0).length,
            "Memiliki catatan sumber",
          ],
        ].map(([value, label]) => (
          <div className="card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="reference-disclaimer">
        <TriangleAlert size={17} />
        <p>
          <b>Target antar dokumen dapat berbeda.</b> Katalog menampilkan setiap
          nilai sesuai sumber dan tidak menetapkan mana yang berlaku. Nama unit
          mengikuti dokumen; tidak mengubah master unit demo aplikasi.
        </p>
      </div>
      <Card className="reference-list">
        <div className="reference-toolbar">
          <div className="input-icon">
            <Search size={17} />
            <input
              aria-label="Cari indikator mutu"
              value={query}
              placeholder="Cari judul, kode, atau unit..."
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <label className="sr-only" htmlFor="reference-scope">
            Lingkup indikator
          </label>
          <select
            id="reference-scope"
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setUnit("");
              setPage(1);
            }}
          >
            <option value="">Semua lingkup</option>
            <option>Rumah sakit</option>
            <option>Unit</option>
          </select>
          <label className="sr-only" htmlFor="reference-unit">
            Unit referensi
          </label>
          <select
            id="reference-unit"
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua unit</option>
            {units.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className="reference-subtoolbar">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={review}
              onChange={(e) => {
                setReview(e.target.checked);
                setPage(1);
              }}
            />
            Hanya yang memiliki catatan sumber
          </label>
          <span>{filtered.length} indikator</span>
          {(query || scope || unit || review) && (
            <button
              className="text-link"
              onClick={() => {
                setQuery("");
                setScope("");
                setUnit("");
                setReview(false);
                setPage(1);
              }}
            >
              <X size={12} />
              Reset filter
            </button>
          )}
        </div>
        {filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>INDIKATOR REFERENSI</th>
                  <th>LINGKUP / UNIT</th>
                  <th>TARGET SUMBER</th>
                  <th>CATATAN</th>
                  <th>
                    <span className="sr-only">Buka profil</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .slice((current - 1) * 10, current * 10)
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="reference-code">
                          {displayCode(item)}
                        </span>
                        <Link
                          className="table-title"
                          to={`/indikator-mutu/${item.id}`}
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td>
                        <span className="reference-scope">{item.scope}</span>
                        <b className="reference-unit">{item.unit}</b>
                      </td>
                      <td>
                        <div className="reference-target-summary">
                          {summaryTargets(item).map((value) => (
                            <span key={value}>{value}</span>
                          ))}
                          {!item.targetSources.length && (
                            <span>Belum tersedia</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {item.issues.length ? (
                          <span className="badge reference-review">
                            <TriangleAlert size={10} />
                            Perlu konfirmasi
                          </span>
                        ) : (
                          <span className="badge reference-available">
                            Profil tersedia
                          </span>
                        )}
                      </td>
                      <td>
                        <Link
                          className="icon-btn"
                          to={`/indikator-mutu/${item.id}`}
                          aria-label={`Profil ${item.code ?? item.id}`}
                        >
                          <ArrowUpRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Tidak ada indikator sesuai filter"
            description="Coba kata kunci atau lingkup lain."
          />
        )}
        <div className="pagination">
          <span>
            Menampilkan {filtered.length ? (current - 1) * 10 + 1 : 0}–
            {Math.min(current * 10, filtered.length)} dari {filtered.length}{" "}
            indikator
          </span>
          <div>
            <button
              className="icon-btn"
              aria-label="Indikator halaman sebelumnya"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span>
              {current} / {Math.max(1, Math.ceil(filtered.length / 10))}
            </span>
            <button
              className="icon-btn"
              aria-label="Indikator halaman berikutnya"
              disabled={current >= Math.ceil(filtered.length / 10)}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </Card>
      <Card
        title="Dokumen Acuan"
        subtitle="Sumber halaman dicantumkan pada masing-masing profil. PDF asli tidak disalin ke aplikasi."
      >
        <div className="reference-source-grid">
          {Object.values(qualitySources).map((source) => (
            <div key={source.title}>
              <FileText size={22} />
              <h3>{source.title}</h3>
              <span>
                {source.pages} halaman · dokumen {source.year}
              </span>
            </div>
          ))}
        </div>
      </Card>
      <CatalogPrint items={filtered} />
    </>
  );
}
