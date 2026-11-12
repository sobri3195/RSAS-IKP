# Migrasi dan pemulihan

## Data prototype sebelumnya

Versi sebelumnya hanya menyimpan data demo pada localStorage origin/perangkat yang sama. Tidak ada database lama yang perlu dihapus atau ditimpa. Upgrade ini tidak membaca storage lama pada halaman publik, tidak memuat seed ke dashboard baru, dan tidak menghapus key lama.

1. Pada perangkat/origin lama, login sebagai Komite Mutu dan buka Migrasi & backup. Tombol ekspor membaca storage lama hanya atas tindakan pengguna. Jika schema lengkap/valid, unduhan berformat schemaVersion 1 dan langsung dapat diimpor. Jika rusak/tidak lengkap, salinan mentah diunduh untuk pemulihan manual; tidak diinisialisasi ulang dengan seed.
2. Simpan salinan privat sebelum tindakan lain. Jika hanya mempunyai salinan mentah, konversi **di perangkat aman** dengan mem-parse string setiap key `rsas_safety_v1_settings`, `...incidents`, `...investigations`, `...actions`, `...activity`, `...units` menjadi properti bernama sama tanpa prefix, lalu tambahkan `schemaVersion: 1`. Validasi memakai `backupSchema`; jangan mengisi/mengarang data klinis yang hilang.
3. Pilih file schemaVersion 1, baca ringkasan, lalu konfirmasi impor. API memvalidasi schema, ID/nomor unik, referensi investigasi/CAPA dan kelengkapan laporan historis. Tidak ada pengiriman otomatis dari storage browser.
4. Impor atomik menambah laporan baru, mempertahankan UUID asal sebagai `legacy_id`, serta menyimpan seluruh backup asli sebagai arsip terenkripsi. Data asli laporan, investigasi, CAPA dan status/nomor historis ikut dipertahankan dalam payload legacy. Unit asli dipertahankan sebagai master unit dengan ID stabil. KPC dipetakan ke KPCS; sentinel terkonfirmasi tetap sentinel.
5. Nomor server baru dialokasikan dan laporan masuk sebagai `needs_revision`. Ini tidak menganggap draft/approval demo sebagai validasi institusional. Komite Mutu mengklarifikasi data, mengoreksi melalui alur terotorisasi, lalu memvalidasi. Draft kosong menggunakan label eksplisit "belum tercatat (impor)", bukan fakta klinis buatan.
6. Mengimpor file identik kembali tidak membuat duplikat. File berbeda yang berisi UUID yang sudah diimpor tidak menimpa versi server; arsip sumber tetap disimpan. Bandingkan jumlah laporan dan riwayat sebelum mempertimbangkan pembersihan storage lama. Tidak ada penghapusan otomatis dalam PR ini.

Komponen/schemas/domain prototype tetap tersedia di source untuk migrasi dan pengujian regresi, tetapi tidak dipasang sebagai dashboard publik. Katalog referensi indikator, logo dan sumber indikator dipertahankan.

## Backup aplikasi terenkripsi (versi 2)

Unduhan Komite Mutu memuat master unit, ciphertext laporan/foto, arsip impor, dan seluruh audit, disertai HMAC. Konten pasien/MFA tidak muncul sebagai plaintext; kredensial akun/sesi **tidak** diekspor. Header unduhan tetap no-store dan otorisasi diverifikasi server-side. Audit bisa memuat metadata nomor/status/unit dan ID aktor; backup tetap harus disimpan privat.

Untuk memulihkan, gunakan lingkungan dengan **kunci enkripsi yang sama**, database khusus pemulihan dan schema terbaru. Bootstrap akun pemulihan secara terpisah, kemudian unggah backup dan konfirmasi. Server memverifikasi tanda tangan, decryptability, identitas record dan referensi, menulis atomik, serta memajukan counter nomor. Backup salah kunci atau rusak ditolak. Laporan yang belum ada ditambahkan; laporan dengan ID sama dan isi berbeda menimbulkan 409 tanpa penimpaan. Unit yang bertentangan juga ditolak. Laporan identik boleh dilewati. Audit lama tidak dihapus; aktivitas restore baru ditambahkan.

Uji otomatis mencakup unduh → database PostgreSQL uji baru → verifikasi isi → nomor berikutnya berbeda, serta penolakan tanda tangan rusak. Full disaster recovery operasional harus memakai backup native PostgreSQL/PITR untuk memulihkan akun, role database dan konfigurasi juga. Jangan menggunakan JSON UI sebagai satu-satunya backup institusi.

Kunci AES/HMAC disimpan terpisah dari database dan backup. Tanpa kunci, ciphertext tidak dapat dipulihkan. Rotasi kunci memerlukan migrasi re-enkripsi terencana; tidak disediakan tombol mengganti kunci secara sepihak.

## Pemulihan akun

Anggota menyimpan seed autentikator pada vault institusi saat aktivasi. Bila password atau MFA hilang, administrator yang telah memverifikasi identitas melalui prosedur institusi dapat menjalankan `npm run account:recover -- email-anggota /lokasi/privat/undangan-baru.txt`. Perintah menggunakan kredensial operasional server, mencabut seluruh sesi, menonaktifkan kredensial lama, menerbitkan undangan 24 jam dan mencatat audit. Tidak ada endpoint publik reset berbasis email saja. Perintah recovery mempertahankan kewenangan akun, tidak memberikan akses dashboard kepada role teknis aplikasi. Hapus file undangan setelah dipakai.
