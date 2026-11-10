import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../app/store";
import { Card, IncidentTable, PageHeading } from "../components/ui";
import { Filters, useFilters } from "../components/filters";
import { statuses } from "../schemas/models";
import { statusLabel, download, csv } from "../utils/domain";
export default function Reports({
  verification = false,
}: {
  verification?: boolean;
}) {
  const { db } = useStore();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState(params.get("status") ?? ""),
    [page, setPage] = useState(1);
  const f = useFilters(
    verification
      ? db.incidents.filter((i) =>
          ["DILAPORKAN", "DITERIMA", "DIKEMBALIKAN_UNTUK_REVISI"].includes(
            i.status,
          ),
        )
      : db.incidents,
  );
  const matches = f.items
    .filter(
      (i) =>
        (!status || i.status === status) &&
        `${i.displayNumber} ${i.incident.title || "Laporan tanpa judul"} ${i.incident.unit}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pages = Math.max(1, Math.ceil(matches.length / 8)),
    p = Math.min(page, pages);
  return (
    <>
      <PageHeading
        title={verification ? "Verifikasi Insiden" : "Semua Laporan Insiden"}
        description={
          verification
            ? "Tinjau kelengkapan, terima laporan, atau kembalikan untuk revisi."
            : "Kelola setiap laporan, dari pencatatan awal sampai perbaikan."
        }
      >
        <button
          className="btn secondary"
          onClick={() =>
            download(
              "rsas-laporan-demo.csv",
              csv(matches),
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download size={16} />
          Ekspor CSV
        </button>
        <Link className="btn primary" to="/laporan/baru">
          <Plus size={17} />
          Buat Laporan
        </Link>
      </PageHeading>
      <Filters f={f} />
      <Card className="table-card">
        <div className="list-toolbar">
          <div className="input-icon">
            <Search size={17} />
            <input
              aria-label="Cari nomor atau judul laporan"
              placeholder="Cari nomor atau judul laporan..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="Filter status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua status</option>
            {statuses.map((s) => (
              <option value={s} key={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
          <span>{matches.length} laporan demo</span>
        </div>
        <IncidentTable items={matches.slice((p - 1) * 8, p * 8)} />
        <div className="pagination">
          <span>
            Menampilkan {matches.length ? (p - 1) * 8 + 1 : 0}–
            {Math.min(p * 8, matches.length)} dari {matches.length} laporan
          </span>
          <div>
            <button
              className="icon-btn"
              disabled={p === 1}
              onClick={() => setPage(p - 1)}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={17} />
            </button>
            <span>
              Halaman {p} / {pages}
            </span>
            <button
              className="icon-btn"
              disabled={p === pages}
              onClick={() => setPage(p + 1)}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}
