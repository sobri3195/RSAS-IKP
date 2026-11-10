/**
 * Katalog referensi dari tiga PDF yang disediakan pengguna (tahun dokumen 2026).
 * Tidak memuat capaian, data pasien, penilaian klinis, atau target yang dianggap telah disahkan.
 * ID RS-/UNIT- adalah ID internal katalog. Hanya code IMP-RS-xx berasal dari dokumen.
 * Nomor halaman adalah urutan fisik PDF, dimulai dari 1.
 */
export type QualitySourceId = "summary" | "hospitalProfile" | "unitProfile";
export interface QualityCitation {
  source: QualitySourceId;
  pages: number[];
}
export interface QualitySource {
  title: string;
  label: string;
  pages: number;
  year: 2026;
}
export interface QualityIndicator {
  id: string;
  code: string | null;
  scope: "Rumah sakit" | "Unit";
  unit: string;
  title: string;
  summaryTitle: string;
  group: string;
  type: string;
  targetSources: { value: string; citation: QualityCitation }[];
  definition: string | null;
  numerator: string | null;
  denominator: string | null;
  formula: string | null;
  inclusion: string | null;
  exclusion: string | null;
  collectionMethod: string | null;
  collectionPeriod: string | null;
  analysisPeriod: string | null;
  dataSource: string | null;
  instrument: string | null;
  sampling: string | null;
  responsibleRole: string | null;
  citations: QualityCitation[];
  issues: string[];
}

export const qualitySources: Record<QualitySourceId, QualitySource> = {
  summary: {
    title:
      "Indikator Mutu Prioritas Rumah Sakit dan prioritas unit unit (1).pdf",
    label: "Daftar indikator",
    pages: 3,
    year: 2026,
  },
  hospitalProfile: {
    title: "Profil IMP RS (1).pdf",
    label: "Profil IMP RS",
    pages: 15,
    year: 2026,
  },
  unitProfile: {
    title:
      "PROFIL INDIKATOR MUTU PRIORITAS UNIT RUMAH SAKIT PROF dr ABDULRACHMAN SALEH (1).pdf",
    label: "Profil IMP unit",
    pages: 19,
    year: 2026,
  },
};

