import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useSearchParams } from "react-router-dom";
import {
  Activity,
  ClipboardList,
  Download,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Logo, Card, Empty } from "../components/ui";
import { api, downloadApi } from "../services/api";
import { Logout } from "./CommitteeAuth";
import { useCommittee } from "../app/committee-session";
import {
  reportKinds,
  reportStatuses,
  statusNames,
  type ReportSummary,
} from "../../shared/report";
import { useUnits } from "../services/useUnits";
const colors = ["#238a9b", "#7a9bd2", "#d1a052", "#d57878", "#9b83bf"];
export function CommitteeLayout() {
  const user = useCommittee();
  return (
    <div className="committee-app">
      <aside className="committee-sidebar">
        <div className="committee-brand">
          <Logo />
          <div>
            <strong>RSAS-SAFETY</strong>
            <small>KOMITE MUTU</small>
          </div>
        </div>
        <nav aria-label="Navigasi Komite Mutu">
          <NavLink to="/komite/dashboard">
            <LayoutDashboard size={18} />
            Dashboard & laporan
          </NavLink>
          <NavLink to="/komite/qr">
            <QrCode size={18} />
            QR pelaporan
          </NavLink>
          <NavLink to="/komite/audit">
            <Activity size={18} />
            Audit trail
          </NavLink>
          <NavLink to="/komite/data">
            <ClipboardList size={18} />
            Migrasi & backup
          </NavLink>
          <NavLink to="/komite/unit">
            <Users size={18} />
            Master unit
          </NavLink>
          <NavLink to="/komite/indikator-mutu">
            <ShieldCheck size={18} />
            Indikator mutu
          </NavLink>
          {user.canManageAccounts && (
            <NavLink to="/komite/akun">
              <Users size={18} />
              Akun Komite Mutu
            </NavLink>
          )}
        </nav>
        <p className="muted small">
          Akses internal · data dari server
          <br />
          Grading manual sesuai SOP
        </p>
      </aside>
      <div className="committee-body">
        <header className="committee-top">
          <span>
            <ShieldCheck size={17} /> Ruang kerja privat
          </span>
          <div>
            <b>{user.name}</b>
            <Logout />
          </div>
        </header>
        <main className="committee-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default function CommitteeDashboard() {
  const { units } = useUnits();
  const [params, setParams] = useSearchParams(),
    query = params.toString(),
    [rows, setRows] = useState<ReportSummary[]>([]),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [notes, setNotes] = useState<
      { id: string; reportId: string; number: string; message: string }[]
    >([]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const [items, notifications] = await Promise.all([
          api<ReportSummary[]>(`/committee/reports?${query}`),
          api<typeof notes>("/committee/notifications"),
        ]);
        if (active) {
          setRows(items);
          setNotes(notifications);
          setError("");
          setLoaded(true);
        }
      } catch (e) {
        if (active) {
          setRows([]);
          setError((e as Error).message);
        }
      }
    };
    void refresh();
    const timer = setInterval(refresh, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [query]);
  const filter = (key: string, value: string) => {
    setParams((current) => {
      if (value) current.set(key, value);
      else current.delete(key);
      return current;
    });
  };
  const valid = useMemo(
    () =>
      rows.filter(
        (r) =>
          !["submitted", "under_review", "needs_revision"].includes(r.status),
      ),
    [rows],
  );
  const group = (key: keyof ReportSummary, items = valid) =>
    Object.entries(
      items.reduce<Record<string, number>>((acc, r) => {
        const name = String(r[key] || "Belum dinilai");
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {}),
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));
  const hospitalMonth = (value: string) =>
    new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 7);
  const now = new Date(Date.now() + 7 * 3600000),
    monthKey = (d: Date) => d.toISOString().slice(0, 7),
    months = Array.from(
      { length: 12 },
      (_, i) =>
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1)),
    );
  const monthly = months.map((d) => ({
    name: monthKey(d),
    value: valid.filter((r) => hospitalMonth(r.incident_at) === monthKey(d))
      .length,
  }));
  const yearly = Object.entries(
    valid.reduce<Record<string, number>>((a, r) => {
      const y = hospitalMonth(r.incident_at).slice(0, 4);
      a[y] = (a[y] || 0) + 1;
      return a;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }));
  const late = rows.filter(
    (r) =>
      r.deadline &&
      new Date(r.deadline).getTime() < Date.now() &&
      !["closed", "archived"].includes(r.status),
  );
  const onTime = valid.filter(
    (r) =>
      new Date(r.created_at).getTime() - new Date(r.incident_at).getTime() <=
      48 * 3600000,
  ).length;
  const repeated = Object.entries(
    valid.reduce<Record<string, number>>((a, r) => {
      const key = `${r.unit} · ${r.category}`;
      a[key] = (a[key] || 0) + 1;
      return a;
    }, {}),
  ).filter(([, n]) => n > 1);
  const thisMonth = valid.filter(
      (r) => hospitalMonth(r.incident_at) === monthKey(now),
    ).length,
    lastMonth = valid.filter(
      (r) =>
        hospitalMonth(r.incident_at) ===
        monthKey(
          new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)),
        ),
    ).length;
  const chart = (
    title: string,
    data: { name: string; value: number }[],
    kind: "line" | "bar" | "pie",
    onSelect?: (name: string) => void,
  ) => (
    <Card title={title}>
      <div className="secure-chart">
        {data.length &&
        (valid.length ||
          (title === "Rekap status investigasi" && rows.length)) ? (
          <ResponsiveContainer width="100%" height={245}>
            {kind === "pie" ? (
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  onClick={(d) => {
                    if (d.name) onSelect?.(String(d.name));
                  }}
                >
                  {data.map((d, i) => (
                    <Cell key={d.name} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : kind === "line" ? (
              <LineChart
                data={data}
                onClick={(e: any) => {
                  if (e?.activeLabel) onSelect?.(String(e.activeLabel));
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="value"
                  stroke="#238a9b"
                  strokeWidth={3}
                />
              </LineChart>
            ) : (
              <BarChart
                data={data}
                onClick={(e: any) => {
                  if (e?.activeLabel) onSelect?.(String(e.activeLabel));
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  isAnimationActive={false}
                  dataKey="value"
                  fill="#238a9b"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <Empty description="Belum ada laporan tervalidasi pada filter ini." />
        )}
      </div>
      {onSelect && (
        <div className="chart-drill">
          {data.map((d) => (
            <button
              className="small-chip"
              key={d.name}
              onClick={() => onSelect(d.name)}
            >
              {d.name}: {d.value}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KOMITE MUTU · SELURUH UNIT</div>
          <h1>Dashboard Keselamatan Pasien</h1>
          <p>
            Laporan masuk dari formulir publik · diperbarui setiap 10 detik.
          </p>
        </div>
        <div className="button-row">
          {["pdf", "xlsx"].map((format) => (
            <button
              key={format}
              className="btn secondary"
              onClick={() =>
                downloadApi(
                  `/committee/export/${format}?${query}`,
                  `rsas-ikp.${format}`,
                ).catch((e) => setError(e.message))
              }
            >
              <Download size={16} />
              Ekspor {format === "xlsx" ? "Excel" : "PDF"}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p className="warning-note" role="alert">
          {error}
        </p>
      )}
      <section className="card committee-filters" aria-label="Filter laporan">
        <label className="field">
          Dari tanggal
          <input
            type="date"
            value={params.get("from") || ""}
            onChange={(e) => filter("from", e.target.value)}
          />
        </label>
        <label className="field">
          Sampai tanggal
          <input
            type="date"
            value={params.get("to") || ""}
            onChange={(e) => filter("to", e.target.value)}
          />
        </label>
        {(
          [
            [
              "unit",
              "Unit",
              units.map((u) => ({ value: u.id, label: u.name })),
            ],
            [
              "kind",
              "Jenis",
              reportKinds.map((value) => ({ value, label: value })),
            ],
            [
              "grade",
              "Grading",
              ["BIRU", "HIJAU", "KUNING", "MERAH"].map((value) => ({
                value,
                label: value,
              })),
            ],
            [
              "status",
              "Status",
              reportStatuses.map((value) => ({
                value,
                label: statusNames[value],
              })),
            ],
          ] as const
        ).map(([key, label, options]) => (
          <label className="field" key={key}>
            {label}
            <select
              aria-label={label}
              value={params.get(key) || ""}
              onChange={(e) => filter(key, e.target.value)}
            >
              <option value="">Semua</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button className="btn secondary" onClick={() => setParams({})}>
          Reset filter
        </button>
      </section>
      <div className="kpi-grid">
        {[
          ["Total laporan", rows.length, ""],
          [
            "Menunggu validasi",
            rows.filter((r) => ["submitted", "under_review"].includes(r.status))
              .length,
            "submitted",
          ],
          [
            "Dalam investigasi",
            rows.filter((r) => r.status === "investigation").length,
            "investigation",
          ],
          [
            "Selesai",
            rows.filter((r) => ["closed", "archived"].includes(r.status))
              .length,
            "closed",
          ],
        ].map(([label, value, status]) => (
          <button
            className="card kpi"
            key={label}
            onClick={() => filter("status", String(status))}
          >
            <span className="kpi-label">{label}</span>
            <strong>{loaded ? value : "…"}</strong>
          </button>
        ))}
      </div>
      <div className="info-note">
        {late.length} laporan melewati tenggat investigasi ·{" "}
        {valid.length
          ? `${Math.round((onTime / valid.length) * 100)}% laporan tervalidasi dikirim ≤48 jam`
          : "Ketepatan pelaporan belum dapat dihitung"}
        . Tren di bawah menggunakan laporan yang telah divalidasi. Denominator
        pelayanan belum tersedia; angka insiden per pelayanan tidak dihitung.
      </div>
      <div className="chart-grid">
        {chart("Tren bulanan (12 bulan)", monthly, "line", (name) => {
          setParams((p) => {
            p.set("from", `${name}-01`);
            const d = new Date(`${name}-01T00:00:00Z`);
            d.setUTCMonth(d.getUTCMonth() + 1);
            d.setUTCDate(0);
            p.set("to", d.toISOString().slice(0, 10));
            return p;
          });
        })}
        {chart("Tren tahunan", yearly, "bar", (name) => {
          setParams((p) => {
            p.set("from", `${name}-01-01`);
            p.set("to", `${name}-12-31`);
            return p;
          });
        })}
        {chart("Distribusi unit", group("unit"), "bar", (name) =>
          filter("unit", name),
        )}
        {chart("Kategori jenis insiden", group("kind"), "pie", (name) =>
          filter("kind", name),
        )}
        {chart("Grading risiko manual", group("grade"), "bar", (name) => {
          if (name !== "Belum dinilai") filter("grade", name);
        })}
        {chart(
          "Rekap status investigasi",
          group("status", rows),
          "bar",
          (name) => filter("status", name),
        )}
      </div>
      <Card title="Perbandingan periode">
        <p>
          Bulan berjalan: {thisMonth} · Bulan sebelumnya: {lastMonth} laporan
          tervalidasi pada filter aktif. Bulan berjalan belum merupakan periode
          lengkap.
        </p>
      </Card>
      <Card title="Heatmap jenis kejadian per unit">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Unit</th>
                {reportKinds.map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id}>
                  <th>{u.name}</th>
                  {reportKinds.map((k) => {
                    const count = valid.filter(
                      (r) => r.unit === u.id && r.kind === k,
                    ).length;
                    return (
                      <td key={k}>
                        <button
                          className={`heat-cell ${count ? "filled" : ""}`}
                          onClick={() =>
                            setParams((p) => {
                              p.set("unit", u.id);
                              p.set("kind", k);
                              return p;
                            })
                          }
                          aria-label={`${u.name} ${k}: ${count}`}
                        >
                          {count}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Daftar laporan">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nomor laporan</th>
                <th>Unit</th>
                <th>Jenis</th>
                <th>Grading</th>
                <th>Status</th>
                <th>Tenggat investigasi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link className="text-link" to={`/komite/laporan/${r.id}`}>
                      {r.number}
                    </Link>
                  </td>
                  <td>{units.find((u) => u.id === r.unit)?.name || r.unit}</td>
                  <td>{r.kind}</td>
                  <td>{r.grade || "Belum dinilai"}</td>
                  <td>{statusNames[r.status]}</td>
                  <td>{r.deadline?.slice(0, 10) || "Belum ditetapkan"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loaded && !rows.length && (
          <Empty description="Belum ada laporan pada filter ini. Laporan baru akan muncul otomatis." />
        )}
      </Card>
      <div className="chart-grid">
        <Card title="Kelompok kejadian berulang">
          {repeated.length ? (
            repeated.map(([key, n]) => (
              <p key={key}>
                {key} · {n} laporan
              </p>
            ))
          ) : (
            <Empty description="Belum ada kelompok berulang pada filter ini." />
          )}
          <p className="muted small">
            Pengelompokan unit dan kategori; bukan kesimpulan penyebab klinis.
          </p>
        </Card>
        <Card title="Notifikasi internal">
          {notes.length ? (
            notes.slice(0, 30).map((n) => (
              <Link
                className="committee-notice"
                key={n.id}
                to={`/komite/laporan/${n.reportId}`}
              >
                <b>{n.number}</b>
                <span>{n.message}</span>
              </Link>
            ))
          ) : (
            <Empty description="Tidak ada notifikasi aktif." />
          )}
        </Card>
      </div>
    </>
  );
}
