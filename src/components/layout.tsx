import { useState, useEffect } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus2,
  Files,
  ClipboardCheck,
  ShieldCheck,
  GitBranch,
  ListChecks,
  ChartNoAxesCombined,
  FileChartColumn,
  History,
  Building2,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  Menu,
  Bell,
  Search,
  X,
  ArrowRight,
  LogOut,
  PanelLeftClose,
  Database,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../app/store";
import { roles } from "../schemas/models";
import { Logo, Modal } from "./ui";
import { deadline, today } from "../utils/domain";
const nav = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Buat Laporan", path: "/laporan/baru", icon: FilePlus2 },
  { label: "Semua Laporan", path: "/laporan", icon: Files },
  { label: "Verifikasi Insiden", path: "/verifikasi", icon: ClipboardCheck },
  { label: "Grading Risiko", path: "/grading", icon: ShieldCheck },
  { label: "Investigasi & RCA", path: "/investigasi", icon: GitBranch },
  { label: "Tindak Lanjut / CAPA", path: "/tindak-lanjut", icon: ListChecks },
  {
    label: "Analisis & Statistik",
    path: "/analisis",
    icon: ChartNoAxesCombined,
  },
  { label: "Laporan Mutu", path: "/mutu", icon: FileChartColumn },
  { label: "Riwayat Aktivitas", path: "/aktivitas", icon: History },
];
export function Layout() {
  const { db, commit, log, error } = useStore();
  const location = useLocation();
  const [, refreshClock] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => refreshClock((n) => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  const [mobile, setMobile] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [notifications, setNotifications] = useState(false),
    [roleOpen, setRoleOpen] = useState(false),
    [query, setQuery] = useState("");
  const alerts = db.incidents.flatMap((i) => {
    const msgs: string[] = [];
    if (i.status === "DRAFT") msgs.push("Draft belum lengkap / belum dikirim");
    if (["DILAPORKAN", "DITERIMA"].includes(i.status))
      msgs.push("Verifikasi tertunda");
    if (!i.riskAssessment.grade) msgs.push("Grading belum ditetapkan");
    if (i.status === "INVESTIGASI") msgs.push("Investigasi belum selesai");
    const d = deadline(i);
    if (d.valid && (!i.submittedAt || d.late))
      msgs.push(
        d.late
          ? `Tenggat 48 jam terlewati (${d.hours} jam)`
          : `Sisa pelaporan ${d.hours} jam`,
      );
    return msgs.map((text) => ({ id: i.id, title: i.displayNumber, text }));
  });
  db.actions
    .filter((a) => a.status !== "Selesai" && a.target < today())
    .forEach((a) =>
      alerts.push({
        id: a.incidentId,
        title: "CAPA melewati target",
        text: a.corrective,
      }),
    );
  const current =
    nav.find((n) => n.path === location.pathname)?.label ??
    "Keselamatan pasien";
  return (
    <div className={`app ${collapsed ? "collapsed" : ""}`}>
      <a className="skip-link" href="#main">
        Lewati ke konten
      </a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Tutup menu"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <Link to="/" className="brand">
          <Logo />
          <div>
            <strong>
              RSAS<span>-SAFETY</span>
            </strong>
            <small>QUALITY & PATIENT SAFETY</small>
          </div>
        </Link>
        <div className="institution">
          <div className="institution-icon">
            <Building2 size={17} />
          </div>
          <div>
            <b>
              RSAU Prof. dr.
              <br />
              Abdulrachman Saleh
            </b>
            <small>Kesehatan untuk Kedaulatan</small>
          </div>
        </div>
        <div className="nav-caption">RUANG KERJA</div>
        <nav aria-label="Navigasi utama">
          {nav.map((n, k) => (
            <div key={n.path}>
              {k === 7 && (
                <div className="nav-caption">MONITORING & EVALUASI</div>
              )}
              <NavLink
                to={n.path}
                end
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
                title={n.label}
                onClick={() => setMobile(false)}
              >
                <n.icon size={18} />
                <span>{n.label}</span>
                {k === 3 &&
                  db.incidents.some((i) => i.status === "DILAPORKAN") && (
                    <em>
                      {
                        db.incidents.filter((i) => i.status === "DILAPORKAN")
                          .length
                      }
                    </em>
                  )}
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink
            to="/unit"
            className="nav-item"
            onClick={() => setMobile(false)}
          >
            <Building2 size={18} />
            <span>Manajemen Unit</span>
          </NavLink>
          <NavLink
            to="/pengaturan"
            className="nav-item"
            onClick={() => setMobile(false)}
          >
            <Settings size={18} />
            <span>Pengaturan & Data Demo</span>
          </NavLink>
          <NavLink
            to="/bantuan"
            className="nav-item"
            onClick={() => setMobile(false)}
          >
            <HelpCircle size={18} />
            <span>Bantuan & Panduan</span>
          </NavLink>
          <div className="sidebar-motto">
            <ShieldCheck size={20} />
            <div>
              <b>Sagraha Abhipraya Nawasena</b>
              <small>Kesehatan untuk Kedaulatan</small>
            </div>
          </div>
          <button
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Ciutkan atau perluas sidebar"
          >
            <PanelLeftClose size={16} />
            <span>Ciutkan menu</span>
            <ChevronLeft size={14} />
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-toggle"
              onClick={() => setMobile(true)}
              aria-label="Buka menu"
            >
              <Menu size={22} />
            </button>
            <span>Ruang kerja RSAS</span>
            <ChevronRight size={14} />
            <b>{current}</b>
          </div>
          <div className="top-actions">
            <div className="global-search">
              <Search size={16} />
              <input
                aria-label="Cari laporan global"
                placeholder="Cari laporan..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>⌕</kbd>
              {query && (
                <div className="search-results">
                  {db.incidents
                    .filter((i) =>
                      `${i.displayNumber} ${i.incident.title}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .slice(0, 5)
                    .map((i) => (
                      <Link
                        to={`/laporan/${i.id}`}
                        key={i.id}
                        onClick={() => setQuery("")}
                      >
                        {i.incident.title}
                        <small>{i.displayNumber}</small>
                      </Link>
                    ))}
                  {!db.incidents.some((i) =>
                    `${i.displayNumber} ${i.incident.title}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  ) && <p>Tidak ada laporan ditemukan.</p>}
                </div>
              )}
            </div>
            <span className="demo-chip">
              <i />
              MODE DEMO
            </span>
            <button
              className="notification-button icon-btn"
              aria-label="Buka notifikasi demo"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={20} />
              {alerts.length > 0 && <i />}
            </button>
            <button
              className="profile"
              onClick={() => setRoleOpen(true)}
              aria-label="Ganti role simulasi"
            >
              <span className="avatar">MD</span>
              <span>
                <b>{db.settings.name}</b>
                <small>{db.settings.role}</small>
              </span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>
        <div className="demo-banner">
          <ShieldCheck size={14} />
          <span>
            <strong>Mode Demonstrasi:</strong> Gunakan data sintetis. Sistem
            frontend/localStorage belum diperuntukkan untuk data pasien nyata.
          </span>
          <Link to="/bantuan">
            Pelajari lebih lanjut <ArrowRight size={12} />
          </Link>
        </div>
        {error && (
          <div className="storage-error" role="alert">
            {error} <Link to="/pengaturan">Buka pemulihan data</Link>
          </div>
        )}
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer>
          <span>
            <b>RSAS</b> | Quality & Patient Safety Management
          </span>
          <span>
            Sagraha Abhipraya Nawasena <i>·</i>{" "}
            <span className="footer-version">Prototype v1.0</span>
          </span>
        </footer>
      </div>
      {notifications && (
        <div className="notification-panel">
          <div className="modal-head">
            <h2>
              Notifikasi demo <span className="badge">{alerts.length}</span>
            </h2>
            <button
              className="icon-btn"
              onClick={() => setNotifications(false)}
              aria-label="Tutup notifikasi"
            >
              <X size={18} />
            </button>
          </div>
          <p className="muted">
            Berdasarkan jam perangkat. Bukan notifikasi resmi dan tidak dikirim
            melalui email/SMS.
          </p>
          <div className="notification-list">
            {alerts.map((a, n) => (
              <Link
                key={n}
                to={`/laporan/${a.id}`}
                onClick={() => setNotifications(false)}
              >
                <span className="notification-dot" />
                <div>
                  <b>{a.title}</b>
                  <p>{a.text}</p>
                </div>
              </Link>
            ))}
            {!alerts.length && <p>Tidak ada notifikasi tertunda.</p>}
          </div>
        </div>
      )}
      {roleOpen && (
        <Modal title="Ruang kerja simulasi" onClose={() => setRoleOpen(false)}>
          <div className="info-note">
            <ShieldCheck size={20} />
            Role switcher hanya simulasi UI, bukan autentikasi atau otorisasi
            aman.
          </div>
          <label className="field">
            Nama tampilan demo
            <input
              value={db.settings.name}
              onChange={(e) =>
                commit({
                  ...db,
                  settings: { ...db.settings, name: e.target.value },
                })
              }
            />
          </label>
          <label className="field">
            Role demo
            <select
              value={db.settings.role}
              onChange={(e) => {
                commit(
                  log(
                    {
                      ...db,
                      settings: {
                        ...db.settings,
                        role: e.target.value as (typeof roles)[number],
                      },
                    },
                    "Role simulasi diubah",
                  ),
                );
              }}
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <div className="modal-actions">
            <Link
              className="btn secondary"
              to="/login"
              onClick={() => setRoleOpen(false)}
            >
              <LogOut size={16} />
              Halaman masuk demo
            </Link>
            <button className="btn primary" onClick={() => setRoleOpen(false)}>
              Selesai
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
