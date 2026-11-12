# RSAS-SAFETY

Sistem Pelaporan Insiden Keselamatan Pasien — RSAU Prof. dr. Abdulrachman Saleh.

Petugas membuka QR → `/lapor` → mengisi empat langkah tanpa login → menerima nomor laporan dan kode pelacakan. Komite Mutu masuk melalui `/komite/login` dengan kata sandi **dan TOTP MFA**, kemudian meninjau laporan seluruh unit pada `/komite/dashboard`.

Aplikasi kini menggunakan React/Vite/TypeScript dan API Express dengan PostgreSQL. Data laporan utama tidak lagi disimpan di localStorage. Konfigurasi server dan database wajib disiapkan sebelum digunakan. Tidak ada akun bawaan atau bypass autentikasi pada entrypoint produksi.

## Pengembangan

Prasyarat: Node.js 24, npm, PostgreSQL 16+ (database khusus pengembangan), dan Chromium untuk E2E.

```sh
npm ci --cache /workspace/.npm-cache
cp .env.example .env
# Isi DATABASE_URL, APP_ORIGIN, dan DATA_ENCRYPTION_KEY secara lokal.
npm run db:migrate
npm run account:invite -- komite@example.org "Nama petugas berwenang" /tmp/rsas-invitation.txt
npm run dev:api
# Terminal kedua:
npm run dev
```

`APP_ORIGIN=http://localhost:5173` harus sama persis dengan origin browser, tanpa slash akhir. API lokal mendengarkan pada loopback port 3001 dan Vite meneruskan `/api`. Simpan file undangan di lokasi privat di luar repository; kirim melalui kanal aman institusi, aktifkan MFA, lalu hapus file undangan. Undangan kedaluwarsa dalam 24 jam. Perintah bootstrap memberikan kewenangan pengelolaan akun; anggota yang diundang lewat UI mendapat role `komite_mutu` tanpa kewenangan tersebut.

Jangan menggunakan data pasien nyata untuk pengembangan atau pengujian. Daftar unit awal adalah konfigurasi awal yang harus diverifikasi institusi; Komite Mutu dapat menambah atau mengganti nama unit. ID unit tetap stabil untuk QR dan riwayat laporan. Penghapusan unit atau laporan tidak disediakan dalam alur ini.

## Pengujian tanpa kredensial produksi

```sh
npm run test       # Domain, schema dan penyimpanan legacy yang dipertahankan
npm run test:api   # API dan SQL nyata pada mesin PostgreSQL WASM PGlite, data sintetis
npm run build      # TypeScript frontend + backend dan build Vite
npm run test:e2e   # Chromium + Vite + API + PostgreSQL uji, tanpa mock API
```

Port 3001 dan 5173 harus bebas sebelum E2E. Playwright sengaja tidak memakai server yang sudah berjalan agar tidak menguji database yang salah. Runner membuat database uji di memori dan akun sintetis terpisah, menjalankan login MFA, lalu membuang prosesnya. Hanya `scripts/test-server.ts` mengimpor fixture; entrypoint produksi tidak mengimpor fixture atau PGlite. Jangan menjalankan runner uji sebagai server operasional. Jika `/usr/bin/chromium` tidak ada, jalankan `npx playwright install --with-deps chromium`.

Screenshot/trace/PDF uji berada di `test-results/`. Cookie sesi sintetis uji berada di `.local-data/`; keduanya diabaikan Git. Pengujian PostgreSQL terkelola, TLS provider, pemindaian QR melalui perangkat fisik, dan deployment Vercel memerlukan validasi staging tersendiri.

## Alur dan akses

| URL                                            | Fungsi                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `/`, `/lapor`, `/lapor?unit=igd`               | Formulir publik langsung, tanpa sidebar atau tautan login internal  |
| `/lacak`                                       | Nomor, status dan waktu pembaruan saja, dengan kode rahasia         |
| `/komite/login`, `/komite/aktivasi#<undangan>` | Login MFA dan aktivasi sekali pakai                                 |
| `/komite/dashboard`                            | Filter, laporan masuk, analitik, notifikasi, PDF dan Excel          |
| `/komite/laporan/:id`                          | Validasi, koreksi terotorisasi, grading manual, RCA, CAPA dan bukti |
| `/komite/qr`                                   | QR PNG/SVG dengan quiet zone 4 modul dan poster cetak               |
| `/komite/unit`                                 | Tambah/ubah nama unit dengan ID tetap                               |
| `/komite/audit`, `/komite/data`                | Audit server, impor legacy, backup/pemulihan                        |
| `/komite/akun`                                 | Undangan dan pencabutan akun oleh pengelola berwenang               |
| `/komite/indikator-mutu`                       | Katalog referensi 34 indikator yang dipertahankan                   |

