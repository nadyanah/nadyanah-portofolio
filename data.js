/**
 * Data Menu Portofolio People & Culture
 * Semua konten portofolio diletakkan di sini agar mudah diedit atau ditambah di masa mendatang.
 *
 * PORTFOLIO_DATA_VERSION: naikkan angka ini setiap kali isi PORTFOLIO_MENU di bawah
 * diubah manual (misalnya ganti kategori, tambah/hapus item default). Ini yang
 * bikin browser lama otomatis "refresh" cache localStorage-nya, jadi konten baru
 * di file ini nggak ketiban data lama yang sempat tersimpan di browser.
 */
const PORTFOLIO_DATA_VERSION = 2;

const PORTFOLIO_MENU = [
  {
    id: "onboarding-delight",
    name: "Onboarding Delight Salad",
    category: "people-culture",
    categoryLabel: "People Culture",
    price: "Est. 2024",
    shortDescription: "Sajian pembuka yang segar untuk menyambut talenta baru. Mengubah hari pertama kerja yang menegangkan menjadi petualangan rasa yang hangat, terstruktur, dan penuh kenyamanan.",
    image: "assets/images/onboarding_salad_1782396862597.jpg",
    prepTime: "2 Bulan Pengembangan",
    satisfaction: "98% Welcome Rating",
    impactMetric: "-35% Turnover Bulan Pertama",
    ingredients: [
      "Digital Interactive LMS Portal",
      "Tailored Buddy System Guide",
      "Warm Welcome Kit Design",
      "Day 1 to Day 90 Touchpoint Checklist",
      "Cross-Departmental Immersion Card"
    ],
    allergens: [
      "Informasi Berlebih (Cognitive Overload)",
      "Kecemasan Hari Pertama (Day-1 Anxiety)",
      "Proses Administrasi yang Manual & Lambat"
    ],
    chefNotes: {
      background: "Banyak karyawan baru merasa kebingungan dan kewalahan di minggu pertama akibat administrasi yang tidak efisien dan ketiadaan bimbingan terarah, memicu tingkat pengunduran diri dini yang cukup tinggi.",
      challenge: "Bagaimana mendesain perjalanan onboarding yang tidak membosankan namun tetap informatif, berempati, serta mampu mengintegrasikan aspek sosial dan fungsional dengan cepat?",
      recipe: [
        "Mendemonstrasikan riset empati (Employee Journey Mapping) bersama manajer dan karyawan yang baru bergabung.",
        "Merancang 'LMS Onboarding Quest' yang interaktif, di mana karyawan baru bisa mempelajari sejarah, produk, dan nilai perusahaan secara asinkron.",
        "Membuat program 'Culture Buddies' dengan skema panduan tugas mingguan yang jelas untuk membantu sosialisasi dengan tim lintas divisi.",
        "Menstandarisasi 'Day-1 Surprise Kit' yang berfokus pada kenyamanan kerja fisik dan mental."
      ],
      results: [
        "Mengurangi tingkat pengunduran diri karyawan baru di bawah 90 hari sebesar 35%.",
        "Mencapai skor kepuasan onboarding rata-rata sebesar 4.8 / 5.0.",
        "Menghemat waktu manajer dalam sesi orientasi dasar hingga 12 jam per karyawan baru."
      ],
      philosophy: "Kesempatan pertama tidak datang dua kali. Hidangan pembuka yang disajikan dengan kehangatan tulus akan menentukan seluruh selera makan di sepanjang jamuan."
    }
  },
  {
    id: "performance-wellington",
    name: "Strategic Performance Wellington",
    category: "organizational-development",
    categoryLabel: "Organizational Development",
    price: "Scale 500+ Staff",
    shortDescription: "Menu utama yang padat, kaya struktur, dan matang sempurna. Kerangka kerja evaluasi kinerja yang seimbang untuk menyelaraskan ambisi individu dengan visi pertumbuhan organisasi.",
    image: "assets/images/performance_wellington_1782396876645.jpg",
    prepTime: "4 Bulan Sinkronisasi",
    satisfaction: "92% Manajer Puas",
    impactMetric: "100% Selaras dengan OKR",
    ingredients: [
      "Balanced Scorecard Methodology",
      "OKR Matrix Cascade Planner",
      "9-Box Grid Talent Calibration",
      "Continuous Feed-forward Dialogues",
      "Fair Compensation Linkage Formula"
    ],
    allergens: [
      "Evaluasi yang Bias & Subjektif",
      "Ketakutan Menghadapi Review (Review Dread)",
      "Ketidakjelasan Indikator Keberhasilan"
    ],
    chefNotes: {
      background: "Sistem penilaian kinerja lama dinilai tidak transparan, hanya dilakukan sekali setahun, dan memicu kecemasan kolektif tanpa memberikan solusi pengembangan karir yang riil.",
      challenge: "Mengembangkan skema penilaian kinerja yang objektif, berbasis data, berorientasi masa depan (future-focused), serta memfasilitasi dialog dua arah antara manajer dan anggota tim.",
      recipe: [
        "Merestrukturisasi KPI tradisional menjadi sistem OKR (Objectives & Key Results) yang transparan dan dapat dipantau bersama di dashboard.",
        "Mengadakan pelatihan kalibrasi bakat (9-Box Grid) bagi para kepala divisi untuk menghilangkan bias subjektivitas.",
        "Membuat protokol 'Monthly Check-ins' yang berfokus pada perbaikan (feed-forward) alih-alih penghukuman atas kesalahan masa lalu.",
        "Menghubungkan hasil penilaian kinerja secara transparan dengan peta peluang karir dan kenaikan kompensasi."
      ],
      results: [
        "100% departemen berhasil menyelaraskan sasaran kerja harian dengan visi strategis tahunan perusahaan.",
        "Meningkatkan rasa keadilan penilaian kinerja sebesar 45% berdasarkan survei internal tahunan.",
        "Mempercepat proses kalibrasi kenaikan pangkat dari yang semula butuh waktu 3 minggu menjadi hanya 4 hari."
      ],
      philosophy: "Seperti mematangkan Wellington steak yang tebal, evaluasi kinerja membutuhkan temperatur stabil, konsistensi waktu, dan kehati-hatian tingkat tinggi agar setiap serat talenta berkembang secara merata."
    }
  },
  {
    id: "cohesion-risotto",
    name: "Engagement Cohesion Risotto",
    category: "people-culture",
    categoryLabel: "People Culture",
    price: "Est. 2023",
    shortDescription: "Sebuah risotto krimi hangat yang menggabungkan berbagai latar belakang talenta menjadi satu kesatuan yang lezat. Mempererat keterlibatan karyawan melalui program budaya yang inklusif.",
    image: "assets/images/engagement_risotto_1782396891520.jpg",
    prepTime: "3 Bulan Desain Budaya",
    satisfaction: "94% Employee Trust",
    impactMetric: "+25% Engagement Index",
    ingredients: [
      "Psychological Safety Workshop",
      "Inclusive Cultural Celebrations",
      "Mental Health Well-being Circle",
      "Cross-functional Idea Pitchathon",
      "Peer-to-peer Kudos Recognition App"
    ],
    allergens: [
      "Dinding Silo Lintas Tim",
      "Stres Kerja & Burnout",
      "Merasa Tidak Diapresiasi (Invisible Employee)"
    ],
    chefNotes: {
      background: "Setelah fase kerja hibrida (WFA), kolaborasi antar departemen mulai merenggang. Karyawan merasa lelah, jarang berkomunikasi di luar urusan tugas, dan kehangatan tim perlahan memudar.",
      challenge: "Membangun kembali jembatan empati antar karyawan, mengedepankan keamanan psikologis, serta menyebarkan kebiasaan apresiasi positif secara konsisten.",
      recipe: [
        "Meluncurkan program 'Kudos' (Peer-to-peer Recognition), di mana rekan kerja dapat mengirimkan kartu ucapan terima kasih digital berisi poin apresiasi.",
        "Menginisiasi sesi bulanan 'Well-being Circles' yang memfasilitasi obrolan santai seputar kesehatan mental yang dibimbing psikolog profesional.",
        "Mengembangkan lokakarya 'Psychological Safety' bagi para leader untuk memastikan semua tim berani bersuara tanpa rasa takut.",
        "Mengadakan acara inovasi santai lintas divisi untuk memecahkan kebekuan birokrasi."
      ],
      results: [
        "Meningkatkan Employee Engagement Index nasional sebesar 25%.",
        "Menciptakan budaya saling mengapresiasi dengan lebih dari 1.200 'Kudos' terkirim dalam kuartal pertama.",
        "Mampu menurunkan keluhan kelelahan kerja (burnout) karyawan secara signifikan sebesar 30%."
      ],
      philosophy: "Risotto yang lezat membutuhkan kesabaran dalam mengaduk dan memadukan rasa secara perlahan. Keberagaman tim barulah menjadi kekuatan sejati ketika dibalut dengan rasa aman dan saling menghargai."
    }
  },
  {
    id: "truffle-pasta",
    name: "Reward & Benefits Truffle Pasta",
    category: "people-analytics",
    categoryLabel: "People Analytics",
    price: "Est. 2024",
    shortDescription: "Sajian premium yang memanjakan lidah. Skema kompensasi, tunjangan fleksibel, dan apresiasi yang adil, dirancang khusus untuk memastikan talenta terbaik merasa dihargai dengan layak.",
    image: "assets/images/truffle_pasta_1782396907782.jpg",
    prepTime: "3 Bulan Formulasi",
    satisfaction: "95% Market Competitiveness",
    impactMetric: "+15% Talent Attraction",
    ingredients: [
      "Salary Grading Restructuring",
      "Flexible Benefit Options (Flexi-Ben)",
      "Financial Wellness Seminar Series",
      "Total Rewards Statement Dashboard",
      "Local Merchant Partnerships"
    ],
    allergens: [
      "Ketidaksetaraan Upah (Salary Disparity)",
      "Satu Aturan untuk Semua (One-Size-Fits-All Tunjangan)",
      "Talenta Terbaik Pindah ke Pesaing (Brain Drain)"
    ],
    chefNotes: {
      background: "Paket tunjangan lama dinilai kaku karena mayoritas karyawan muda tidak memanfaatkan tunjangan keluarga tradisional, sementara karyawan senior menginginkan perlindungan kesehatan yang lebih ekstensif.",
      challenge: "Memformulasikan ulang struktur upah agar kompetitif di pasar global, sembari memperkenalkan sistem benefit fleksibel tanpa membengkakkan anggaran operasional HR.",
      recipe: [
        "Melakukan studi komparatif pasar kerja industri teknologi untuk merancang rentang gaji (salary grade) yang kompetitif dan adil.",
        "Mendirikan platform 'Flexi-Benefits' di mana setiap karyawan diberi poin tahunan untuk ditukarkan secara mandiri dengan opsi kesehatan, kebugaran, edukasi, atau hobi sesuai kebutuhan personal.",
        "Membuat slip ringkasan 'Total Rewards Statement' yang menunjukkan seluruh nilai tunjangan, bonus, dan gaji pokok karyawan secara transparan.",
        "Menandatangani kesepakatan diskon khusus dengan berbagai pusat olahraga, asuransi, dan edukasi lokal."
      ],
      results: [
        "Meningkatkan daya tarik posisi lowongan kerja baru hingga 15% di portal karir.",
        "Skor utilitas tunjangan meningkat dari yang semula 40% menjadi 92% setelah program Flexi-Ben diluncurkan.",
        "Mampu menekan angka perpindahan talenta unggulan (key-talent attrition) hingga di bawah 5% per tahun."
      ],
      philosophy: "Truffle adalah bahan pangan langka yang berharga tinggi. Memberikan kompensasi yang tepat kepada talenta andalan Anda adalah bentuk investasi terbaik untuk menjaga fondasi masa depan perusahaan."
    }
  },
  {
    id: "exit-souffle",
    name: "Golden Farewell Exit Soufflé",
    category: "employer-branding",
    categoryLabel: "Employer Branding",
    price: "Est. 2023",
    shortDescription: "Sajian penutup yang lembut dan manis. Mengelola proses transisi keluar karyawan dengan martabat tinggi, mengubah perpisahan kerja menjadi kemitraan alumni jangka panjang yang harmonis.",
    image: "assets/images/chocolate_souffle_1782396920992.jpg",
    prepTime: "1.5 Bulan Restrukturisasi",
    satisfaction: "97% Alumnus NPS",
    impactMetric: "85% Alumni Referral Rate",
    ingredients: [
      "Compassionate Exit Interview Protocol",
      "Digital Knowledge Transfer Template",
      "Company Alumni Network Hub",
      "Career Outplacement Support Desk",
      "Farewell Appreciation Ritual"
    ],
    allergens: [
      "Sakit Hati & Perselisihan Perpisahan (Bitter Exits)",
      "Hilangnya Dokumen Tugas (Knowledge Drain)",
      "Ulasan Buruk di Glassdoor / Media Sosial"
    ],
    chefNotes: {
      background: "Proses pengunduran diri sebelumnya terasa dingin, terburu-buru, dan kadang memicu ketegangan interpersonal yang merusak reputasi perusahaan (employer brand) di luar.",
      challenge: "Bagaimana merancang akhir masa kerja yang beradab, berterima kasih, mengamankan transfer pengetahuan, dan memastikan hubungan profesional tetap terjaga dengan baik?",
      recipe: [
        "Merancang kerangka interview keluar (Exit Interview) berbasis empati untuk memetakan kritik konstruktif jujur bagi internal perusahaan.",
        "Membuat sistem serah-terima tugas terstruktur (Knowledge Transfer Hub) agar tidak ada file atau informasi penting yang lenyap bersama kepergian karyawan.",
        "Mendirikan 'Alumni Network Portal' di media profesional untuk merayakan kesuksesan karir baru mereka dan menjaga relasi bisnis.",
        "Menyediakan bimbingan karir tambahan (outplacement) bagi karyawan yang terpaksa dirumahkan karena restrukturisasi organisasi."
      ],
      results: [
        "Meraih skor Net Promoter Score (NPS) alumni perusahaan sebesar +65 (sangat baik).",
        "Sebesar 85% rekrutmen karyawan baru di posisi senior sukses didapatkan lewat rujukan (referral) dari jaringan alumni.",
        "Meningkatkan rating reputasi reputasi pemberi kerja di kanal Glassdoor menjadi 4.6 / 5.0."
      ],
      philosophy: "Soufflé yang sempurna dinilai dari bagaimana ia mempertahankan keindahannya hingga suapan terakhir. Perpisahan yang manis adalah pembuka gerbang kolaborasi masa depan yang tak terbatas."
    }
  },
  {
    id: "feedback-elixir",
    name: "Refreshing 360° Feedback Elixir",
    category: "organizational-development",
    categoryLabel: "Organizational Development",
    price: "Daily Intake",
    shortDescription: "Minuman dingin penyegar pikiran. Sistem umpan balik 360 derajat yang jernih, transparan, dan menyehatkan, melancarkan sirkulasi komunikasi di seluruh lapisan organisasi tanpa sekat birokrasi.",
    image: "assets/images/feedback_elixir_1782396935346.jpg",
    prepTime: "2 Bulan Integrasi",
    satisfaction: "96% Psychological Safety",
    impactMetric: "90% Kecepatan Resolusi Konflik",
    ingredients: [
      "Anonymized Peer-to-Manager Assessment",
      "Radical Candor Communication Guide",
      "Quarterly Leadership Health Check",
      "Conflict Resolution Mediators Panel",
      "Interactive Town Hall Q&A Portal"
    ],
    allergens: [
      "Komunikasi Pasif-Agresif",
      "Ketakutan Memberi Masukan kepada Atasan",
      "Gossip Kantor yang Kurang Sehat"
    ],
    chefNotes: {
      background: "Tim cenderung memendam kritik dan masukan berharga karena takut disalahpahami atau dimusuhi, mengakibatkan miskomunikasi berulang dan menurunnya rasa saling percaya.",
      challenge: "Membentuk budaya komunikasi berlandaskan kejujuran radikal yang penuh rasa hormat (Radical Candor), di mana masukan bisa mengalir lancar dari bawah ke atas maupun sebaliknya.",
      recipe: [
        "Meluncurkan modul pelatihan 'Radical Candor: Care Personally, Challenge Directly' ke seluruh jajaran kepemimpinan.",
        "Membuat platform aman yang dianonimkan untuk evaluasi berkala kinerja manajer oleh anggota timnya (Upward Feedback).",
        "Menyelenggarakan sesi interaktif bulanan 'Unfiltered Town Hall', di mana direksi menjawab seluruh pertanyaan tersulit dari karyawan tanpa sensor.",
        "Melatih perwakilan mediator internal yang netral untuk membantu penyelesaian perselisihan kerja secara bijak."
      ],
      results: [
        "Sebanyak 96% karyawan menyatakan mereka merasa aman menyuarakan pendapat kreatif atau kritik di dalam tim.",
        "Meningkatkan kecepatan resolusi ketegangan antar-divisi hingga 90%.",
        "Menghapus kesenjangan birokrasi komunikasi manajer-staff, dibuktikan dengan tingginya partisipasi aktif di forum internal."
      ],
      philosophy: "Umpan balik laksana air mineral dingin di siang hari yang terik. Ia menjernihkan salah paham, menghapus dahaga ketidakpastian, dan menyegarkan kembali semangat kolaborasi."
    }
  }
];

