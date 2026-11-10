## RSAS-SAFETY: pelaporan insiden dan katalog referensi mutu

Prototipe frontend React + Vite + TypeScript untuk RSAU Prof. dr. Abdulrachman Saleh, dengan 15 insiden sintetis, wizard delapan langkah/14 butir, workflow verifikasi, grading manual, RCA, CAPA, analitik, laporan mutu, cetak A4, dan penyimpanan lokal tervalidasi.

Katalog baru memuat 34 indikator dari tiga PDF pengguna (10 RS dan 24 unit), dilengkapi profil, target tiap sumber, sitasi halaman, pencarian/filter, ekspor JSON, dan cetak referensi. Konflik target IMP-RS-06 dan SDM, profil Humas yang belum tersedia, variasi nama unit, dan ambang waktu yang belum disebutkan diberi catatan tanpa mengarang capaian atau memilih SOP aktif. PDF asli serta identitas/nomor personal penandatangan tidak disalin.

Perbaikan: dampak non-pasien memiliki pilihan tidak relevan; grading manual dan CAPA menolak isian wajib yang hanya berisi spasi; grafik laporan mutu mengikuti rentang historis yang dipilih.

Seluruh role, paraf, workflow, dan notifikasi insiden adalah simulasi frontend/localStorage. Tidak untuk data pasien nyata. Matriks risiko resmi belum dikonfigurasi; grading tetap manual. Konfigurasi Vercel SPA tersedia, deployment belum dilakukan.

Validasi lokal: **41 pengujian Vitest dan 11 skenario Playwright Chromium lulus**, mencakup alur insiden dan katalog. TypeScript dan build produksi berhasil. Pemeriksaan desktop/mobile, ekspor referensi, serta PDF A4 berlabel REFERENSI dan BUKAN LAPORAN CAPAIAN juga berhasil.