Seluruh endpoint `/api/committee/*` memeriksa sesi, role, dan CSRF untuk mutasi. Tanpa sesi mendapat HTTP 401; akun `user` atau `technical_admin` mendapat HTTP 403. Administrator teknis tidak diberi akses klinis melalui aplikasi. Route lama diarahkan ke ruang privat, kecuali `/laporan/baru` yang menuju formulir publik.

Draft publik disimpan otomatis **hanya di memori** dengan debounce; refresh meniadakannya. Laporan baru ditulis atomik, nomor dialokasikan oleh database, dan pengiriman ulang dengan kunci idempotensi yang sama tidak membuat laporan kedua. Simpan bukti penerimaan tanpa data pasien. Kode pelacakan tidak diletakkan di URL atau log server.

Status: `submitted → under_review → validated → investigation → action_plan → effectiveness_review → closed → archived`, dengan `needs_revision` untuk perbaikan. Server memeriksa transisi, versi laporan, kelengkapan grading, PIC/tenggat investigasi, akar masalah, serta bukti/evaluasi/reviewer CAPA sebelum penutupan. Koreksi isi hanya boleh dilakukan Komite Mutu saat `under_review`/`needs_revision`, disertai alasan; snapshot asli disimpan terenkripsi di audit. Pelapor tidak dapat mengubah laporan yang telah dikirim. Pengarsipan tidak dapat mengubah isi laporan selesai.

Tren memakai laporan tervalidasi pada filter aktif; jumlah antrean memakai seluruh laporan. Tidak ada denominator pelayanan yang dikarang. Kelompok berulang berasal dari pasangan unit/kategori, bukan kesimpulan penyebab klinis. Notifikasi internal tidak memuat identitas pasien. Dashboard memperbarui data setiap 10 detik.

## Keamanan dan operasional

Isi laporan, foto privat, rahasia MFA, catatan review dan riwayat perubahan dienkripsi AES-256-GCM dengan konteks record. Kata sandi memakai scrypt N=131072/r=8/p=1 dengan salt acak. Token sesi acak 256 bit disimpan sebagai hash di database; cookie HttpOnly, SameSite=Strict dan Secure (`__Host-`) di produksi. Sesi berlaku maksimum 8 jam dan dicabut saat logout/nonaktif akun. TOTP wajib, memiliki batas percobaan dan perlindungan replay.

Lampiran **nonaktif secara bawaan**. `ALLOW_ATTACHMENTS=true` hanya setelah kebijakan RS mengizinkan. Hanya PNG/JPEG valid ≤1 MB/foto diterima, di-decode/re-encode dan metadata dibuang, dengan batas piksel; dokumen PDF/Office dan executable ditolak. Foto disimpan terenkripsi dalam tabel privat, tanpa URL publik. Bukti teks CAPA selalu tersedia.

Lihat [deployment Vercel dan konfigurasi PostgreSQL](docs/deployment.md), [migrasi dan pemulihan](docs/migration-recovery.md), serta [checklist keamanan dan matriks pengujian](docs/security-checklist.md). [Audit source dan ringkasan perubahan](docs/upgrade-audit.md) menjelaskan batas prototype sebelumnya. [Dokumentasi demo lama](docs/legacy-demo.md) disimpan sebagai sejarah, bukan petunjuk menjalankan versi ini.

Tidak ada deployment produksi yang dijalankan oleh perubahan ini. Penggunaan operasional memerlukan persetujuan SOP, daftar unit, retensi, pengelolaan kunci dan akun, backup institusi, serta validasi staging. Grading tetap manual karena matriks resmi RSAS belum dikonfigurasi.
