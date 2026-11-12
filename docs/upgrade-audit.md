# Audit awal dan ringkasan perubahan

Baseline: commit `36db14fc2c639f6a69feaac983b45b6a6f41a79f` pada `main`.

| Area baseline | Temuan                                                               | Perubahan                                                                                              |
| ------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Routing       | Root membuka dashboard dan semua route berada dalam layout admin     | Root → `/lapor`; seluruh route internal berada di guard sesi; API memeriksa role secara mandiri        |
| Autentikasi   | Halaman masuk dan role switcher hanya simulasi                       | Akun PostgreSQL, hash scrypt, MFA TOTP, cookie sesi server, undangan sekali pakai                      |
| Storage       | `Provider` memanggil load/seed localStorage untuk seluruh pengunjung | Provider demo tidak dipasang; API/database menjadi sumber laporan; draft publik hanya di memori        |
| Form          | Wizard demo delapan langkah dengan identitas pasien wajib            | Form publik empat langkah, identitas minimal opsional, receipt/tracking tanpa rincian pasien           |
| Mutasi        | Browser menulis seluruh Database, log dan status bebas               | Endpoint per operasi, schema strict, CSRF, role, versi, transisi dan syarat penutupan diperiksa server |
| RCA/CAPA      | Five Whys, fishbone, grading manual dan editor bukti teks lokal      | Fitur setara disimpan terenkripsi di server; PIC/deadline, evaluasi, reviewer dan foto privat          |
| Dashboard     | Angka berasal dari 15 data seed                                      | Database awal kosong; tren valid-only, filter, drilldown, heatmap, antrean dan notifikasi internal     |
| Unit          | Master lokal dapat diubah/dihapus                                    | Master PostgreSQL dapat ditambah/diganti nama tanpa memutus QR/riwayat; tanpa hapus destruktif         |
| Ekspor        | CSV statistik dan cetak browser/demo backup                          | PDF server dan Excel asli hanya Komite Mutu; backup signed/encrypted dan restore append-only           |
| QR            | Belum tersedia                                                       | PNG/SVG QR standar, quiet zone 4, parameter unit tervalidasi dan poster cetak                          |
| Deployment    | SPA Vite di Vercel, tidak ada fungsi backend                         | Vercel function Express, PostgreSQL terpisah, konfigurasi secret server dan CSP                        |

Kelompok file:

- `shared/report.ts`: kontrak form, status, koreksi, RCA/CAPA dan tipe API bersama.
- `server/`: konfigurasi, pool PostgreSQL, migrasi additive/RLS, enkripsi, autentikasi, endpoint, bootstrap/recovery CLI dan tes integrasi.
- `api/index.ts`, `vercel.json`, `vite.config.ts`: entrypoint serverless, rewrite aman, header dan proxy pengembangan.
- `src/app/App.tsx`, `committee-session.ts`, `src/pages/PublicReport.tsx`, `Committee*.tsx`, `src/services/api.ts`, `legacy.ts`, `useUnits.ts`, `src/styles/secure.css`: alur publik/privat terintegrasi, tanpa storage klinis baru di browser.
- `src/pages/QualityCatalog.tsx`: tautan diarahkan ke namespace Komite Mutu; isi referensi/provenance dipertahankan.
- `tests/`, `server/tests/`, konfigurasi test dan CI: pengujian nyata anonymous/MFA/RBAC, workflow, QR decode, ekspor dan backup; suite domain lama tetap dijalankan.
- `.env.example`, `README.md`, `docs/`: konfigurasi, deployment, migrasi, pemulihan dan checklist keamanan. README prototype diarsipkan sebagai `docs/legacy-demo.md`.

Perubahan ini tidak mengakses pasien nyata, membuat deployment, memodifikasi database eksternal, menghapus data lama atau menetapkan SOP/target klinis baru. Implementasi dan pengujian lokal tidak membuktikan sertifikasi kepatuhan atau kesiapan operasional provider produksi.
