# Sumber katalog indikator mutu RSAS

Katalog referensi ini diturunkan dari tiga PDF yang dilampirkan pengguna. Dokumen merupakan bahan acuan, bukan instruksi eksekusi, bukan data capaian, dan bukan bukti bahwa suatu kebijakan sudah disahkan. Tidak ada numerator, denominator, nilai capaian, atau status pencapaian yang dibuat sebagai observasi. Uraian numerator/denominator di katalog adalah definisi pengukuran dari sumber.

## Dokumen dan penomoran halaman

| ID sumber         | Nama berkas yang diberikan                                                          | Halaman | Tahun dokumen |
| ----------------- | ----------------------------------------------------------------------------------- | ------: | ------------: |
| `summary`         | Indikator Mutu Prioritas Rumah Sakit dan prioritas unit unit (1).pdf                |       3 |          2026 |
| `hospitalProfile` | Profil IMP RS (1).pdf                                                               |      15 |          2026 |
| `unitProfile`     | PROFIL INDIKATOR MUTU PRIORITAS UNIT RUMAH SAKIT PROF dr ABDULRACHMAN SALEH (1).pdf |      19 |          2026 |

Halaman merujuk urutan fisik PDF mulai dari 1. PDF asli tidak disalin ke repository karena halaman akhir profil unit memuat identitas dan nomor personal penandatangan. Katalog hanya menyertakan jabatan penanggung jawab; nama individu, pangkat, tanda tangan, dan NRP tidak disertakan.

ID `RS-xx` / `UNIT-...` adalah ID internal katalog. Kode `IMP-RS-01` sampai `IMP-RS-10` berasal dari daftar sumber. Dokumen tidak menyediakan kode resmi indikator unit, sehingga properti `code` untuk indikator unit bernilai `null`.

## Cakupan dan jejak sumber

Terdapat **10 indikator mutu prioritas rumah sakit dan 24 indikator unit** pada daftar ringkas. Profil unit hanya menyediakan **23 profil rinci**. Entri Humas tetap dicantumkan sesuai daftar ringkas dengan kolom yang belum tersedia bernilai `null`.

