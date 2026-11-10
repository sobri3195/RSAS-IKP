import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  X,
  ArrowUpRight,
  Inbox,
  ChevronRight,
  ShieldCheck,
  Printer,
} from "lucide-react";
import { Link } from "react-router-dom";
import { gradeLabel, statusLabel, fmt, deadline } from "../utils/domain";
import type { Incident } from "../schemas/models";
export function Grade({
  grade,
}: {
  grade: Incident["riskAssessment"]["grade"];
}) {
  return (
    <span className={`badge grade ${grade?.toLowerCase() ?? "pending"}`}>
      <i />
      {grade ? gradeLabel[grade] : "Belum dinilai"}
    </span>
  );
}
export function StatusBadge({ status }: { status: Incident["status"] }) {
  return (
    <span className={`badge status-${status.toLowerCase()}`}>
      <i />
      {statusLabel[status]}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow ?? "RSAS · PATIENT SAFETY"}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Card({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({
  title = "Belum ada data",
  description = "Data yang sesuai akan tampil di sini.",
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <div>
        <Inbox size={27} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-btn"
          aria-label="Tutup dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  onClose,
  danger = false,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="modal-description">{description}</p>
      <div className="modal-actions">
        <button className="btn secondary" onClick={onClose}>
          Batal
        </button>
        <button
          className={`btn ${danger ? "danger" : "primary"}`}
          onClick={onConfirm}
        >
          Ya, lanjutkan
        </button>
      </div>
    </Modal>
  );
}
export function Logo({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`logo-placeholder ${large ? "large" : ""}`}
      title="Placeholder — ganti dengan logo resmi RSAS"
    >
      <img
        src="/assets/logo-rsas.svg"
        alt="Tempat logo resmi RSAS"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <span>
        LOGO
        <br />
        RSAS
      </span>
    </div>
  );
}
export function Deadline({ incident }: { incident: Incident }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const d = deadline(incident, now);
  return (
    <span className={`deadline ${d.late ? "late" : ""}`}>
      {!d.valid
        ? "Waktu belum diisi"
        : incident.submittedAt
          ? d.late
            ? `Terlambat ${d.hours} jam`
            : "Dilaporkan ≤ 48 jam"
          : d.late
            ? `Lewat ${d.hours} jam`
            : `Sisa ${d.hours} jam`}
    </span>
  );
}
export function IncidentTable({
  items,
  compact = false,
}: {
  items: Incident[];
  compact?: boolean;
}) {
  return items.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>LAPORAN INSIDEN</th>
            <th>UNIT PELAPOR</th>
            <th>JENIS</th>
            <th>GRADING RISIKO</th>
            <th>STATUS</th>
            {!compact && <th>PELAPORAN</th>}
            <th>
              <span className="sr-only">Detail</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>
                <Link to={`/laporan/${i.id}`} className="table-title">
                  {i.incident.title || "Laporan tanpa judul"}
                </Link>
                <div className="table-meta">
                  {i.displayNumber}
                  <span>·</span>
                  {fmt(i.createdAt, "dd MMM yyyy")}
                </div>
              </td>
              <td>
                <span className="unit-name">
                  {i.incident.unit || "Belum diisi"}
                </span>
              </td>
              <td>
                <span className={`kind kind-${i.incident.kind.toLowerCase()}`}>
                  {i.incident.kind || "—"}
                </span>
              </td>
              <td>
                <Grade grade={i.riskAssessment.grade} />
              </td>
              <td>
                <StatusBadge status={i.status} />
              </td>
              {!compact && (
                <td>
                  <Deadline incident={i} />
                </td>
              )}
              <td>
                <Link
                  className="icon-btn"
                  aria-label={`Detail ${i.displayNumber}`}
                  to={`/laporan/${i.id}`}
                >
                  <ChevronRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="Tidak ada laporan"
      description="Ubah filter atau buat laporan demo pertama Anda."
    />
  );
}
export function DemoNote() {
  return (
    <div className="info-note">
      <ShieldCheck size={17} />
      <span>
        <strong>DATA DEMO.</strong> Data sintetis untuk simulasi. Tidak untuk
        pengambilan keputusan klinis.
      </span>
    </div>
  );
}
export function PrintButton() {
  return (
    <button className="btn secondary" onClick={() => window.print()}>
      <Printer size={16} />
      Cetak laporan
    </button>
  );
}
export const MoreLink = ({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) => (
  <Link className="text-link" to={to}>
    {children}
    <ArrowUpRight size={15} />
  </Link>
);