export const qualityIndicators: QualityIndicator[] = [
  {
    id: "RS-01",
    code: "IMP-RS-01",
    scope: "Rumah sakit",
    unit: "Lintas unit",
    title: "Kepatuhan Identifikasi Pasien Infeksi",
    summaryTitle: "Kepatuhan identifikasi pasien infeksi",
    group: "SKP 1",
    type: "Proses",
    targetSources: [
      {
        value: "100%",
        citation: {
          source: "summary",
          pages: [1],
        },
      },
      {
        value: "100%",
        citation: {
          source: "hospitalProfile",
          pages: [2],
        },
      },
    ],
    definition:
      "Identifikasi oleh tenaga medis dan tenaga kesehatan menggunakan minimal dua penanda identitas sesuai ketentuan rumah sakit, secara visual dan/atau verbal, pada seluruh tindakan intervensi yang dipersyaratkan. Identifikasi dianggap benar bila seluruh intervensi terkait dilakukan dengan benar.",
    numerator:
      "Jumlah pemberi pelayanan yang melakukan identifikasi pasien infeksi secara benar dalam periode observasi",
    denominator:
      "Jumlah pemberi pelayanan infeksi yang diobservasi dalam periode observasi",
    formula:
      "Jumlah pemberi pelayanan yang melakukan identifikasi pasien infeksi secara benar ÷ jumlah pemberi pelayanan infeksi yang diobservasi × 100%.",
    inclusion: "Semua pemberi pelayanan yang memberikan pelayanan kesehatan.",
    exclusion: "Tidak ada",
    collectionMethod: "Observasi",
    collectionPeriod: "Bulanan",
    analysisPeriod: "Bulanan, Triwulanan, Tahunan",
    dataSource: "Hasil observasi",
    instrument: "Formulir Observasi Kepatuhan Identifikasi Pasien",
    sampling:
      "Total sampel bila populasi ≤30; rumus Slovin bila populasi >30. Non Probability Sampling – Consecutive Sampling.",
    responsibleRole: "Kepala Bidang Pelayanan Medik dan Keperawatan",
    citations: [
      {
        source: "summary",
        pages: [1],
      },
      {
        source: "hospitalProfile",
        pages: [1, 2],
      },
    ],
    issues: [],
  },
  {
    id: "RS-02",
    code: "IMP-RS-02",
    scope: "Rumah sakit",
    unit: "Lintas unit",
    title: "Kelengkapan Serah Terima Pasien Infeksi",
    summaryTitle: "Kelengkapan serah terima pasien infeksi",
    group: "SKP 2",
    type: "Proses",
    targetSources: [
      {
        value: "≥95%",
        citation: {
          source: "summary",
          pages: [1],
        },
      },
      {
        value: "≥95%",
        citation: {
          source: "hospitalProfile",
          pages: [3],
        },
      },
    ],
    definition:
      "Kelengkapan serah terima pasien infeksi adalah persentase proses serah terima pasien dengan diagnosis atau kecurigaan penyakit infeksi yang dilakukan antarpetugas atau antarunit pelayanan, dengan memenuhi seluruh komponen informasi wajib yang telah ditetapkan rumah sakit dan terdokumentasi pada formulir atau media serah terima yang berlaku. Komponen meliputi: identitas pasien, diagnosis/dugaan infeksi, kondisi klinis dan tanda vital, status isolasi, jenis kewaspadaan transmisi (kontak, droplet, atau airborne sesuai indikasi), hasil pemeriksaan penunjang yang relevan, terapi/tindakan yang sedang diberikan, serta rencana tindak lanjut dan kebutuhan khusus pasien.",
    numerator:
      "Jumlah proses serah terima pasien infeksi yang memenuhi seluruh komponen wajib serah terima sesuai standar rumah sakit.",
    denominator:
      "Jumlah seluruh proses serah terima pasien infeksi yang dilakukan selama periode pengukuran.",
    formula:
      "(Jumlah proses serah terima pasien infeksi yang memenuhi seluruh komponen wajib ÷ Jumlah seluruh proses serah terima pasien infeksi yang diobservasi) × 100%",
    inclusion:
      "1. Seluruh proses serah terima pasien dengan diagnosis atau kecurigaan penyakit infeksi. 2. Serah terima pasien antarunit pelayanan, antarshift, maupun saat transfer pasien ke unit lain.",
    exclusion:
      "1. Pasien noninfeksi tanpa kecurigaan penyakit infeksi. 2. Pasien yang meninggal sebelum proses serah terima dilakukan. 3. Perpindahan administratif yang tidak disertai pemindahan tanggung jawab pelayanan pasien.",
    collectionMethod:
      "Prospektif melalui observasi langsung pelaksanaan serah terima dan/atau retrospektif melalui audit formulir serah terima pasien, rekam medis elektronik, serta dokumentasi transfer pasien.",
    collectionPeriod: "Bulanan",
    analysisPeriod: "Bulanan dan rekapitulasi triwulanan",
    dataSource:
      "Formulir serah terima pasien, rekam medis elektronik (RME), dokumentasi keperawatan, catatan transfer pasien, dan hasil supervisi unit pelayanan.",
    instrument:
      "Formulir Monitoring Kelengkapan Serah Terima Pasien Infeksi (checklist komponen wajib serah terima).",
    sampling: "Total sampling seluruh proses serah terima pasien infeksi",
    responsibleRole:
      "Kepala Instalasi/Unit Rawat Inap atau Kepala Ruangan yang ditetapkan rumah sakit, dengan koordinasi Komite Mutu dan Komite/Tim PPI",
    citations: [
      {
        source: "summary",
        pages: [1],
      },
      {
        source: "hospitalProfile",
        pages: [3, 4],
      },
    ],
    issues: [],
  },
  {
    id: "RS-03",
    code: "IMP-RS-03",
    scope: "Rumah sakit",
    unit: "Lintas unit",
    title:
      "Kepatuhan Pelabelan dan Penyimpanan Obat LASA/High-Alert pada pelayanan infeksi",
    summaryTitle:
      "Kepatuhan pelabelan dan penyimpanan obat LASA/high-alert pada pelayanan infeksi",
    group: "SKP 3",
    type: "Proses",
    targetSources: [
      {
        value: "100%",
        citation: {
          source: "summary",
          pages: [1],
        },
      },
      {
        value: "100%",
        citation: {
          source: "hospitalProfile",
          pages: [5],
        },
      },
    ],
    definition:
      "Kepatuhan pelabelan dan penyimpanan obat LASA/high-alert adalah kesesuaian penandaan, pelabelan dan lokasi/cara penyimpanan obat yang termasuk LASA dan/atau high-alert dengan ketentuan rumah sakit",
    numerator:
      "Jumlah obat LASA/high-alert yang pelabelan dan penyimpanannya pada pelayanan infeksi sesuai standar",
    denominator:
      "Jumlah seluruh obat LASA/high-alert pada pelayanan infeksi yang diperiksa",
    formula:
      "Jumlah obat LASA/high-alert pada pelayanan infeksi sesuai standar ÷ jumlah seluruh obat LASA/high-alert pada pelayanan infeksi yang diperiksa × 100%",
    inclusion:
      "Seluruh obat yang termasuk daftar LASA dan/atau high-alert pada pelayanan infeksi di rumah sakit",
    exclusion:
      "Obat yang sedang dalam proses penerimaan/pengeluaran dan belum masuk ke area penyimpanan, apabila sesuai alur yang ditetapkan",
    collectionMethod: "Observasi langsung dan audit penyimpanan obat",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan dan triwulanan",
    dataSource:
      "Instalasi Farmasi, daftar obat LASA/high-alert, kartu stok dan area penyimpanan pada pelayanan infeksi",
    instrument: "Checklist monitoring LASA/high-alert",
    sampling:
      "Total sampling terhadap obat LASA/high-alert yang tersedia pada pelayanan infeksi saat audit",
    responsibleRole: "Kepala Instalasi Farmasi/Tim Farmasi dan Terapi",
    citations: [
      {
        source: "summary",
        pages: [1],
      },
      {
        source: "hospitalProfile",
        pages: [5],
      },
    ],
    issues: [],
  },
  {
    id: "RS-04",
    code: "IMP-RS-04",
    scope: "Rumah sakit",
    unit: "Lintas unit",
    title: "Kepatuhan Pelaksanaan Surgical Safety Checklist pasien infeksi",
    summaryTitle: "Kepatuhan Surgical Safety Checklist pada pasien infeksi",
    group: "SKP 4",
    type: "Proses",
    targetSources: [
      {
        value: "100%",
        citation: {
          source: "summary",
          pages: [1],
        },
      },
      {
        value: "100%",
        citation: {
          source: "hospitalProfile",
          pages: [6],
        },
      },
    ],
    definition:
      "Kepatuhan Surgical Safety Checklist adalah pelaksanaan seluruh tahapan checklist sesuai ketentuan rumah sakit, termasuk verifikasi sebelum anestesi, sebelum insisi dan sebelum pasien meninggalkan kamar operasi, dengan dokumentasi lengkap.",
    numerator:
      "Jumlah tindakan operasi pasien infeksi yang dilaksanakan Surgical Safety Checklist secara lengkap sesuai ketentuan",
    denominator:
      "Jumlah seluruh tindakan operasi yang menjadi objek pengukuran",
    formula:
      "Jumlah operasi pasien infeksi dengan SSC lengkap ÷ jumlah seluruh operasi pasien infeksi yang diukur × 100%",
    inclusion:
      "Seluruh pasien infeksi yang menjalani tindakan operasi di kamar operasi rumah sakit",
    exclusion:
      "Tindakan yang secara kebijakan rumah sakit tidak termasuk dalam cakupan Surgical Safety Checklist",
    collectionMethod:
      "Audit Surgical Safety Checklist dan observasi pelaksanaan",
    collectionPeriod: "Bulanan",
    analysisPeriod: "Bulanan dan triwulanan",
    dataSource:
      "Rekam medis, Surgical Safety Checklist, register kamar operasi",
    instrument: "Checklist audit Surgical Safety Checklist",
    sampling: "Total sampling",
    responsibleRole: "Kepala Kamar Operasi/Sub Komite Keselamatan Pasien",
    citations: [
      {
        source: "summary",
        pages: [1],
      },
      {
        source: "hospitalProfile",
        pages: [6],
      },
    ],
    issues: [
      "Cakupan denominator pada kolom profil tertulis seluruh tindakan operasi, sedangkan formula dan kriteria inklusi menyebut pasien infeksi. Cakupan pengukuran perlu dikonfirmasi sebelum digunakan.",
    ],
  },
  {
    id: "RS-05",
    code: "IMP-RS-05",
    scope: "Rumah sakit",
    unit: "Lintas unit",
    title: "Kepatuhan Kebersihan Tangan pelayanan infeksi",
    summaryTitle: "Kepatuhan kebersihan tangan 5 Momen pada pelayanan infeksi",
    group: "SKP 5",
    type: "Proses",
    targetSources: [
      {
        value: "≥85%",
        citation: {
          source: "summary",
          pages: [1],
        },
      },
      {
        value: "≥ 85%",
        citation: {
          source: "hospitalProfile",
          pages: [8],
        },
      },
    ],
    definition:
      "Kepatuhan melakukan kebersihan tangan sesuai indikasi dan langkah WHO pada lima momen: sebelum kontak pasien, sesudah kontak pasien, sebelum prosedur aseptik, setelah kontak cairan tubuh, serta setelah kontak lingkungan pasien. Observasi mengumpulkan minimal 200 peluang per bulan; sesi maksimal 20 menit, maksimal tiga pemberi pelayanan diamati bersamaan.",
    numerator:
      "Jumlah tindakan kebersihan tangan yang dilakukan pada pelayanan infeksi",
    denominator:
      "Jumlah total peluang kebersihan tangan pada pelayanan infeksi yang seharusnya dilakukan dalam periode observasi",
    formula:
      "Jumlah tindakan kebersihan tangan pada pelayanan infeksi yang dilakukan ÷ jumlah total peluang kebersihan tangan pada pelayanan infeksi yang seharusnya dilakukan × 100%.",
    inclusion:
      "Seluruh peluang yang dimiliki oleh pemberi pelayanan terindikasi harus melakukan kebersihan tangan",
    exclusion: "Tidak ada",
    collectionMethod: "Observasi",
    collectionPeriod: "Bulanan",
    analysisPeriod: "Bulanan, Triwulanan, Tahunan",
    dataSource: "Hasil observasi",
    instrument: "Formulir Kepatuhan Kebersihan Tangan",
    sampling:
      "Minimal 200 peluang. Non probability Sampling – Consecutive sampling.",
    responsibleRole: "Komite PPI RS",
    citations: [
      {
        source: "summary",
        pages: [1],
      },
      {
        source: "hospitalProfile",
        pages: [7, 8, 9],
      },
    ],
    issues: [],
  },
  {
    id: "RS-06",
    code: "IMP-RS-06",
    scope: "Rumah sakit",
    unit: "Lintas unit",
    title:
      "Kepatuhan Upaya Pencegahan Risiko Pasien Jatuh pada pelayanan infeksi",
    summaryTitle:
      "Kepatuhan upaya pencegahan risiko jatuh pada pelayanan infeksi",
    group: "SKP 6",
    type: "Proses",
    targetSources: [
      {
        value: "≥95%",
        citation: {
          source: "summary",
          pages: [1],
        },
      },
      {
        value: "100%",
        citation: {
          source: "hospitalProfile",
          pages: [10],
        },
      },
    ],
    definition:
      "Pelaksanaan ketiga upaya pencegahan jatuh pada pasien rawat inap infeksi berisiko tinggi: asesmen awal, asesmen ulang, dan intervensi pencegahan sesuai standar rumah sakit.",
    numerator:
      "Jumlah pasien rawat inap infeksi berisiko tinggi jatuh yang mendapatkan ketiga upaya pencegahan risiko jatuh",
    denominator:
      "Jumlah pasien rawat inap infeksi berisiko tinggi jatuh yang diobservasi",
    formula:
      "Jumlah pasien rawat inap infeksi berisiko tinggi jatuh yang mendapatkan ketiga upaya pencegahan ÷ jumlah pasien rawat inap infeksi berisiko tinggi jatuh yang diobservasi × 100%.",
    inclusion: "Pasien rawat inap berisiko tinggi jatuh",
    exclusion:
      "Pasien yang tidak dapat dilakukan asesmen ulang maupun edukasi seperti pasien meninggal, pasien gangguan jiwa yang sudah melewati fase akut, dan pasien menolak intervensi.",
    collectionMethod: "Retrospektif",
    collectionPeriod: "Bulanan",
    analysisPeriod: "Bulanan, Triwulanan, Tahunan",
    dataSource: "Data sekunder menggunakan data dari rekam medis",
    instrument: "Formulir Upaya Pencegahan Risiko Pasien Jatuh",
    sampling:
      "Total sampel bila populasi ≤30; rumus Slovin bila populasi >30. Probability Sampling – Stratified Random Sampling berdasarkan Unit Pelayanan.",
    responsibleRole: "Bidang Keperawatan dan Komite Keselamatan Pasien",
    citations: [
      {
        source: "summary",
        pages: [1],
      },
      {
        source: "hospitalProfile",
        pages: [10, 11],
      },
    ],
    issues: [
      "Target berbeda: daftar indikator (hlm. 1) menulis ≥95%, sedangkan profil IMP-RS-06 (hlm. 10) menulis 100%. Belum ada target tunggal yang ditetapkan di katalog; perlu konfirmasi Komite Mutu/Tim Keselamatan Pasien.",
    ],
  },
  {
    id: "RS-07",
    code: "IMP-RS-07",
    scope: "Rumah sakit",
    unit: "Lintas unit",
    title:
      "Kepatuhan Asuhan Kasus Klinis Prioritas Sesuai PPK/Clinical Pathway",
    summaryTitle: "Asuhan kasus klinis prioritas sesuai PPK/CP",
    group: "Pelayanan Klinis Prioritas",
    type: "Proses",
    targetSources: [
      {
        value: "≥90%",
        citation: {
          source: "summary",
          pages: [1],
        },
      },
      {
        value: "≥90%",
        citation: {
          source: "hospitalProfile",
          pages: [12],
        },
      },
    ],
    definition:
      "Kepatuhan asuhan kasus klinis prioritas adalah kesesuaian proses pelayanan pasien dengan elemen pelayanan yang dipersyaratkan dalam PPK dan/atau Clinical Pathway yang berlaku di rumah sakit",
    numerator:
      "Jumlah pasien kasus klinis prioritas yang mendapatkan asuhan sesuai seluruh/elemen wajib PPK/Clinical Pathway yang ditetapkan",
    denominator:
      "Jumlah seluruh pasien dengan kasus klinis prioritas yang termasuk dalam PPK/Clinical Pathway yang diukur.",
    formula:
      "Jumlah pasien yang mendapat asuhan sesuai PPK/CP ÷ jumlah seluruh pasien kasus prioritas yang diukur × 100%",
    inclusion:
      "Pasien dengan diagnosis/kasus yang telah ditetapkan sebagai kasus klinis prioritas rumah sakit dan memiliki PPK/Clinical Pathway.",
    exclusion:
      "Pasien yang memiliki kondisi khusus/komorbid yang menyebabkan penyimpangan dari PPK/Clinical Pathway dan terdapat alasan klinis yang terdokumentasi.",
    collectionMethod: "Audit rekam medis.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan dan evaluasi triwulanan.",
    dataSource: "Rekam medis dan dokumen PPK/Clinical Pathway.",
    instrument: "Checklist audit kepatuhan PPK/Clinical Pathway.",
    sampling:
      "Total sampling apabila jumlah kasus memungkinkan. Jika kasus banyak, menggunakan sampling yang ditetapkan Komite Mutu.",
    responsibleRole: "Komite Medik/Kelompok Staf Medis dan Komite Mutu.",
    citations: [
      {
        source: "summary",
        pages: [1],
      },
      {
        source: "hospitalProfile",
        pages: [12],
      },
    ],
    issues: [
      "Daftar diagnosis/kasus klinis prioritas serta elemen wajib PPK/Clinical Pathway belum dirinci dalam lampiran ini; gunakan penetapan dan SOP rumah sakit.",
    ],
  },
  {
    id: "RS-08",
    code: "IMP-RS-08",
    scope: "Rumah sakit",
    unit: "Lintas unit",
    title: "Kesiapan Deteksi dan Respons Infeksi",
    summaryTitle: "Kesiapan deteksi dan respons infeksi",
    group: "Tujuan Strategis Rumah Sakit",
    type: "Struktur/Proses",
    targetSources: [
      {
        value: "≥95%",
        citation: {
          source: "summary",
          pages: [1],
        },
      },
      {
        value: "≥95%",
        citation: {
          source: "hospitalProfile",
          pages: [13],
        },
      },
    ],
    definition:
      "Kesiapan deteksi dan respons infeksi adalah kemampuan unit pelayanan dalam melaksanakan rangkaian proses yang telah ditetapkan rumah sakit, mulai dari deteksi/skrining awal, identifikasi risiko, penerapan kewaspadaan yang sesuai, komunikasi kepada petugas terkait dan tindak lanjut sesuai alur respons infeksi.",
    numerator:
      "Jumlah episode/pasien yang memenuhi kriteria risiko infeksi dan seluruh komponen deteksi serta respons dilakukan sesuai standar.",
    denominator:
      "Jumlah seluruh episode/pasien yang memenuhi kriteria untuk dilakukan deteksi dan respons infeksi.",
    formula:
      "Jumlah pasien/episode dengan deteksi dan respons sesuai standar ÷ jumlah pasien/episode yang memenuhi kriteria × 100%",
    inclusion:
      "Pasien yang berdasarkan skrining awal atau kondisi klinis memenuhi kriteria risiko/diduga penyakit infeksi sesuai kebijakan rumah sakit.",
    exclusion: "Pasien yang tidak memenuhi kriteria skrining risiko infeksi.",
    collectionMethod:
      "Observasi, audit rekam medis dan checklist kesiapan unit.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan dan triwulanan",
    dataSource:
      "Rekam medis, formulir skrining infeksi, checklist PPI, register IGD/rawat jalan/rawat inap",
    instrument: "Checklist Deteksi dan Respons Infeksi.",
    sampling:
      "Total sampling untuk kasus yang memenuhi kriteria, terutama pada area pelayanan prioritas",
    responsibleRole:
      "Komite PPI bersama Komite Mutu dan unit pelayanan terkait",
    citations: [
      {
        source: "summary",
        pages: [1],
      },
      {
        source: "hospitalProfile",
        pages: [13],
      },
    ],
    issues: [
      "Kriteria skrining/risiko dan standar respons merujuk kebijakan rumah sakit, tetapi rincian ambang klinis tidak dicantumkan dalam profil ini.",
    ],
  },
  {
    id: "RS-09",
    code: "IMP-RS-09",
    scope: "Rumah sakit",
    unit: "Lintas unit",
    title: "Kepatuhan Rekam Medis Terintegrasi",
    summaryTitle: "Rekam medis terintegrasi",
    group: "Perbaikan Sistem",
    type: "Proses",
    targetSources: [
      {
        value: "≥95%",
        citation: {
          source: "summary",
          pages: [1],
        },
      },
      {
        value: "≥95%",
        citation: {
          source: "hospitalProfile",
          pages: [14],
        },
      },
    ],
    definition:
      "Rekam medis terintegrasi adalah dokumentasi pelayanan pasien yang dilakukan oleh profesi pemberi asuhan dalam satu sistem/dokumen rekam medis yang saling terhubung dan dapat digunakan untuk kesinambungan pelayanan.",
    numerator:
      "Jumlah rekam medis pasien yang memenuhi persyaratan integrasi dokumentasi pelayanan sesuai standar rumah sakit",
    denominator: "Jumlah rekam medis pasien yang diaudit",
    formula:
      "Jumlah rekam medis terintegrasi sesuai standar ÷ jumlah rekam medis yang diaudit × 100%",
    inclusion:
      "Rekam medis pasien yang telah mendapatkan pelayanan dari satu atau lebih profesi pemberi asuhan",
    exclusion:
      "Rekam medis yang belum jatuh tempo untuk dilengkapi pada saat audit",
    collectionMethod: "Audit rekam medis dan/atau audit sistem RME",
    collectionPeriod: "Bulanan",
    analysisPeriod: "Bulanan dan triwulanan",
    dataSource: "RME/SIMRS dan rekam medis",
    instrument: "Checklist audit rekam medis terintegrasi",
    sampling:
      "Sampling rekam medis secara sistematis atau total sampling sesuai volume",
    responsibleRole: "Unit Rekam Medis bersama Komite Mutu dan Unit SIMRS",
    citations: [
      {
        source: "summary",
        pages: [1],
      },
      {
        source: "hospitalProfile",
        pages: [14],
      },
    ],
    issues: [],
  },
  {
    id: "RS-10",
    code: "IMP-RS-10",
    scope: "Rumah sakit",
    unit: "Lintas unit",
    title: "Kepatuhan Skrining Risiko Infeksi/Kewaspadaan Transmisi",
    summaryTitle: "Kepatuhan skrining risiko infeksi/kewaspadaan transmisi",
    group: "Manajemen Risiko",
    type: "Proses",
    targetSources: [
      {
        value: "≥95%",
        citation: {
          source: "summary",
          pages: [1],
        },
      },
      {
        value: "≥95%",
        citation: {
          source: "hospitalProfile",
          pages: [15],
        },
      },
    ],
    definition:
      "Skrining risiko infeksi/kewaspadaan transmisi adalah proses identifikasi pasien yang memiliki risiko atau dugaan penyakit infeksi, diikuti penerapan kewaspadaan standar dan/atau kewaspadaan berdasarkan transmisi sesuai hasil skrining dan kebijakan rumah sakit.",
    numerator:
      "Jumlah pasien yang memenuhi kriteria skrining dan mendapatkan skrining serta kewaspadaan transmisi sesuai standar.",
    denominator:
      "Jumlah seluruh pasien yang memenuhi kriteria untuk dilakukan skrining risiko infeksi.",
    formula:
      "Jumlah pasien dengan skrining dan kewaspadaan sesuai standar ÷ jumlah pasien yang wajib diskrining × 100%",
    inclusion:
      "Seluruh pasien yang berdasarkan kriteria rumah sakit memerlukan skrining risiko infeksi.",
    exclusion: "Pasien yang tidak memenuhi kriteria skrining risiko infeksi.",
    collectionMethod:
      "Observasi langsung dan audit rekam medis/formulir skrining.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan dan triwulanan.",
    dataSource:
      "Rekam medis, formulir skrining infeksi, checklist PPI dan register pelayanan",
    instrument: "Checklist Skrining Risiko Infeksi dan Kewaspadaan Transmisi.",
    sampling:
      "Total sampling atau sampling sesuai volume pasien dan metode yang ditetapkan Komite Mutu/PPI.",
    responsibleRole:
      "Komite PPI bersama Kepala Unit Pelayanan dan Komite Mutu.",
    citations: [
      {
        source: "summary",
        pages: [1],
      },
      {
        source: "hospitalProfile",
        pages: [15],
      },
    ],
    issues: [
      "Kriteria skrining/risiko dan standar respons merujuk kebijakan rumah sakit, tetapi rincian ambang klinis tidak dicantumkan dalam profil ini.",
    ],
  },
  {
    id: "UNIT-IGD",
    code: null,
    scope: "Unit",
    unit: "IGD",
    title: "Kepatuhan Waktu Tanggap Pelayanan IGD",
    summaryTitle: "Kepatuhan waktu tanggap pelayanan IGD",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥90%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "≥90%",
        citation: {
          source: "unitProfile",
          pages: [1],
        },
      },
    ],
    definition:
      "Waktu tanggap pelayanan IGD adalah waktu sejak pasien dilakukan registrasi/triase sampai pasien mendapatkan penilaian atau pelayanan awal oleh dokter sesuai kategori kegawatan dan ketentuan rumah sakit.",
    numerator:
      "Jumlah pasien IGD yang memperoleh pelayanan awal sesuai standar waktu tanggap.",
    denominator: "Jumlah seluruh pasien IGD yang memenuhi kriteria inklusi.",
    formula:
      "Jumlah pasien yang memenuhi standar waktu tanggap ÷ jumlah seluruh pasien yang diukur × 100%.",
    inclusion:
      "Seluruh pasien yang mendapatkan pelayanan di IGD selama periode pengukuran.",
    exclusion:
      "Pasien yang meninggalkan IGD atas permintaan sendiri sebelum mendapatkan pelayanan; pasien DOA apabila tidak termasuk dalam alur pelayanan IGD.",
    collectionMethod:
      "Retrospektif melalui telaah rekam medis/SIMRS dan pencatatan waktu kedatangan, triase, serta pelayanan awal.",
    collectionPeriod: "Bulanan.",
    analysisPeriod:
      "Analisis bulanan; dilaporkan kepada Kepala IGD dan Komite Mutu setiap bulan serta direkapitulasi triwulanan.",
    dataSource: "Rekam medis, register IGD, SIMRS.",
    instrument: "Formulir monitoring waktu tanggap IGD/SIMRS.",
    sampling:
      "Total sampling seluruh pasien IGD yang memenuhi kriteria selama bulan pengukuran.",
    responsibleRole: "Kepala IGD / Penanggung Jawab Mutu IGD.",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [1],
      },
    ],
    issues: [
      "Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.",
    ],
  },
  {
    id: "UNIT-RAWAT-JALAN",
    code: null,
    scope: "Unit",
    unit: "Rawat Jalan",
    title: "Kepatuhan Waktu Tunggu Pelayanan Rawat Jalan",
    summaryTitle: "Waktu tunggu rawat jalan",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥80%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "≥80%",
        citation: {
          source: "unitProfile",
          pages: [2],
        },
      },
    ],
    definition:
      "Waktu tunggu rawat jalan adalah waktu yang dihitung sejak pasien selesai melakukan proses pendaftaran sampai pasien mendapatkan pelayanan dokter sesuai standar yang ditetapkan rumah sakit.",
    numerator:
      "Jumlah pasien rawat jalan yang memperoleh pelayanan sesuai standar waktu tunggu.",
    denominator: "Jumlah seluruh pasien rawat jalan yang diukur.",
    formula:
      "Jumlah pasien sesuai standar waktu tunggu ÷ seluruh pasien yang diukur × 100%.",
    inclusion:
      "Seluruh pasien rawat jalan yang menjalani proses pendaftaran dan mendapatkan pelayanan dokter.",
    exclusion:
      "Pasien yang tidak selesai menjalani proses pelayanan karena pulang atas permintaan sendiri atau alasan administratif yang terdokumentasi.",
    collectionMethod: "Retrospektif melalui SIMRS/register pelayanan.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan dan rekapitulasi triwulanan.",
    dataSource: "SIMRS, pendaftaran, rekam medis.",
    instrument: "Form monitoring waktu tunggu rawat jalan/SIMRS.",
    sampling:
      "Total sampling; apabila volume sangat besar dapat menggunakan sampling sesuai kebijakan Komite Mutu.",
    responsibleRole: "Kepala Unit Rawat Jalan.",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [2],
      },
    ],
    issues: [
      "Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.",
    ],
  },
  {
    id: "UNIT-RAWAT-INAP",
    code: null,
    scope: "Unit",
    unit: "Rawat Inap",
    title: "Kepatuhan Asesmen Awal Pasien Rawat Inap",
    summaryTitle: "Kepatuhan asesmen awal pasien rawat inap",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥95%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "≥95%",
        citation: {
          source: "unitProfile",
          pages: [3],
        },
      },
    ],
    definition:
      "Asesmen awal adalah pengkajian pasien secara komprehensif yang dilakukan setelah pasien masuk rawat inap sesuai ketentuan rumah sakit.",
    numerator:
      "Jumlah pasien rawat inap yang mendapatkan asesmen awal lengkap sesuai ketentuan dan waktu yang ditetapkan.",
    denominator:
      "Jumlah seluruh pasien rawat inap yang memenuhi kriteria inklusi.",
    formula:
      "Jumlah pasien dengan asesmen awal sesuai standar ÷ jumlah seluruh pasien yang diukur × 100%.",
    inclusion: "Seluruh pasien yang masuk rawat inap.",
    exclusion:
      "Pasien yang pulang/meninggal sebelum waktu asesmen yang dipersyaratkan dengan alasan terdokumentasi.",
    collectionMethod: "Audit rekam medis.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan dan triwulanan",
    dataSource: "Rekam medis pasien.",
    instrument: "Form audit asesmen awal.",
    sampling: "Total sampling.",
    responsibleRole: "Kepala Unit Rawat Inap.",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [2, 3],
      },
    ],
    issues: [],
  },
  {
    id: "UNIT-ICU",
    code: null,
    scope: "Unit",
    unit: "ICU",
    title: "Kepatuhan Monitoring Pasien Kritis",
    summaryTitle: "Kepatuhan monitoring pasien kritis",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥95%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "≥95%",
        citation: {
          source: "unitProfile",
          pages: [4],
        },
      },
    ],
    definition:
      "Monitoring pasien kritis meliputi pemantauan parameter klinis yang diperlukan sesuai kondisi pasien dan instruksi medis serta didokumentasikan sesuai interval yang ditetapkan",
    numerator:
      "Jumlah pasien kritis yang mendapatkan monitoring sesuai standar dan terdokumentasi lengkap.",
    denominator: "Jumlah seluruh pasien kritis yang menjadi objek pengukuran.",
    formula:
      "Jumlah pasien dengan monitoring sesuai standar ÷ jumlah pasien yang diukur × 100%.",
    inclusion: "Seluruh pasien yang dirawat di ICU.",
    exclusion:
      "Pasien yang keluar ICU sebelum periode monitoring yang ditentukan.",
    collectionMethod: "Audit rekam medis dan lembar monitoring ICU",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Rekam medis, lembar observasi ICU.",
    instrument: "Checklist audit monitoring pasien kritis.",
    sampling: "Total sampling.",
    responsibleRole: "Kepala ICU.",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [3, 4],
      },
    ],
    issues: [
      "Interval monitoring mengikuti kondisi pasien/instruksi medis dan standar ICU; nilai interval numerik tidak dicantumkan pada profil.",
    ],
  },
  {
    id: "UNIT-ISOLASI",
    code: null,
    scope: "Unit",
    unit: "HLIU",
    title: "Kepatuhan Kewaspadaan Isolasi",
    summaryTitle: "Kepatuhan Kewaspadaan Isolasi",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "100%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "100%",
        citation: {
          source: "unitProfile",
          pages: [4],
        },
      },
    ],
    definition:
      "Kewaspadaan isolasi adalah penerapan kewaspadaan standar dan/atau kewaspadaan berdasarkan transmisi sesuai kondisi pasien, termasuk penggunaan APD, penempatan pasien, kebersihan tangan dan tindakan pencegahan lain yang dipersyaratkan.",
    numerator:
      "Jumlah episode pelayanan pasien yang menerapkan kewaspadaan isolasi sesuai ketentuan",
    denominator:
      "Jumlah seluruh episode pelayanan pasien yang membutuhkan kewaspadaan isolasi",
    formula:
      "Jumlah episode sesuai standar ÷ seluruh episode yang membutuhkan isolasi × 100%.",
    inclusion: "Seluruh pasien yang memenuhi indikasi isolasi.",
    exclusion:
      "Tidak ada, kecuali kondisi khusus yang ditetapkan PPI dan terdokumentasi.",
    collectionMethod: "Observasi langsung dan audit dokumen",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan kepada IPCN/Kepala Unit dan Komite Mutu/PPI.",
    dataSource: "Lembar monitoring PPI, rekam medis, checklist observasi",
    instrument: "Checklist kepatuhan kewaspadaan isolasi",
    sampling:
      "Total sampling atau minimal seluruh episode yang ditemukan pada periode observasi.",
    responsibleRole: "Kepala HILU/Koordinator PPI terkait.",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [4, 5],
      },
    ],
    issues: [
      "Nama unit berbeda: daftar indikator hlm. 2 menulis HLIU, profil unit hlm. 4–5 menulis HILU. Katalog mempertahankan HLIU sebagai nama pada daftar; sebutan resmi perlu dikonfirmasi.",
    ],
  },
  {
    id: "UNIT-KAMAR-OPERASI",
    code: null,
    scope: "Unit",
    unit: "Kamar Operasi",
    title: "Kepatuhan Penandaan Lokasi Operasi",
    summaryTitle: "Kepatuhan penandaan lokasi",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "100%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "100%",
        citation: {
          source: "unitProfile",
          pages: [5],
        },
      },
    ],
    definition:
      "Penandaan lokasi operasi adalah pemberian tanda pada lokasi operasi yang benar sebelum pasien menjalani tindakan, sesuai prosedur dan ketentuan keselamatan pasien.",
    numerator:
      "Jumlah pasien operasi yang dilakukan penandaan lokasi operasi sesuai ketentuan.",
    denominator:
      "Jumlah seluruh pasien operasi yang memerlukan penandaan lokasi operasi.",
    formula:
      "Jumlah pasien sesuai standar ÷ seluruh pasien yang membutuhkan penandaan × 100%.",
    inclusion:
      "Pasien yang menjalani operasi/prosedur yang memerlukan penandaan lokasi.",
    exclusion:
      "Operasi yang secara klinis tidak memerlukan penandaan lokasi atau kondisi yang dikecualikan dalam kebijakan keselamatan operasi.",
    collectionMethod:
      "Observasi dan audit rekam medis/checklist keselamatan operasi.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Rekam medis dan Surgical Safety Checklist",
    instrument: "Checklist audit penandaan lokasi operasi.",
    sampling: "Total sampling.",
    responsibleRole: "Kepala Kamar Operasi",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [5, 6],
      },
    ],
    issues: [],
  },
  {
    id: "UNIT-REHABILITASI-MEDIK",
    code: null,
    scope: "Unit",
    unit: "Rehabilitasi Medik",
    title: "Kepatuhan Pelaksanaan Program Rehabilitasi Pasien",
    summaryTitle: "Kepatuhan program rehabilitasi Paisen",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥80%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "≥80%",
        citation: {
          source: "unitProfile",
          pages: [6],
        },
      },
    ],
    definition:
      "Program rehabilitasi pasien adalah intervensi rehabilitasi medik yang telah ditetapkan berdasarkan asesmen dan dilaksanakan sesuai jadwal/rencana pelayanan.",
    numerator:
      "Jumlah pasien yang mendapatkan program rehabilitasi sesuai rencana",
    denominator: "Jumlah seluruh pasien yang memiliki program rehabilitasi",
    formula:
      "Pasien dengan program sesuai rencana ÷ pasien yang memiliki program × 100%.",
    inclusion: "Pasien yang telah ditetapkan membutuhkan rehabilitasi medik",
    exclusion:
      "Pasien yang menolak terapi, kondisi medis tidak memungkinkan atau tidak hadir dengan alasan terdokumentasi",
    collectionMethod: "Audit rekam medis dan register rehabilitasi",
    collectionPeriod: "Bulanan",
    analysisPeriod: "Bulanan dan triwulanan",
    dataSource: "Rekam medis dan register rehabilitasi medik",
    instrument: "Checklist audit",
    sampling: "Total sampling",
    responsibleRole: "Kepala Rehabilitasi Medik",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [6],
      },
    ],
    issues: [
      "Daftar indikator menulis “Paisen”; judul tampilan mengikuti profil rinci “Pasien”. Perbedaan ejaan tidak mengubah target sumber.",
    ],
  },
  {
    id: "UNIT-FARMASI",
    code: null,
    scope: "Unit",
    unit: "Farmasi",
    title: "Kepatuhan Penggunaan Formularium Nasional",
    summaryTitle: "Kepatuhan penggunaan formularium nasional",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥80%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "≥80%",
        citation: {
          source: "unitProfile",
          pages: [7],
        },
      },
    ],
    definition:
      "Kepatuhan penggunaan formularium nasional adalah kesesuaian obat yang diresepkan/diberikan dengan daftar obat yang tercantum dalam Formularium Nasional sesuai indikasi dan ketentuan yang berlaku.",
    numerator: "Jumlah resep/obat yang sesuai Formularium Nasional.",
    denominator: "Jumlah seluruh resep/obat yang menjadi sampel",
    formula:
      "Jumlah resep sesuai formularium ÷ jumlah resep yang diperiksa × 100%.",
    inclusion: "Resep pasien yang termasuk dalam cakupan pengukuran",
    exclusion:
      "Obat yang tidak tersedia karena kekosongan stok yang terdokumentasi atau kondisi klinis tertentu yang memiliki dasar pengecualian sesuai ketentuan",
    collectionMethod: "Audit resep.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Resep, SIMRS, sistem farmasi",
    instrument: "Form audit kepatuhan formularium",
    sampling:
      "Total sampling atau sampling resep secara sistematis sesuai volume",
    responsibleRole: "Kepala Instalasi Farmasi",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [7],
      },
    ],
    issues: [],
  },
  {
    id: "UNIT-LABORATORIUM",
    code: null,
    scope: "Unit",
    unit: "Laboratorium",
    title: "Kepatuhan Pelaporan Hasil Kritis Laboratorium",
    summaryTitle: "Pelaporan hasil kritis laboratorium",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "100%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "100%",
        citation: {
          source: "unitProfile",
          pages: [8],
        },
      },
    ],
    definition:
      "Pelaporan hasil kritis adalah penyampaian hasil laboratorium yang termasuk nilai kritis kepada dokter/petugas yang bertanggung jawab sesuai batas waktu yang ditetapkan rumah sakit serta didokumentasikan.",
    numerator:
      "Jumlah hasil kritis yang dilaporkan dan didokumentasikan sesuai standar.",
    denominator: "Jumlah seluruh hasil laboratorium kritis.",
    formula:
      "Jumlah hasil kritis sesuai standar ÷ seluruh hasil kritis × 100%.",
    inclusion: "Seluruh hasil laboratorium yang masuk daftar nilai kritis.",
    exclusion: "Hasil yang tidak termasuk daftar nilai kritis rumah sakit",
    collectionMethod: "Audit laboratorium dan rekam medis",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "SIMRS, register hasil kritis",
    instrument: "Form monitoring hasil kritis",
    sampling: "Total sampling",
    responsibleRole: "Kepala Laboratorium",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [7, 8],
      },
    ],
    issues: [
      "Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.",
    ],
  },
  {
    id: "UNIT-RADIOLOGI",
    code: null,
    scope: "Unit",
    unit: "Radiologi",
    title: "Kepatuhan Pelaporan Hasil Kritis Radiologi",
    summaryTitle: "Pelaporan hasil kritis radiologi",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "100%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "100%",
        citation: {
          source: "unitProfile",
          pages: [9],
        },
      },
    ],
    definition:
      "Pelaporan hasil kritis radiologi adalah penyampaian temuan radiologi yang termasuk kategori kritis kepada dokter/petugas yang bertanggung jawab sesuai waktu dan prosedur rumah sakit serta didokumentasikan",
    numerator:
      "Jumlah hasil kritis radiologi yang dilaporkan dan didokumentasikan sesuai standar.",
    denominator: "Jumlah seluruh hasil kritis radiologi",
    formula:
      "Jumlah hasil kritis yang dilaporkan sesuai standar ÷ seluruh hasil kritis × 100%.",
    inclusion: "Seluruh hasil radiologi yang ditetapkan sebagai hasil kritis",
    exclusion: "Hasil yang tidak termasuk kategori kritis",
    collectionMethod: "Audit register radiologi dan rekam medis",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan",
    dataSource: "SIMRS/RIS, register radiologi, rekam medis",
    instrument: "Form audit hasil kritis radiologi.",
    sampling: "Total sampling",
    responsibleRole: "Kepala Instalasi Radiologi.",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [8, 9],
      },
    ],
    issues: [
      "Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.",
    ],
  },
  {
    id: "UNIT-CSSD",
    code: null,
    scope: "Unit",
    unit: "CSSD",
    title: "Kepatuhan Proses Sterilisasi",
    summaryTitle: "Kepatuhan proses sterilisasi",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "100%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "100%",
        citation: {
          source: "unitProfile",
          pages: [9],
        },
      },
    ],
    definition:
      "Proses sterilisasi meliputi penerimaan, dekontaminasi, pembersihan, pengemasan, sterilisasi, monitoring, penyimpanan dan distribusi sesuai prosedur yang berlaku.",
    numerator:
      "Jumlah siklus/proses sterilisasi yang memenuhi seluruh persyaratan",
    denominator: "Jumlah seluruh proses/siklus sterilisasi yang diperiksa",
    formula:
      "Proses sterilisasi sesuai standar ÷ seluruh proses yang diperiksa × 100%.",
    inclusion: "Seluruh proses sterilisasi yang dilakukan CSSD",
    exclusion:
      "Siklus yang dibatalkan sebelum proses selesai dengan alasan terdokumentasi.",
    collectionMethod: "Observasi dan audit dokumen sterilisasi",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Logbook CSSD, indikator sterilisasi, catatan mesin.",
    instrument: "Checklist audit CSSD",
    sampling:
      "Total sampling siklus atau sesuai metode sampling yang ditetapkan",
    responsibleRole: "Kepala CSSD",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [9, 10],
      },
    ],
    issues: [],
  },
  {
    id: "UNIT-GIZI",
    code: null,
    scope: "Unit",
    unit: "Gizi",
    title: "Ketepatan Pemberian Diet Pasien",
    summaryTitle: "Ketepatan pemberian diet pasien",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥80%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "≥80%",
        citation: {
          source: "unitProfile",
          pages: [10],
        },
      },
    ],
    definition:
      "Ketepatan pemberian diet adalah kesesuaian jenis, bentuk dan kebutuhan diet pasien dengan diet yang ditetapkan dalam rekam medis/permintaan diet.",
    numerator: "Jumlah pasien yang menerima diet sesuai ketentuan.",
    denominator: "Jumlah seluruh pasien yang diperiksa.",
    formula: "Pasien dengan diet tepat ÷ seluruh pasien yang diperiksa × 100%.",
    inclusion: "Seluruh pasien yang mendapatkan makanan dari unit gizi.",
    exclusion: "Pasien yang sedang puasa atas indikasi medis.",
    collectionMethod: "Observasi distribusi makanan dan audit dokumen diet.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Rekam medis, daftar diet, daftar distribusi makanan.",
    instrument: "Checklist ketepatan diet.",
    sampling: "Total sampling atau minimal sampel harian sesuai volume pasien.",
    responsibleRole: "Kepala Instalasi Gizi.",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [10],
      },
    ],
    issues: [],
  },
  {
    id: "UNIT-LAUNDRY",
    code: null,
    scope: "Unit",
    unit: "Laundry",
    title: "Kepatuhan Pemisahan Linen Infeksius dan Noninfeksius",
    summaryTitle: "Kepatuhan pemisahan linen infeksius dan noninfeksius",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "100%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "100%",
        citation: {
          source: "unitProfile",
          pages: [11],
        },
      },
    ],
    definition:
      "Pemisahan linen adalah pemilahan linen infeksius dan noninfeksius sejak sumber berdasarkan kategori yang telah ditetapkan dan ditempatkan pada wadah yang sesuai.",
    numerator:
      "Jumlah kejadian/observasi pemisahan linen yang dilakukan sesuai standar.",
    denominator: "Jumlah seluruh kejadian/observasi pemisahan linen.",
    formula: "Pemisahan sesuai standar ÷ seluruh kesempatan observasi × 100%.",
    inclusion: "Seluruh proses pengelolaan linen yang diamati.",
    exclusion: "Tidak ada.",
    collectionMethod: "Observasi langsung.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Checklist monitoring laundry/PPI.",
    instrument: "Checklist pemisahan linen.",
    sampling: "Total sampling pada kesempatan observasi yang ditetapkan.",
    responsibleRole: "Kepala Laundry.",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [10, 11],
      },
    ],
    issues: [
      "Daftar indikator menulis “Loundry”, sedangkan profil rinci menulis “LAUNDRY”. Nama tampilan menggunakan Laundry; penulisan unit pada sumber tetap dicatat.",
    ],
  },
  {
    id: "UNIT-REKAM-MEDIS",
    code: null,
    scope: "Unit",
    unit: "Rekam Medis",
    title: "Kelengkapan Rekam Medis",
    summaryTitle: "Kelengkapan rekam medis elektronik",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥80%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "≥80%",
        citation: {
          source: "unitProfile",
          pages: [11],
        },
      },
    ],
    definition:
      "Kelengkapan rekam medis adalah terpenuhinya seluruh elemen wajib pengisian rekam medis sesuai ketentuan rumah sakit.",
    numerator: "Jumlah rekam medis yang lengkap sesuai standar.",
    denominator: "Jumlah seluruh rekam medis yang diaudit.",
    formula: "Rekam medis lengkap ÷ rekam medis yang diaudit × 100%.",
    inclusion:
      "Rekam medis pasien yang telah selesai menjalani pelayanan sesuai periode audit.",
    exclusion: "Rekam medis yang belum jatuh tempo untuk dilengkapi.",
    collectionMethod: "Audit rekam medis.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Dokumen rekam medis/SIMRS.",
    instrument: "Checklist kelengkapan rekam medis.",
    sampling: "Total sampling atau sampling sistematis sesuai volume.",
    responsibleRole: "Kepala Unit Rekam Medis.",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [11, 12],
      },
    ],
    issues: [
      "Cakupan judul berbeda: daftar menyebut rekam medis elektronik, sedangkan profil berjudul Kelengkapan Rekam Medis dan mencantumkan dokumen rekam medis/SIMRS. Cakupan final perlu dikonfirmasi.",
    ],
  },
  {
    id: "UNIT-PENDAFTARAN",
    code: null,
    scope: "Unit",
    unit: "Pendaftaran",
    title: "Kepatuhan Kelengkapan Data Administratif Pasien",
    summaryTitle: "Kepatuhan kelengkapan data administratif pasien",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥95%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "≥95%",
        citation: {
          source: "unitProfile",
          pages: [17],
        },
      },
    ],
    definition:
      "Kelengkapan data administratif pasien adalah terpenuhinya seluruh data wajib pasien sesuai format pendaftaran rumah sakit.",
    numerator: "Jumlah pasien dengan data administratif lengkap",
    denominator:
      "Jumlah pasien yang diperiksa kelengkapan data administratifnya",
    formula: "Pasien dengan data lengkap ÷ seluruh pasien yang diaudit × 100%.",
    inclusion: "Seluruh pasien yang melakukan pendaftaran.",
    exclusion:
      "Data yang belum dapat dilengkapi karena kondisi emergensi, dengan ketentuan dilengkapi setelah kondisi memungkinkan.",
    collectionMethod: "Audit SIMRS dan dokumen pendaftaran.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "SIMRS dan formulir pendaftaran.",
    instrument: "Checklist kelengkapan data pasien.",
    sampling: "Total sampling atau sampling sistematis sesuai volume.",
    responsibleRole: "Kepala Unit Pendaftaran.",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [17],
      },
    ],
    issues: [],
  },
  {
    id: "UNIT-SIMRS",
    code: null,
    scope: "Unit",
    unit: "SIMRS",
    title: "Kepatuhan Penyelesaian Gangguan SIMRS",
    summaryTitle: "Penyelesaian gangguan SIMRS",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥90%",
        citation: {
          source: "summary",
          pages: [2],
        },
      },
      {
        value: "≥90%",
        citation: {
          source: "unitProfile",
          pages: [12],
        },
      },
    ],
    definition:
      "Penyelesaian gangguan SIMRS adalah penyelesaian masalah sistem informasi yang telah dilaporkan oleh pengguna sampai sistem kembali dapat digunakan sesuai standar waktu layanan.",
    numerator: "Jumlah gangguan SIMRS yang diselesaikan sesuai standar waktu",
    denominator:
      "Jumlah seluruh gangguan SIMRS yang memenuhi kriteria pengukuran",
    formula:
      "Gangguan terselesaikan sesuai standar waktu ÷ seluruh gangguan yang diukur × 100%.",
    inclusion: "Seluruh gangguan SIMRS yang dilaporkan melalui kanal resmi.",
    exclusion:
      "Gangguan akibat force majeure atau pihak ketiga yang tidak dapat diselesaikan dalam kendali rumah sakit, dengan dokumentasi.",
    collectionMethod: "Audit helpdesk/ticketing.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Log gangguan SIMRS/helpdesk.",
    instrument: "Form/ticketing system SIMRS.",
    sampling: "Total sampling.",
    responsibleRole: "Kepala Unit SIMRS/IT.",
    citations: [
      {
        source: "summary",
        pages: [2],
      },
      {
        source: "unitProfile",
        pages: [12, 13],
      },
    ],
    issues: [
      "Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.",
    ],
  },
  {
    id: "UNIT-PEMELIHARAAN-ALAT",
    code: null,
    scope: "Unit",
    unit: "Pemeliharaan Alat Medis",
    title: "Kepatuhan Kalibrasi Alat Medis",
    summaryTitle: "Kepatuhan kalibrasi alat medis",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥90%",
        citation: {
          source: "summary",
          pages: [3],
        },
      },
      {
        value: "≥90%",
        citation: {
          source: "unitProfile",
          pages: [13],
        },
      },
    ],
    definition:
      "Kepatuhan kalibrasi adalah pelaksanaan kalibrasi terhadap alat medis yang wajib dikalibrasi sesuai jadwal yang ditetapkan dan memiliki bukti kalibrasi yang sah.",
    numerator:
      "Jumlah alat medis yang wajib dikalibrasi dan telah dikalibrasi sesuai jadwal.",
    denominator:
      "Jumlah seluruh alat medis yang wajib dikalibrasi pada periode tersebut.",
    formula:
      "Alat terkalibrasi sesuai jadwal ÷ alat yang wajib dikalibrasi × 100%.",
    inclusion: "Seluruh alat medis yang masuk daftar wajib kalibrasi.",
    exclusion:
      "Alat yang sedang tidak digunakan karena rusak/ditarik dari pelayanan dan terdokumen",
    collectionMethod: "Audit daftar inventaris dan sertifikat kalibrasi",
    collectionPeriod: "Bulanan",
    analysisPeriod: "Bulanan dan triwulanan",
    dataSource: "Daftar alat medis, sertifikat kalibrasi",
    instrument: "Checklist monitoring kalibrasi",
    sampling: "Total sampling",
    responsibleRole: "Penanggung Jawab Pemeliharaan Alat Medis/IPSRS terkait",
    citations: [
      {
        source: "summary",
        pages: [3],
      },
      {
        source: "unitProfile",
        pages: [13],
      },
    ],
    issues: [],
  },
  {
    id: "UNIT-AMBULANS",
    code: null,
    scope: "Unit",
    unit: "Ambulans",
    title: "Kepatuhan Kelengkapan Alat dan Obat Emergensi Ambulans",
    summaryTitle: "Kepatuhan kelengkapan alat dan obat emergensi ambulans",
    group: "Prioritas unit",
    type: "Input/Proses",
    targetSources: [
      {
        value: "100%",
        citation: {
          source: "summary",
          pages: [3],
        },
      },
      {
        value: "100%",
        citation: {
          source: "unitProfile",
          pages: [14],
        },
      },
    ],
    definition:
      "Kelengkapan alat dan obat emergensi adalah tersedianya seluruh item yang dipersyaratkan dalam checklist ambulans, dalam kondisi baik dan belum kedaluwarsa.",
    numerator:
      "Jumlah pemeriksaan kesiapan ambulans yang menunjukkan seluruh alat dan obat emergensi lengkap.",
    denominator: "Jumlah seluruh pemeriksaan kesiapan ambulans.",
    formula: "Pemeriksaan lengkap ÷ seluruh pemeriksaan × 100%.",
    inclusion: "Seluruh pemeriksaan kesiapan ambulans sebelum operasional.",
    exclusion:
      "Ambulans yang sedang dalam perbaikan dan tidak digunakan, dengan dokumentasi.",
    collectionMethod: "Checklist pemeriksaan langsung.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Checklist ambulans.",
    instrument: "Checklist kesiapan ambulans.",
    sampling: "Total sampling setiap hari sebelum ambulans digunakan.",
    responsibleRole: "Koordinator Ambulans.",
    citations: [
      {
        source: "summary",
        pages: [3],
      },
      {
        source: "unitProfile",
        pages: [13, 14],
      },
    ],
    issues: [],
  },
  {
    id: "UNIT-PEMULASARAAN",
    code: null,
    scope: "Unit",
    unit: "Pemulasaraan Jenazah",
    title: "Kepatuhan Serah Terima Jenazah",
    summaryTitle: "Kepatuhan serah terima jenazah",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥90%",
        citation: {
          source: "summary",
          pages: [3],
        },
      },
      {
        value: "≥90%",
        citation: {
          source: "unitProfile",
          pages: [15],
        },
      },
    ],
    definition:
      "Serah terima jenazah adalah proses penyerahan jenazah kepada keluarga/pihak yang berhak setelah dilakukan verifikasi identitas dan dokumentasi sesuai prosedur",
    numerator:
      "Jumlah serah terima jenazah yang dilakukan sesuai prosedur dan terdokumentasi",
    denominator: "Jumlah seluruh proses serah terima jenazah",
    formula: "Serah terima sesuai prosedur ÷ seluruh serah terima × 100%.",
    inclusion: "Seluruh jenazah yang diserahterimakan kepada pihak yang berhak",
    exclusion:
      "Jenazah yang masih dalam proses hukum/forensik atau belum dapat diserahterimakan",
    collectionMethod: "Audit dokumen dan observasi",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Register jenazah dan formulir serah terima.",
    instrument: "Checklist serah terima jenazah",
    sampling: "Total sampling",
    responsibleRole: "Kepala Unit Pemulasaraan Jenazah",
    citations: [
      {
        source: "summary",
        pages: [3],
      },
      {
        source: "unitProfile",
        pages: [14, 15],
      },
    ],
    issues: [],
  },
  {
    id: "UNIT-SANITASI",
    code: null,
    scope: "Unit",
    unit: "Sanitasi/Limbah",
    title: "Kepatuhan Pengelolaan Limbah Infeksius",
    summaryTitle: "Kepatuhan pengelolaan limbah infeksius",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "100%",
        citation: {
          source: "summary",
          pages: [3],
        },
      },
      {
        value: "100%",
        citation: {
          source: "unitProfile",
          pages: [15],
        },
      },
    ],
    definition:
      "Pengelolaan limbah infeksius meliputi pemilahan, pewadahan, pelabelan, pengangkutan internal, penyimpanan sementara dan proses selanjutnya sesuai ketentuan yang berlaku.",
    numerator:
      "Jumlah proses pengelolaan limbah infeksius yang memenuhi standar.",
    denominator: "Jumlah seluruh proses/kesempatan yang diamati.",
    formula: "Proses sesuai standar ÷ seluruh proses yang diamati × 100%.",
    inclusion:
      "Seluruh proses pengelolaan limbah infeksius yang dilakukan di rumah sakit.",
    exclusion: "Tidak ada.",
    collectionMethod: "Observasi dan audit dokumen.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Checklist sanitasi/PPI dan logbook limbah.",
    instrument: "Checklist pengelolaan limbah infeksius.",
    sampling: "Total sampling kesempatan observasi.",
    responsibleRole: "Kepala Unit Sanitasi/Limbah.",
    citations: [
      {
        source: "summary",
        pages: [3],
      },
      {
        source: "unitProfile",
        pages: [15, 16],
      },
    ],
    issues: [],
  },
  {
    id: "UNIT-HUMAS",
    code: null,
    scope: "Unit",
    unit: "Humas",
    title: "Kecepatan respon terhadap komplain pasien",
    summaryTitle: "Kecepatan respon terhadap komplain pasien",
    group: "Prioritas unit",
    type: "Belum tercantum",
    targetSources: [
      {
        value: "≥85%",
        citation: {
          source: "summary",
          pages: [3],
        },
      },
    ],
    definition: null,
    numerator: null,
    denominator: null,
    formula: null,
    inclusion: null,
    exclusion: null,
    collectionMethod: null,
    collectionPeriod: null,
    analysisPeriod: null,
    dataSource: null,
    instrument: null,
    sampling: null,
    responsibleRole: null,
    citations: [
      {
        source: "summary",
        pages: [3],
      },
    ],
    issues: [
      "Profil rinci Humas tidak ditemukan dalam dokumen profil unit (23 profil untuk 24 unit pada daftar). Definisi, numerator, denominator, rumus, periode, dan penanggung jawab belum tersedia; tidak diisi dengan asumsi.",
    ],
  },
  {
    id: "UNIT-SDM",
    code: null,
    scope: "Unit",
    unit: "SDM",
    title: "Kepatuhan Orientasi Staf Baru",
    summaryTitle: "Kepatuhan orientasi staf baru",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "95%",
        citation: {
          source: "summary",
          pages: [3],
        },
      },
      {
        value: "100%",
        citation: {
          source: "unitProfile",
          pages: [16],
        },
      },
    ],
    definition:
      "Orientasi staf baru adalah proses pengenalan dan pembekalan staf mengenai organisasi, unit kerja, tugas dan kewenangan, keselamatan pasien, PPI, K3, mutu serta ketentuan lain yang diwajibkan.",
    numerator:
      "Jumlah staf baru yang telah menyelesaikan orientasi sesuai ketentuan",
    denominator:
      "Jumlah seluruh staf baru yang mulai bekerja pada periode pengukuran",
    formula: "Staf baru selesai orientasi ÷ seluruh staf baru × 100%.",
    inclusion: "Seluruh staf baru.",
    exclusion:
      "Staf yang sudah pernah bekerja di unit yang sama dan memiliki bukti orientasi yang masih berlaku sesuai kebijakan rumah sakit.",
    collectionMethod: "Audit dokumen orientasi",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "Berkas kepegawaian dan formulir orientasi",
    instrument: "Checklist orientasi staf baru",
    sampling: "Total sampling",
    responsibleRole: "Kepala Unit SDM/Kepegawaian.",
    citations: [
      {
        source: "summary",
        pages: [3],
      },
      {
        source: "unitProfile",
        pages: [16, 17],
      },
    ],
    issues: [
      "Target berbeda: daftar indikator hlm. 3 menulis 95% (tanpa operator ≥), sedangkan profil orientasi staf baru hlm. 16 menulis 100%. Katalog tidak menetapkan salah satunya sebagai target resmi.",
    ],
  },
  {
    id: "UNIT-KEUANGAN",
    code: null,
    scope: "Unit",
    unit: "Keuangan",
    title: "Ketepatan Penyelesaian Administrasi Pasien",
    summaryTitle: "Ketepatan penyelesaian administrasi pasien",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥95%",
        citation: {
          source: "summary",
          pages: [3],
        },
      },
      {
        value: "≥95%",
        citation: {
          source: "unitProfile",
          pages: [18],
        },
      },
    ],
    definition:
      "Penyelesaian administrasi pasien adalah penyelesaian proses administrasi dan/atau pembayaran sesuai ketentuan dan batas waktu pelayanan yang ditetapkan rumah sakit.",
    numerator:
      "Jumlah pasien yang administrasinya selesai sesuai standar waktu/prosedur.",
    denominator: "Jumlah seluruh pasien yang menjadi objek pengukuran.",
    formula:
      "Pasien dengan administrasi selesai sesuai standar ÷ seluruh pasien yang diukur × 100%.",
    inclusion:
      "Seluruh pasien yang telah selesai menjalani pelayanan dan membutuhkan penyelesaian administrasi.",
    exclusion:
      "Kasus yang tertunda karena kendala eksternal atau administrasi pihak ketiga dengan bukti dokumentasi.",
    collectionMethod: "Audit dokumen dan SIMRS.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan.",
    dataSource: "SIMRS, kasir dan dokumen administrasi pasien.",
    instrument: "Checklist monitoring administrasi.",
    sampling: "Total sampling.",
    responsibleRole: "Kepala Unit Keuangan.",
    citations: [
      {
        source: "summary",
        pages: [3],
      },
      {
        source: "unitProfile",
        pages: [18],
      },
    ],
    issues: [
      "Standar batas waktu disebut dalam profil tetapi nilai menit/jam tidak dicantumkan. Tidak ada ambang waktu numerik yang dibuat oleh aplikasi.",
    ],
  },
  {
    id: "UNIT-HOUSEKEEPING",
    code: null,
    scope: "Unit",
    unit: "Housekeeping",
    title: "Kepatuhan Kebersihan Area Pelayanan",
    summaryTitle: "Kepatuhan kebersihan area pelayanan",
    group: "Prioritas unit",
    type: "Proses",
    targetSources: [
      {
        value: "≥95%",
        citation: {
          source: "summary",
          pages: [3],
        },
      },
      {
        value: "≥95%",
        citation: {
          source: "unitProfile",
          pages: [19],
        },
      },
    ],
    definition:
      "Kepatuhan kebersihan area pelayanan adalah kesesuaian pelaksanaan pembersihan dan disinfeksi area pelayanan dengan jadwal, metode, bahan dan frekuensi yang ditetapkan rumah sakit.",
    numerator:
      "Jumlah area pelayanan yang memenuhi standar kebersihan berdasarkan hasil inspeksi.",
    denominator: "Jumlah seluruh area pelayanan yang diperiksa.",
    formula: "Area yang memenuhi standar ÷ seluruh area yang diperiksa × 100%.",
    inclusion: "Seluruh area pelayanan yang menjadi objek pemeriksaan.",
    exclusion:
      "Area yang sedang direnovasi atau ditutup sementara dengan dokumentasi.",
    collectionMethod:
      "Observasi langsung menggunakan checklist inspeksi kebersihan.",
    collectionPeriod: "Bulanan.",
    analysisPeriod: "Bulanan dan rekapitulasi triwulanan.",
    dataSource: "Checklist housekeeping dan hasil inspeksi.",
    instrument: "Checklist kebersihan area pelayanan.",
    sampling:
      "Total sampling area prioritas; area pelayanan berisiko tinggi diperiksa secara rutin.",
    responsibleRole: "Kepala/Koordinator Housekeeping.",
    citations: [
      {
        source: "summary",
        pages: [3],
      },
      {
        source: "unitProfile",
        pages: [18, 19],
      },
    ],
    issues: [],
  },
];