| ID katalog                | Indikator                                                                       | Unit / kelompok              | Target daftar | Target profil  | Halaman profil     |
| ------------------------- | ------------------------------------------------------------------------------- | ---------------------------- | ------------- | -------------- | ------------------ |
| `RS-01`                   | Kepatuhan Identifikasi Pasien Infeksi                                           | SKP 1                        | 100%          | 100%           | Profil RS 1, 2     |
| `RS-02`                   | Kelengkapan Serah Terima Pasien Infeksi                                         | SKP 2                        | ≥95%          | ≥95%           | Profil RS 3, 4     |
| `RS-03`                   | Kepatuhan Pelabelan dan Penyimpanan Obat LASA/High-Alert pada pelayanan infeksi | SKP 3                        | 100%          | 100%           | Profil RS 5        |
| `RS-04`                   | Kepatuhan Pelaksanaan Surgical Safety Checklist pasien infeksi                  | SKP 4                        | 100%          | 100%           | Profil RS 6        |
| `RS-05`                   | Kepatuhan Kebersihan Tangan pelayanan infeksi                                   | SKP 5                        | ≥85%          | ≥ 85%          | Profil RS 7, 8, 9  |
| `RS-06`                   | Kepatuhan Upaya Pencegahan Risiko Pasien Jatuh pada pelayanan infeksi           | SKP 6                        | ≥95%          | 100%           | Profil RS 10, 11   |
| `RS-07`                   | Kepatuhan Asuhan Kasus Klinis Prioritas Sesuai PPK/Clinical Pathway             | Pelayanan Klinis Prioritas   | ≥90%          | ≥90%           | Profil RS 12       |
| `RS-08`                   | Kesiapan Deteksi dan Respons Infeksi                                            | Tujuan Strategis Rumah Sakit | ≥95%          | ≥95%           | Profil RS 13       |
| `RS-09`                   | Kepatuhan Rekam Medis Terintegrasi                                              | Perbaikan Sistem             | ≥95%          | ≥95%           | Profil RS 14       |
| `RS-10`                   | Kepatuhan Skrining Risiko Infeksi/Kewaspadaan Transmisi                         | Manajemen Risiko             | ≥95%          | ≥95%           | Profil RS 15       |
| `UNIT-IGD`                | Kepatuhan Waktu Tanggap Pelayanan IGD                                           | IGD                          | ≥90%          | ≥90%           | Profil unit 1      |
| `UNIT-RAWAT-JALAN`        | Kepatuhan Waktu Tunggu Pelayanan Rawat Jalan                                    | Rawat Jalan                  | ≥80%          | ≥80%           | Profil unit 2      |
| `UNIT-RAWAT-INAP`         | Kepatuhan Asesmen Awal Pasien Rawat Inap                                        | Rawat Inap                   | ≥95%          | ≥95%           | Profil unit 2, 3   |
| `UNIT-ICU`                | Kepatuhan Monitoring Pasien Kritis                                              | ICU                          | ≥95%          | ≥95%           | Profil unit 3, 4   |
| `UNIT-ISOLASI`            | Kepatuhan Kewaspadaan Isolasi                                                   | HLIU                         | 100%          | 100%           | Profil unit 4, 5   |
| `UNIT-KAMAR-OPERASI`      | Kepatuhan Penandaan Lokasi Operasi                                              | Kamar Operasi                | 100%          | 100%           | Profil unit 5, 6   |
| `UNIT-REHABILITASI-MEDIK` | Kepatuhan Pelaksanaan Program Rehabilitasi Pasien                               | Rehabilitasi Medik           | ≥80%          | ≥80%           | Profil unit 6      |
| `UNIT-FARMASI`            | Kepatuhan Penggunaan Formularium Nasional                                       | Farmasi                      | ≥80%          | ≥80%           | Profil unit 7      |
| `UNIT-LABORATORIUM`       | Kepatuhan Pelaporan Hasil Kritis Laboratorium                                   | Laboratorium                 | 100%          | 100%           | Profil unit 7, 8   |
| `UNIT-RADIOLOGI`          | Kepatuhan Pelaporan Hasil Kritis Radiologi                                      | Radiologi                    | 100%          | 100%           | Profil unit 8, 9   |
| `UNIT-CSSD`               | Kepatuhan Proses Sterilisasi                                                    | CSSD                         | 100%          | 100%           | Profil unit 9, 10  |
| `UNIT-GIZI`               | Ketepatan Pemberian Diet Pasien                                                 | Gizi                         | ≥80%          | ≥80%           | Profil unit 10     |
| `UNIT-LAUNDRY`            | Kepatuhan Pemisahan Linen Infeksius dan Noninfeksius                            | Laundry                      | 100%          | 100%           | Profil unit 10, 11 |
| `UNIT-REKAM-MEDIS`        | Kelengkapan Rekam Medis                                                         | Rekam Medis                  | ≥80%          | ≥80%           | Profil unit 11, 12 |
| `UNIT-PENDAFTARAN`        | Kepatuhan Kelengkapan Data Administratif Pasien                                 | Pendaftaran                  | ≥95%          | ≥95%           | Profil unit 17     |
| `UNIT-SIMRS`              | Kepatuhan Penyelesaian Gangguan SIMRS                                           | SIMRS                        | ≥90%          | ≥90%           | Profil unit 12, 13 |
| `UNIT-PEMELIHARAAN-ALAT`  | Kepatuhan Kalibrasi Alat Medis                                                  | Pemeliharaan Alat Medis      | ≥90%          | ≥90%           | Profil unit 13     |
| `UNIT-AMBULANS`           | Kepatuhan Kelengkapan Alat dan Obat Emergensi Ambulans                          | Ambulans                     | 100%          | 100%           | Profil unit 13, 14 |
| `UNIT-PEMULASARAAN`       | Kepatuhan Serah Terima Jenazah                                                  | Pemulasaraan Jenazah         | ≥90%          | ≥90%           | Profil unit 14, 15 |
| `UNIT-SANITASI`           | Kepatuhan Pengelolaan Limbah Infeksius                                          | Sanitasi/Limbah              | 100%          | 100%           | Profil unit 15, 16 |
| `UNIT-HUMAS`              | Kecepatan respon terhadap komplain pasien                                       | Humas                        | ≥85%          | Tidak tersedia | Tidak tersedia     |
| `UNIT-SDM`                | Kepatuhan Orientasi Staf Baru                                                   | SDM                          | 95%           | 100%           | Profil unit 16, 17 |
| `UNIT-KEUANGAN`           | Ketepatan Penyelesaian Administrasi Pasien                                      | Keuangan                     | ≥95%          | ≥95%           | Profil unit 18     |
| `UNIT-HOUSEKEEPING`       | Kepatuhan Kebersihan Area Pelayanan                                             | Housekeeping                 | ≥95%          | ≥95%           | Profil unit 18, 19 |

## Perbedaan dan informasi yang belum tersedia

