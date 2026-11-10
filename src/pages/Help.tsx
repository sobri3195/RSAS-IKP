import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  FilePlus2,
  ClipboardCheck,
  GitBranch,
  ListChecks,
  ChevronDown,
  HeartPulse,
} from "lucide-react";
import { useStore } from "../app/store";
import { PageHeading, Card, Logo } from "../components/ui";
import { roles } from "../schemas/models";
export function Help() {
  return (
    <>
      <PageHeading
        title="Bantuan & Panduan"
        description="Pelaporan yang mudah, pembelajaran yang berkelanjutan."
      />
      <div className="help-hero">
        <ShieldCheck size={42} />
        <div>
          <h2>Setiap laporan adalah kesempatan memperbaiki sistem.</h2>
          <p>
            Gunakan bahasa yang objektif, catat fakta, dan hindari menyalahkan
            individu.
          </p>
        </div>
      </div>
      <div className="help-grid">
        {[
          {
            icon: FilePlus2,
            title: "01 · Catat & laporkan",
            text: "Isi data pasien fiktif dan 14 rincian insiden melalui delapan langkah. Simpan draft kapan saja. Batas pelaporan 2 × 24 jam dari waktu insiden.",
          },
          {
            icon: ClipboardCheck,
            title: "02 · Verifikasi & grading",
            text: "Kepala unit atau Tim Keselamatan Pasien meninjau kelengkapan, memverifikasi sentinel, dan mengonfirmasi grading manual. Tidak ada skor otomatis tanpa SOP resmi.",
          },
          {
            icon: GitBranch,
            title: "03 · Investigasi & RCA",
            text: "Catat fakta, kronologi, Five Whys, dan faktor fishbone. Akar masalah serta rekomendasi harus berdasarkan bukti yang diinput tim.",
          },
          {
            icon: ListChecks,
            title: "04 · Perbaiki & evaluasi",
            text: "Tambahkan CAPA, tentukan penanggung jawab dan target, lalu catat bukti, realisasi, serta evaluasi efektivitas sebelum menyelesaikan tindakan.",
          },
        ].map((c) => (
          <Card key={c.title}>
            <c.icon size={26} />
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </Card>
        ))}
      </div>
      <Card title="Pertanyaan yang Sering Diajukan">
        {[
          [
            "Apakah data saya tersimpan setelah refresh?",
            "Ya, pada browser dan origin yang sama melalui localStorage. Mode privat, penghapusan data browser, atau perubahan domain dapat menghilangkan data. Ekspor backup demo secara berkala.",
          ],
          [
            "Apakah ini sudah dapat dipakai untuk data pasien nyata?",
            "Belum. Ini frontend-only: tidak memiliki autentikasi aman, otorisasi server, database terlindungi, timestamp server, audit log permanen, atau sinkronisasi antarpetugas. Gunakan data sintetis saja.",
          ],
          [
            "Bagaimana menentukan grading risiko?",
            "Pilih laporan di Grading Risiko, gunakan role simulasi Kepala unit atau Tim Keselamatan Pasien, isi dampak, probabilitas, alasan, dan identitas penilai demo. Pilih biru, hijau, kuning, atau merah secara manual dan konfirmasi. Matriks resmi belum dikonfigurasi.",
          ],
          [
            "Apa acuan formulir ini?",
            "Struktur prototipe memuat data pasien, 14 butir rincian kejadian, pengesahan, serta grading dengan acuan Formulir 1 Permenkes No. 11 Tahun 2017. Pemetaan regulasi dan kesesuaian SOP wajib diverifikasi oleh RSAS sebelum penggunaan operasional.",
          ],
          [
            "Apakah notifikasi dikirim ke email atau WhatsApp?",
            "Tidak. Seluruh notifikasi hanya tampil di browser dan dihitung menggunakan jam perangkat. Prototipe tidak mengirim email, SMS, WhatsApp, atau push notification.",
          ],
          [
            "Bagaimana mencetak atau memindahkan data demo?",
            "Buka Detail Laporan untuk cetak A4 berwatermark DEMO. Gunakan Pengaturan & Data Demo untuk backup/restore JSON tervalidasi. Ekspor CSV analitik tidak memuat nama pasien atau nomor rekam medis.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <ChevronDown size={16} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </Card>
      <div className="info-note">
        Untuk operasional diperlukan backend aman, otorisasi berbasis role di
        server, database terlindungi, audit log, backup, validasi SOP/klinis,
        dan evaluasi kepatuhan. Prototipe tidak mengklaim kesiapan tersebut.
      </div>
      <Link className="btn primary" to="/laporan/baru">
        Mulai Laporan Demo
        <ArrowRight size={16} />
      </Link>
    </>
  );
}
export function Login() {
  const { db, commit, notify } = useStore();
  const navigate = useNavigate();
  const [role, setRole] = useState(db.settings.role);
  return (
    <div className="login-page">
      <div className="login-story">
        <div className="login-brand">
          <Logo large />
          <b>RSAS-SAFETY</b>
        </div>
        <div>
          <span className="welcome-kicker">
            RSAU PROF. DR. ABDULRACHMAN SALEH
          </span>
          <h1>
            Pelayanan lebih aman.
            <br />
            Dimulai dari
            <br />
            kepedulian kita.
          </h1>
          <p>
            Patient Safety Incident Reporting
            <br />& Risk Management System
          </p>
          <ShieldCheck size={90} strokeWidth={1} />
        </div>
        <span>
          Sagraha Abhipraya Nawasena
          <br />
          <b>Kesehatan untuk Kedaulatan</b>
        </span>
      </div>
      <div className="login-content">
        <span className="demo-chip">MODE DEMONSTRASI</span>
        <h2>Selamat datang di RSAS.</h2>
        <p>Sistem Pelaporan Insiden Keselamatan Pasien</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (commit({ ...db, settings: { ...db.settings, role } })) {
              notify("Ruang kerja simulasi dibuka.");
              navigate("/");
            }
          }}
        >
          <label className="field">
            Pilih peran simulasi
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <button className="btn primary full-width">
            Masuk Ruang Kerja Demo
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="info-note">
          <ShieldCheck size={20} />
          <span>
            Ini simulasi UI tanpa password dan bukan autentikasi aman. Gunakan
            hanya data sintetis; jangan masukkan data pasien nyata.
          </span>
        </div>
        <footer>RSAS | Quality & Patient Safety Management</footer>
      </div>
    </div>
  );
}
