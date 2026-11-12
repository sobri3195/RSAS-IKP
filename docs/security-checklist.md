# Checklist keamanan dan pengujian

Pengujian menggunakan data sintetis. Checklist ini adalah catatan kontrol implementasi dan cakupan uji, bukan sertifikasi keamanan atau persetujuan penggunaan data klinis.

| Skenario wajib                                          | Bukti otomatis                                                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| QR membuka `/lapor` dan unit valid dapat dikoreksi      | Decode PNG menggunakan jsQR pada API test; browser memverifikasi query unit dan form langsung                                    |
| Root menuju form, tanpa sidebar/admin/login link publik | E2E root/QR dan assertions link/sidebar                                                                                          |
| Submit tanpa login disimpan di database                 | API/E2E submission, query ciphertext PostgreSQL, receipt dan tracking terbatas                                                   |
| Tidak dapat melihat laporan orang lain                  | Semua route committee/data/file/export diuji anonymous 401                                                                       |
| Dashboard langsung meminta login                        | E2E direct private URLs dan route legacy                                                                                         |
| Akun terautentikasi non-Komite ditolak                 | API 403 untuk `user` dan `technical_admin`; E2E refresh akun biasa                                                               |
| Komite login dengan password + MFA                      | Enrollment nyata dan login TOTP melalui UI/API, cookie HttpOnly dan replay OTP ditolak                                           |
| Laporan baru terlihat seluruh unit                      | API list setelah submit dan E2E dashboard dari API nyata; polling 10 detik                                                       |
| Validasi/status/penutupan diaudit                       | API menjalankan seluruh transisi sampai closed; lompat status, versi basi, CAPA belum lengkap dan CSRF ditolak; E2E review/audit |
| Grafik/filter berdasar data tersedia                    | Dashboard memakai laporan tervalidasi; E2E filter unit/export; empty state tanpa denominator buatan                              |
| PDF/Excel privat                                        | API anonymous/non-Komite ditolak, signature PDF/ZIP diperiksa, E2E download Excel                                               |
| Smartphone                                              | Chromium viewport 390×844, form dan katalog tanpa overflow, screenshot                                                           |
| Refresh/logout/direct URL tidak melewati otorisasi      | E2E replay cookie setelah logout 401, refresh akun biasa 403, direct URL → login; API sesi kedaluwarsa 401                       |
| Backup/pemulihan                                        | Backup signed/encrypted → database uji baru → isi laporan sama dan counter lanjut; signature rusak ditolak                       |
| Tidak memakai pasien nyata                              | Fixture sintetis terpisah; backend produksi tidak mengimpor fixture                                                              |

Kontrol tambahan yang diuji: RLS pada SQL role non-superuser, migrasi idempoten, hashing password dan secret MFA terenkripsi, CSRF/Origin, anti-spam/honeypot/challenge dan rate limit database, idempotensi submit, IDOR foto lintas laporan, audit append-only, koreksi hanya saat peninjauan/perbaikan dan snapshot lama terenkripsi, impor 15 contoh legacy tanpa duplikasi, serta master unit/QR tetap valid setelah rename.

## Review sebelum operasional

- [ ] PostgreSQL provider, TLS `verify-full`, koneksi pooler, role runtime minimum dan region penyimpanan disetujui institusi; jangan gunakan superuser runtime.
- [ ] Kunci acak disimpan dalam secret manager, akses operator dipisahkan, salinan recovery diuji, rencana rotasi tersedia.
- [ ] Akun bootstrap dan pemulihan mengikuti verifikasi identitas institusi; password ≥12 karakter, MFA dan pencabutan sesi diuji pada staging.
- [ ] SOP identitas minimal, daftar unit, klasifikasi KPCS/Sentinel, grading manual, tenggat dan retensi dikonfirmasi rumah sakit. Angka ≤48 jam adalah indikator operasional yang perlu validasi SOP, bukan grading klinis otomatis.
- [ ] Kebijakan foto disetujui sebelum `ALLOW_ATTACHMENTS=true`; dokumen/Office/PDF/executable tetap ditolak. Uji decoder/file-size policy menggunakan foto sintetis.
- [ ] Endpoint anonim/akun biasa/teknis tidak dapat membaca JSON klinis, foto, audit, backup atau ekspor di staging, termasuk URL langsung dan rewrite Vercel.
- [ ] Respons API no-store, cookie Secure/HttpOnly/SameSite dan CSP diperiksa pada domain HTTPS sebenarnya. Tidak ada service worker yang menyimpan API, atau rahasia dalam bundle browser/log.
- [ ] Backup native PostgreSQL/PITR dan restore terpisah, akun, unit, lampiran, audit serta kunci recovery diuji. Backup UI bukan satu-satunya rencana disaster recovery.
- [ ] Logging/observability provider tidak menangkap body request, cookie, OTP, password, connection string atau rincian klinis. Log aplikasi hanya mencetak kode kegagalan generik.
- [ ] Uji fisik QR cetak dengan iPhone, Android dan Google Lens; uji browser Safari/iOS dan Chrome/Android dilakukan selain Chromium headless.
- [ ] Permission akun dan akses darurat operator ditinjau; administrator teknis aplikasi tidak diberi role `komite_mutu` secara otomatis.
- [ ] Review keamanan institusi dan otorisasi deployment produksi selesai. PR ini tidak melakukan deployment atau mengubah data nyata.

Perintah yang dapat diulang: `npm run test`, `npm run test:api`, `npm run build`, `npm run test:e2e`, serta `npm audit --omit=dev`. Suite otomatis lokal memakai PostgreSQL WASM PGlite; koneksi TCP PostgreSQL terkelola, sertifikat provider, API gateway dan integrasi Vercel memerlukan staging tersendiri.