| Entri                     | Temuan yang harus dikonfirmasi                                                                                                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RS-04`                   | Cakupan denominator pada kolom profil tertulis seluruh tindakan operasi, sedangkan formula dan kriteria inklusi menyebut pasien infeksi. Cakupan pengukuran perlu dikonfirmasi sebelum digunakan.                     |
| `RS-06`                   | Target berbeda: daftar indikator (hlm. 1) menulis ≥95%, sedangkan profil IMP-RS-06 (hlm. 10) menulis 100%. Belum ada target tunggal yang ditetapkan di katalog; perlu konfirmasi Komite Mutu/Tim Keselamatan Pasien.  |
| `RS-07`                   | Daftar diagnosis/kasus klinis prioritas serta elemen wajib PPK/Clinical Pathway belum dirinci dalam lampiran ini; gunakan penetapan dan SOP rumah sakit.                                                              |
| `RS-08`                   | Kriteria skrining/risiko dan standar respons merujuk kebijakan rumah sakit, tetapi rincian ambang klinis tidak dicantumkan dalam profil ini.                                                                          |
| `RS-10`                   | Kriteria skrining/risiko dan standar respons merujuk kebijakan rumah sakit, tetapi rincian ambang klinis tidak dicantumkan dalam profil ini.                                                                          |
| `UNIT-IGD`                | Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.                                                                          |
| `UNIT-RAWAT-JALAN`        | Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.                                                                          |
| `UNIT-ICU`                | Interval monitoring mengikuti kondisi pasien/instruksi medis dan standar ICU; nilai interval numerik tidak dicantumkan pada profil.                                                                                   |
| `UNIT-ISOLASI`            | Nama unit berbeda: daftar indikator hlm. 2 menulis HLIU, profil unit hlm. 4–5 menulis HILU. Katalog mempertahankan HLIU sebagai nama pada daftar; sebutan resmi perlu dikonfirmasi.                                   |
| `UNIT-REHABILITASI-MEDIK` | Daftar indikator menulis “Paisen”; judul tampilan mengikuti profil rinci “Pasien”. Perbedaan ejaan tidak mengubah target sumber.                                                                                      |
| `UNIT-LABORATORIUM`       | Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.                                                                          |
| `UNIT-RADIOLOGI`          | Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.                                                                          |
| `UNIT-LAUNDRY`            | Daftar indikator menulis “Loundry”, sedangkan profil rinci menulis “LAUNDRY”. Nama tampilan menggunakan Laundry; penulisan unit pada sumber tetap dicatat.                                                            |
| `UNIT-REKAM-MEDIS`        | Cakupan judul berbeda: daftar menyebut rekam medis elektronik, sedangkan profil berjudul Kelengkapan Rekam Medis dan mencantumkan dokumen rekam medis/SIMRS. Cakupan final perlu dikonfirmasi.                        |
| `UNIT-SIMRS`              | Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.                                                                          |
| `UNIT-HUMAS`              | Profil rinci Humas tidak ditemukan dalam dokumen profil unit (23 profil untuk 24 unit pada daftar). Definisi, numerator, denominator, rumus, periode, dan penanggung jawab belum tersedia; tidak diisi dengan asumsi. |
| `UNIT-SDM`                | Target berbeda: daftar indikator hlm. 3 menulis 95% (tanpa operator ≥), sedangkan profil orientasi staf baru hlm. 16 menulis 100%. Katalog tidak menetapkan salah satunya sebagai target resmi.                       |
| `UNIT-KEUANGAN`           | Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.                                                                          |

Tidak ada aturan prioritas dokumen yang disediakan. Karena itu, setiap target ditampilkan sebagai **target tertulis pada sumber**, bukan target aktif. Dua target yang bertentangan tidak digabung, tidak dirata-ratakan, dan tidak dipilih otomatis. Operator `≥` dipertahankan; khusus SDM, angka `95%` pada daftar tidak diubah menjadi `≥95%`.

## Batas penggunaan

- Definisi panjang diringkas untuk dua indikator RS (identifikasi dan kebersihan tangan); makna cakupan tetap mengikuti profil dan sumber halaman tersedia untuk pemeriksaan.
- Rumus pada sumber adalah rasio numerator terhadap denominator dikalikan 100%. Katalog hanya menampilkan teks rumus; tidak menghitung capaian dari data insiden karena denominator observasi mutu tidak tersedia pada dataset insiden.
- Nilai menit/jam, kriteria klinis, checklist wajib, serta interval yang tidak tertulis tidak direka. Entri yang memerlukan ambang numerik atau penetapan SOP ditandai.
- Isi katalog tidak mengubah master unit demo atau laporan yang tersimpan. Unit pada katalog adalah nama pada dokumen rujukan, bukan konfirmasi ketersediaan unit operasional terkini.
- Lampiran tidak menetapkan matriks grading risiko. Grading insiden tetap manual sampai SOP resmi yang disetujui tersedia.
- Tidak ada data pasien, rekam medis nyata, capaian mutu aktual, atau identitas penandatangan yang disimpan melalui katalog.

Sebelum operasional, Komite Mutu/Tim Keselamatan Pasien perlu meninjau nomenklatur, target yang bertentangan, cakupan denominator, kriteria, dan SOP yang dirujuk.