const CHEF_PROFILE = {
  name: "Natasya Canva",
  title: "Chief Culture Chef / People & Culture Specialist",
  avatar: "assets/images/portfolio_chef_1782396952202.jpg",
  tagline: "Seorang People & Culture Specialist yang meramu strategi HR berbasis data menjadi budaya kerja yang hangat, inklusif, dan berkelanjutan.",
  experienceYears: "5+ Tahun Pengalaman",
  contactPhone: "+62 812 3456 7890",
  contactEmail: "natasya.canva@email.com",
  philosophy: "Budaya kerja bukanlah hiasan dinding atau tumpukan dokumen aturan. Budaya kerja adalah resep hidup yang diramu setiap hari melalui komunikasi, apresiasi, rasa aman, dan kepemimpinan yang berempati.",

  /* Section-based CV content. Setiap section punya "type" yang menentukan
     bagaimana ia dirender & diedit di admin:
       - "paragraph": teks panjang (mis. Summary)
       - "tags"     : daftar chip singkat (mis. Skills)
       - "timeline" : daftar entri dengan judul, sub-judul, periode, & poin (mis. Experience, Education)
     Section bisa ditambah, diganti nama, atau dihapus dari halaman admin;
     tampilan di halaman Profil otomatis menyesuaikan. */
  sections: [
    {
      id: "summary",
      title: "Summary",
      type: "paragraph",
      content: "Seorang profesional People & Culture yang bersemangat membantu perusahaan berkembang pesat dengan cara merawat dan meningkatkan kepuasan elemen terpenting mereka: Manusia. Memadukan teori psikologi modern, efisiensi operasional HRIS, dan sentuhan empati manusiawi untuk menciptakan lingkungan kerja yang inklusif, kolaboratif, dan sarat prestasi."
    },
    {
      id: "experience",
      title: "Professional Experience",
      type: "timeline",
      entries: [
        {
          heading: "Chief Culture Chef / People & Culture Specialist",
          subheading: "Freelance & Mitra Perusahaan",
          period: "2020 - Sekarang",
          description: "Membangun dan mengelola berbagai inisiatif People & Culture lintas perusahaan mitra, dari strategi rekrutmen hingga program penguatan budaya kerja jangka panjang.",
          bullets: [
            "Menggunakan analitik SDM (HR analytics) dan survei denyut nadi (pulse survey) untuk mengidentifikasi kebutuhan nyata sebelum merancang program.",
            "Merancang program apresiasi dan rewards yang membuat talenta merasa dihargai secara konsisten, bukan hanya secara simbolis.",
            "Menyederhanakan kerumitan birokrasi HR menjadi komunikasi yang transparan dan mudah dicerna seluruh karyawan.",
            "Membangun keamanan psikologis di tim agar karyawan berani berinovasi tanpa takut melakukan kesalahan dalam proses belajar."
          ]
        }
      ]
    },
    {
      id: "skills",
      title: "Skills",
      type: "tags",
      items: [
        "Employee Journey & Experience Mapping",
        "Tailored OKR & Balanced Scorecard Alignment",
        "Flexi-Benefits & Rewards Engineering",
        "Psychological Safety & Conflict Mediation",
        "Employer Branding & Culture Campaigning"
      ]
    },
    {
      id: "education",
      title: "Education",
      type: "timeline",
      entries: [
        {
          heading: "S1 Psikologi / Manajemen SDM",
          subheading: "Nama Universitas",
          period: "2015 - 2019",
          bullets: []
        }
      ]
    }
  ]
};

