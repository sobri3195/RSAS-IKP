import { useRef, useState } from "react";
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Database,
  ShieldCheck,
  Plus,
  Pencil,
  Save,
  Building2,
} from "lucide-react";
import { useStore } from "../app/store";
import { PageHeading, Card, Confirm, Empty } from "../components/ui";
import {
  exportBackup,
  importBackup,
  rawBackup,
  save,
} from "../services/storage";
import { seed } from "../data/seed";
import { download, fmt } from "../utils/domain";
import type { Database as DB } from "../schemas/models";
export function Settings() {
  const { db, commit, log, notify, error, clearError } = useStore();
  const [confirm, setConfirm] = useState<"reset" | "clear" | "restore" | null>(
      null,
    ),
    [incoming, setIncoming] = useState<DB | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const replace = (next: DB) => {
    try {
      save(next);
      clearError();
      notify("Data demo berhasil dipulihkan.");
      setConfirm(null);
    } catch (e) {
      notify((e as Error).message);
    }
  };
  return (
    <>
      <PageHeading
        title="Pengaturan & Data Demo"
        description="Kelola penyimpanan lokal, cadangan, dan konfigurasi simulasi."
      />
      <Card
        title="Penyimpanan Data Demo"
        subtitle="Browser ini · localStorage · Schema v1"
      >
        <div className="storage-summary">
          <span className="kpi-icon blue">
            <Database size={24} />
          </span>
          <div>
            <b>
              {db.incidents.length} laporan · {db.investigations.length}{" "}
              investigasi · {db.actions.length} CAPA
            </b>
            <p>
              Data tetap tersedia pada browser dan origin yang sama. Tidak
              disinkronkan antarperangkat.
            </p>
          </div>
        </div>
        <div className="settings-actions">
          <div>
            <h3>Ekspor backup JSON</h3>
            <p>Berisi seluruh data sintetis dan konfigurasi demo.</p>
            <button
              className="btn secondary"
              onClick={() =>
                download("rsas-safety-demo-backup.json", exportBackup(db))
              }
            >
              <Download size={16} />
              Ekspor JSON
            </button>
          </div>
          <div>
            <h3>Pulihkan backup demo</h3>
            <p>
              Validasi schema dan referensi dilakukan sebelum mengganti data.
            </p>
            <input
              ref={input}
              className="sr-only"
              type="file"
              accept="application/json,.json"
              aria-label="Berkas backup JSON"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 15_000_000)
                    throw new Error("Ukuran maksimum 15 MB.");
                  const parsed = importBackup(await file.text());
                  setIncoming(parsed);
                  setConfirm("restore");
                } catch (err) {
                  notify((err as Error).message);
                }
                e.target.value = "";
              }}
            />
            <button
              className="btn secondary"
              onClick={() => input.current?.click()}
            >
              <Upload size={16} />
              Impor JSON
            </button>
          </div>
        </div>
        {error && (
          <div className="warning-note">
            <p>{error}</p>
            <button
              className="btn secondary"
              onClick={() =>
                download("rsas-safety-raw-recovery.json", rawBackup())
              }
            >
              Ekspor penyimpanan mentah
            </button>
          </div>
        )}
      </Card>
      <Card title="Grading Risiko & Matriks SOP">
        <div className="info-note">
          <ShieldCheck size={19} />
          <span>
            Mode aktif: <b>manual</b>. Matriks resmi RSAS belum disetujui /
            dikonfigurasi. Skor otomatis dinonaktifkan.
          </span>
        </div>
        <p className="muted">
          Konfigurasi matriks operasional memerlukan validasi SOP institusi dan
          pengembangan terpisah. Empat grading manual tersedia pada halaman
          Grading Risiko.
        </p>
      </Card>
      <Card title="Identitas & Logo Resmi">
        <p>RSAS-SAFETY · RSAU Prof. dr. Abdulrachman Saleh</p>
        <p>Sagraha Abhipraya Nawasena · Kesehatan untuk Kedaulatan</p>
        <p className="muted">
          Logo RSAS pada aplikasi, dokumen cetak, dan ikon browser menggunakan
          gambar yang disediakan institusi melalui repository proyek.
        </p>
      </Card>
      <Card title="Kelola Ulang Data" className="danger-zone">
        <p className="muted">
          Ekspor cadangan terlebih dahulu. Tindakan berikut memerlukan
          konfirmasi.
        </p>
        <div className="button-row">
          <button className="btn secondary" onClick={() => setConfirm("reset")}>
            <RotateCcw size={16} />
            Reset ke 15 Contoh Insiden
          </button>
          <button
            className="btn danger-outline"
            onClick={() => setConfirm("clear")}
          >
            <Trash2 size={16} />
            Hapus Semua Laporan Demo
          </button>
        </div>
      </Card>
      <div className="info-note">
        Frontend ini tidak menyediakan autentikasi aman, otorisasi server, audit
        trail yang tidak dapat diubah, atau perlindungan data pasien nyata.
        Jangan memasukkan data pribadi atau password nyata.
      </div>
      {confirm && (
        <Confirm
          danger={confirm !== "restore"}
          title={
            confirm === "reset"
              ? "Reset seluruh data demo?"
              : confirm === "clear"
                ? "Hapus semua laporan demo?"
                : "Ganti dengan data backup?"
          }
          description={
            confirm === "restore"
              ? `${incoming?.incidents.length} laporan tervalidasi akan menggantikan seluruh data lokal, termasuk pengaturan dan unit. Hanya impor data sintetis.`
              : confirm === "reset"
                ? "Seluruh laporan, RCA, CAPA, aktivitas, dan master unit akan diganti dengan 15 contoh sintetis awal."
                : "Seluruh laporan, RCA, CAPA, dan aktivitas akan dihapus. Pengaturan dan unit dipertahankan."
          }
          onClose={() => setConfirm(null)}
          onConfirm={() =>
            replace(
              confirm === "reset"
                ? seed()
                : confirm === "restore"
                  ? incoming!
                  : {
                      ...db,
                      incidents: [],
                      investigations: [],
                      actions: [],
                      activity: [],
                    },
            )
          }
        />
      )}
    </>
  );
}
export function Units() {
  const { db, commit, log, notify } = useStore();
  const [name, setName] = useState(""),
    [old, setOld] = useState<string | null>(null),
    [remove, setRemove] = useState<string | null>(null);
  return (
    <>
      <PageHeading
        title="Manajemen Unit"
        description="Master unit sintetis yang dapat disesuaikan untuk kebutuhan demonstrasi."
      />
      <div className="info-note">
        <Building2 size={18} />
        Daftar berikut adalah contoh; tidak menyatakan unit-unit ini tersedia
        secara resmi di RSAS.
      </div>
      <Card title={old ? "Ubah Nama Unit" : "Tambah Unit Demo"}>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            const clean = name.trim();
            if (!clean) return;
            if (db.units.some((u) => u === clean && u !== old))
              return notify("Nama unit sudah digunakan.");
            const remap = (s: string) => (s === old ? clean : s);
            const next = {
              ...db,
              units: old ? db.units.map(remap) : [...db.units, clean],
              incidents: db.incidents.map((i) => ({
                ...i,
                incident: {
                  ...i.incident,
                  unit: remap(i.incident.unit),
                  relatedUnit: remap(i.incident.relatedUnit),
                  previousUnit: remap(i.incident.previousUnit),
                },
              })),
              actions: db.actions.map((a) => ({ ...a, unit: remap(a.unit) })),
            };
            if (
              commit(
                log(
                  next,
                  old ? "Master unit diperbarui" : "Master unit ditambahkan",
                ),
              )
            ) {
              setName("");
              setOld(null);
              notify("Master unit tersimpan.");
            }
          }}
        >
          <label className="field">
            Nama unit
            <input
              required
              value={name}
              placeholder="Contoh: Unit Simulasi"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button className="btn primary">
            <Plus size={16} />
            {old ? "Simpan Perubahan" : "Tambah Unit"}
          </button>
          {old && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setOld(null);
                setName("");
              }}
            >
              Batal
            </button>
          )}
        </form>
      </Card>
      <Card title={`${db.units.length} Unit Tersimpan`}>
        <div className="unit-list">
          {db.units.map((u, n) => (
            <div key={u}>
              <span className="unit-number">
                {String(n + 1).padStart(2, "0")}
              </span>
              <div>
                <b>{u}</b>
                <small>
                  {db.incidents.filter((i) => i.incident.unit === u).length}{" "}
                  laporan tempat insiden
                </small>
              </div>
              <button
                className="icon-btn"
                aria-label={`Edit ${u}`}
                onClick={() => {
                  setOld(u);
                  setName(u);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label={`Hapus ${u}`}
                onClick={() => {
                  if (db.units.length <= 1)
                    return notify("Setidaknya satu unit harus tersedia.");
                  if (
                    db.incidents.some((i) =>
                      [
                        i.incident.unit,
                        i.incident.relatedUnit,
                        i.incident.previousUnit,
                      ].includes(u),
                    ) ||
                    db.actions.some((a) => a.unit === u)
                  )
                    return notify(
                      "Unit masih direferensikan laporan / CAPA. Ubah nama untuk memperbarui semua referensi.",
                    );
                  setRemove(u);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>
      {remove && (
        <Confirm
          danger
          title="Hapus unit demo?"
          description={`Unit ${remove} akan dihapus dari master.`}
          onClose={() => setRemove(null)}
          onConfirm={() => {
            if (
              commit(
                log(
                  { ...db, units: db.units.filter((u) => u !== remove) },
                  "Master unit dihapus",
                ),
              )
            )
              setRemove(null);
          }}
        />
      )}
    </>
  );
}
export function ActivityPage() {
  const { db } = useStore();
  const [query, setQuery] = useState("");
  const rows = db.activity.filter((a) =>
    `${a.text} ${a.actor}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Riwayat Aktivitas Demo"
        description="Catatan perubahan pada browser ini, bukan audit trail yang tidak dapat diubah."
      />
      <Card
        title="Aktivitas Lokal"
        action={
          <input
            aria-label="Cari aktivitas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari aktivitas..."
          />
        }
      >
        <div className="timeline">
          {rows.slice(0, 100).map((a) => (
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
        {!rows.length && <Empty title="Tidak ada aktivitas" />}
        {rows.length > 100 && (
          <p className="muted">
            Menampilkan 100 aktivitas terakhir. Backup JSON memuat seluruh
            riwayat.
          </p>
        )}
      </Card>
    </>
  );
}
