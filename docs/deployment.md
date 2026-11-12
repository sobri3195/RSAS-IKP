# Deployment Vercel dan PostgreSQL

## Konfigurasi

Gunakan Node.js 24 pada Vercel. Build `npm run build`, install `npm ci`, output `dist`. `api/index.ts` adalah fungsi Express; `vercel.json` memisahkan rewrite `/api/*` dari SPA serta memasang CSP dan header keamanan. Preview harus memakai **database dan kunci staging terpisah**, bukan data produksi.

| Variabel server           | Kebutuhan                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`            | PostgreSQL 16+ khusus aplikasi; pooler kompatibel transaksi disarankan untuk Vercel                      |
| `DATA_ENCRYPTION_KEY`     | 32 byte acak, dikodekan sebagai 64 karakter hex; simpan di secret manager dan salinan pemulihan terpisah |
| `APP_ORIGIN`              | Origin browser persis, misalnya `https://rsas-ikp.vercel.app`, tanpa slash akhir                         |
| `NODE_ENV`                | `production` pada Vercel; mewajibkan HTTPS dan cookie Secure                                             |
| `ALLOW_ATTACHMENTS`       | `false` bawaan; aktifkan foto hanya setelah persetujuan kebijakan RS                                     |
| `PUBLIC_REPORTS_PER_HOUR` | Batas per IP, bawaan 120; pertimbangkan NAT rumah sakit ketika menyetel                                  |
| `API_PORT`                | Lokal saja, bawaan 3001                                                                                  |

Jangan gunakan awalan `VITE_` untuk rahasia. Jangan mengirim connection string, service key atau kunci enkripsi ke frontend. Jangan menyimpan rahasia dalam Git, body PR, build log atau chat. Hasilkan kunci di terminal privat dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, lalu masukkan melalui pengaturan rahasia. Mengganti kunci tanpa proses re-enkripsi akan membuat laporan/backup/MFA lama tidak dapat dibaca.

Remote `DATABASE_URL` wajib `sslmode=verify-full`, dengan CA terpercaya provider. Verifikasi sertifikat tidak boleh dinonaktifkan. Loopback PostgreSQL diizinkan tanpa TLS untuk pengembangan saja. Paket `pg` memakai koneksi TCP PostgreSQL; API tidak bergantung pada proxy rahasia HTTP. Pastikan Vercel dapat menjangkau host/port database melalui aturan jaringan provider. Pilih layanan dengan enkripsi disk, backup terenkripsi, PITR dan pemantauan institusi; identitas minimal metadata operasional tetap berada dalam kolom indeks.

## Role database terpisah

Jalankan migrasi menggunakan role pemilik/migrator pada database khusus yang kosong dari tabel aplikasi lain. Jangan menjalankan migrasi otomatis pada request HTTP. Simpan kredensial migrator terpisah dari runtime. Contoh setelah `npm run db:migrate`, dengan role runtime `rsas_app` yang telah dibuat oleh administrator:

```sql
GRANT USAGE ON SCHEMA public TO rsas_app;
GRANT SELECT ON schema_migrations TO rsas_app;
GRANT SELECT, INSERT, UPDATE ON app_users, rate_limits, report_counters, master_units TO rsas_app;
GRANT SELECT, INSERT, DELETE ON sessions TO rsas_app;
GRANT SELECT, INSERT, UPDATE ON reports TO rsas_app;
GRANT SELECT, INSERT ON attachments, import_archives, audit_log TO rsas_app;
```

Runtime tidak boleh superuser, pemilik tabel, atau mempunyai `BYPASSRLS`/hak DDL. `FORCE ROW LEVEL SECURITY` melindungi tabel klinis dan arsip; server menetapkan `app.role` hanya di transaksi internal setelah otorisasi, atau untuk operasi publik dengan SQL tetap yang terbatas pada submit/tracking. Custom setting PostgreSQL bukan identitas pengguna mandiri: jangan pernah membuka koneksi SQL atau kredensial runtime kepada browser. Boundary utama adalah autentikasi/otorisasi API. Operator infrastruktur yang menguasai database **dan** kunci tetap memerlukan prosedur institusi untuk akses darurat; role teknis dalam aplikasi tidak memberikan akses dashboard.

Audit memiliki trigger penolak UPDATE/DELETE; runtime hanya memperoleh SELECT/INSERT. DBA dengan hak DDL dapat mengubah trigger, sehingga ekspor audit/WORM dan kontrol operator institusi tetap diperlukan.

## Urutan staging, lalu produksi melalui otorisasi tersendiri

1. Siapkan PostgreSQL staging, TLS, disk encryption dan backup provider. Isi `.env` lokal untuk perintah migrasi; `.env` diabaikan Git.
2. Jalankan `npm run db:migrate` memakai migrator. Perintah idempoten dan menggunakan advisory lock. Ganti ke kredensial runtime dengan hak minimum.
3. Jalankan `npm run account:invite -- email-institusi "Nama anggota" /lokasi/privat/undangan.txt`. Ini membuat pengelola Komite Mutu pertama; tidak membuat password bawaan. Undangan berumur 24 jam, file mode 0600 dan tidak ditimpa.
4. Berikan undangan melalui kanal institusi. Penerima membuat password ≥12 karakter dan mendaftarkan TOTP. Setelah aktivasi, tunggu kode TOTP berikutnya untuk masuk; kode aktivasi tidak dapat dipakai ulang untuk login.
5. Simpan variabel server di Vercel untuk lingkungan yang sesuai. `APP_ORIGIN` harus memakai URL preview yang persis untuk pengujian preview. Jangan aktifkan deploy produksi otomatis sebelum review konfigurasi dan pengujian staging selesai.
6. Jalankan seluruh suite lokal/CI dan smoke staging: root → form, anonymous submit sintetis, tracking, anonymous 401, non-Komite 403, login MFA, review/audit, private exports dan restore ke database uji lain.
7. Verifikasi `/api/health` dan refresh deep link frontend pada staging, termasuk route API melalui rewrite Vercel. Header `Cache-Control: no-store` harus tampak pada data API. Periksa bahwa cookie produksi bernama `__Host-rsas_session` memiliki Secure, HttpOnly, Path=/ dan SameSite=Strict.
8. Unduh PNG/SVG dari dashboard dengan origin produksi yang disetujui sebelum mencetak poster. Uji hasil cetak menggunakan kamera Android, iPhone dan Google Lens. Uji otomatis men-decode QR PNG, bukan perangkat fisik.
9. Publikasi produksi dan migrasi data nyata memerlukan otorisasi institusi terpisah. PR ini tidak melakukannya.

Backup UI dibatasi 3 MB untuk pemulihan; Vercel memiliki batas request/response platform. Untuk data besar, gunakan backup native PostgreSQL terenkripsi/PITR melalui prosedur DBA, bukan menaikkan limit aplikasi secara sembarang. Rekaman audit dan klinis tidak memiliki endpoint hapus. Jadwalkan housekeeping tabel `sessions` yang kedaluwarsa dan `rate_limits` yang melewati `reset_at`; hapus hanya metadata sementara tersebut, sesuai SOP.

Perubahan runtime diuji pada PGlite dan Chromium lokal; driver TCP `pg`, sertifikat provider, region/retensi provider dan routing fungsi Vercel harus diuji di staging sebelum klaim kesiapan operasional.