/**
 * Data Sertifikat / Certificate Archive
 * Menggantikan "Learning Archive" — daftar sertifikasi, pelatihan, dan
 * kredensial profesional. Setiap sertifikat butuh gambar/scan sertifikat
 * asli di folder assets/images/ (ganti path `image` di bawah dengan file
 * milikmu — rasio potret/A4 seperti 3:4 atau 4:3 landscape sama-sama oke,
 * kartu akan menyesuaikan otomatis).
 *
 * CERTIFICATE_DATA_VERSION: naikkan tiap kali daftar di bawah diubah manual,
 * supaya localStorage lama otomatis refresh (sama seperti PORTFOLIO_DATA_VERSION).
 */
const CERTIFICATE_DATA_VERSION = 1;

const CERTIFICATE_MENU = [
  {
    id: "cert-people-analytics",
    title: "People Analytics Professional",
    issuer: "HR Certification Institute (HRCI)",
    date: "Maret 2024",
    category: "People Analytics",
    credentialId: "HRCI-PA-2024-08213",
    credentialUrl: "",
    image: "assets/images/certificate_people_analytics.jpg"
  },
  {
    id: "cert-talent-acquisition",
    title: "Talent Acquisition Specialist",
    issuer: "Society for Human Resource Management (SHRM)",
    date: "November 2023",
    category: "Talent Acquisition",
    credentialId: "SHRM-TAS-2023-4471",
    credentialUrl: "",
    image: "assets/images/certificate_talent_acquisition.jpg"
  },
  {
    id: "cert-org-development",
    title: "Organizational Development Practitioner",
    issuer: "Indonesia Human Capital Institute",
    date: "Agustus 2023",
    category: "Organizational Development",
    credentialId: "IHCI-ODP-2023-1190",
    credentialUrl: "",
    image: "assets/images/certificate_org_development.jpg"
  },
  {
    id: "cert-employer-branding",
    title: "Employer Branding Strategy",
    issuer: "LinkedIn Learning",
    date: "Juni 2023",
    category: "Employer Branding",
    credentialId: "LIL-EBS-2023-99042",
    credentialUrl: "",
    image: "assets/images/certificate_employer_branding.jpg"
  }
];
