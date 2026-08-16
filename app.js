const { createApp, ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } = Vue;

const app = createApp({
  setup() {
    // --- STATE MANAGEMENT ---
    const activeTab = ref("home");
    const showWelcome = ref(true);
    const adminTab = ref("portfolio");
    const isContactMenuOpen = ref(false);
    const currentSlideIndex = ref(0);

    // SAFE ICON REFRESH — lucide.createIcons() jalan lewat nextTick di banyak
    // tempat (setelah upload foto, ganti tab admin, simpan form, dll). Kalau
    // dua pemanggilan itu tumpang-tindih (misal ganti tab admin sambil ada
    // update lain), lucide bisa mencoba insertBefore ke elemen <i> yang sudah
    // diganti/dihapus Vue lebih dulu, dan itu jadi "PROMISE REJECTION" yang
    // tidak tertangkap. refreshIcons() ini men-debounce ke satu pemanggilan
    // per tick dan membungkusnya dengan try/catch supaya kegagalan render
    // icon (kosmetik) tidak pernah lagi merusak/menghentikan halaman.
    let iconsRefreshQueued = false;
    const refreshIcons = () => {
      if (iconsRefreshQueued) return;
      iconsRefreshQueued = true;
      nextTick(() => {
        iconsRefreshQueued = false;
        try {
          if (window.lucide) window.lucide.createIcons();
        } catch (err) {
          console.warn("Lucide createIcons gagal, diabaikan (tidak fatal):", err);
        }
      });
    };
    const selectedCategory = ref("all");
    const selectedDateFilter = ref("all");
    const selectedExperienceFilter = ref("all");
    const searchQuery = ref("");
    const selectedDish = ref(null);

    // PERSISTENT STATES
    const portfolioMenu = ref([]);
    const chefProfileState = ref({});
    const mainPageContent = ref({});
    const guestbookEntries = ref([]);
    const certificateMenu = ref([]);
    const visitorCount = ref(0);
    const selectedCertificate = ref(null);
    
    // ADMIN STATES
    const isAdminLoggedIn = ref(false);
    const isLoginModalOpen = ref(false);
    const clickCount = ref(0);
    const clickTimeoutRef = ref(null);

    // ADMIN FORM STATES
    const getEmptyPortfolioForm = () => ({
      name: "", category: "people-culture", categoryLabel: "", price: "", prepTime: "", 
      satisfaction: "", impactMetric: "", images: [], shortDescription: "", 
      ingredients: [""], allergens: [""], experienceLink: "", pinned: false,
      chefNotes: { background: "", challenge: "", recipe: [{ text: "", points: [] }], results: [{ text: "", points: [] }], philosophy: "" }
    });
    const portfolioForm = ref(getEmptyPortfolioForm());
    const isAddingCard = ref(false);
    const editingCardId = ref(null);
    const portfolioImageUploading = ref(false);
    // Filter "Pengalaman" khusus di daftar admin (Kelola Portofolio) — beda
    // dari filter di halaman publik, supaya admin bisa cepat cek proyek mana
    // yang belum disinkronkan ke Professional Experience manapun.
    const adminExperienceFilter = ref("all");

    // Single source of truth for the admin sidebar/dropdown nav — shared by
    // both the desktop button list and the mobile dropdown selector, so
    // adding/renaming a section only needs to happen in one place.
    const adminTabs = computed(() => [
      { id: "chef", icon: "id-card", title: "Profil Saya", subtitle: "Identitas diri" },
      { id: "homepage", icon: "layout-template", title: "Halaman Utama", subtitle: "Copywriting beranda" },
      { id: "background", icon: "sparkles", title: "Highlight Background", subtitle: "Foto & deskripsi halaman Background" },
      { id: "portfolio", icon: "layers", title: "Kelola Portofolio", subtitle: "Daftar proyek" },
      { id: "certificate", icon: "badge-check", title: `Kelola Sertifikat (${certificateMenu.value.length})`, subtitle: "Kredensial & sertifikasi" },
      { id: "guestbook", icon: "users", title: `Buku Tamu (${guestbookEntries.value.length})`, subtitle: "Moderation logs" }
    ]);
    // The single active tab's meta — drives the icon shown on the mobile
    // dropdown trigger (the <select> itself can't render an icon).
    const activeAdminTab = computed(() => adminTabs.value.find(t => t.id === adminTab.value) || adminTabs.value[0]);

    // CERTIFICATE ADMIN FORM STATES
    const getEmptyCertificateForm = () => ({
      title: "", issuer: "", date: "", category: "", credentialId: "", credentialUrl: "", supportingLinkLabel: "", supportingLinkUrl: "", image: ""
    });
    const certificateForm = ref(getEmptyCertificateForm());
    const isAddingCertificate = ref(false);
    const editingCertificateId = ref(null);
    const certificateImageUploading = ref(false);

    // Init forms with empty objects first — will be populated in onMounted
    const chefForm = ref({});
    const homepageForm = ref({});
    const homepagePhotoUploading = ref(false);
    const chefAvatarUploading = ref(false);
    const chefHeaderBgUploading = ref(false);

    // BACKGROUND PAGE — HIGHLIGHT PORTOFOLIO MENU (foto + 3 section deskripsi
    // gaya "WHY / HOW / WHAT", admin-editable per section)
    const makeEmptyHighlightSections = () => ([
      { label: "WHY", title: "THE PURPOSE", body: "" },
      { label: "HOW", title: "THE METHOD", body: "" },
      { label: "WHAT", title: "THE DELIVERABLES", body: "" }
    ]);
    const backgroundHighlight = ref({ image: "", sections: makeEmptyHighlightSections() });
    const backgroundHighlightForm = ref({ image: "", sections: makeEmptyHighlightSections() });
    const backgroundHighlightImageUploading = ref(false);

    // ---- SHARED IMAGE CROP MODAL (dipakai semua upload foto: avatar, header bg, portfolio, sertifikat, beranda) ----
    const cropModalOpen = ref(false);
    const cropImageUrl = ref("");
    const cropZoomValue = ref(0);
    const cropTarget = ref(null); // { assign, folder, uploadingRef, aspect, inputEl }
    let cropperInstance = null;

    const openCropModal = (file, { assign, folder, uploadingRef, aspect }, inputEl) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("File harus berupa gambar (JPG/PNG/dll).");
        if (inputEl) inputEl.value = "";
        return;
      }
      cropImageUrl.value = URL.createObjectURL(file);
      cropTarget.value = { assign, folder, uploadingRef, aspect, inputEl };
      cropZoomValue.value = 0;
      cropModalOpen.value = true;
      nextTick(() => {
        const imgEl = document.getElementById("cropperImage");
        if (!imgEl || !window.Cropper) return;
        if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
        const initCropper = () => {
          // cropModalOpen bisa saja sudah ditutup lagi sebelum gambar selesai load
          // (klik cepat / batal) — jangan inisialisasi cropper ke elemen yang sudah tidak relevan.
          if (!cropModalOpen.value) return;
          try {
            cropperInstance = new window.Cropper(imgEl, {
              aspectRatio: aspect || NaN,
              viewMode: 1,
              dragMode: "move",
              autoCropArea: 1,
              background: false,
              responsive: true,
              zoomOnWheel: true,
            });
          } catch (err) {
            console.error("Gagal inisialisasi cropper:", err);
          }
        };
        // Cropper.js butuh dimensi gambar asli (naturalWidth/Height) untuk setup
        // internalnya dengan benar. Kalau blob URL belum selesai di-decode browser,
        // insertBefore/wrapper Cropper bisa error karena elemen belum siap.
        if (imgEl.complete && imgEl.naturalWidth > 0) {
          initCropper();
        } else {
          imgEl.onload = initCropper;
          imgEl.onerror = () => console.error("Gagal memuat gambar untuk di-crop.");
        }
      });
    };

    const closeCropModal = () => {
      cropModalOpen.value = false;
      if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
      const imgEl = document.getElementById("cropperImage");
      if (imgEl) { imgEl.onload = null; imgEl.onerror = null; }
      if (cropImageUrl.value) URL.revokeObjectURL(cropImageUrl.value);
      cropImageUrl.value = "";
      if (cropTarget.value && cropTarget.value.inputEl) cropTarget.value.inputEl.value = "";
      cropTarget.value = null;
    };

    const setCropZoom = () => {
      if (cropperInstance) cropperInstance.zoomTo(1 + Number(cropZoomValue.value));
    };
    const cropZoomStep = (delta) => {
      cropZoomValue.value = Math.max(0, Math.min(3, Number(cropZoomValue.value) + delta));
      setCropZoom();
    };

    const confirmCrop = () => {
      if (!cropperInstance || !cropTarget.value) return;
      const { assign, folder, uploadingRef } = cropTarget.value;
      const canvas = cropperInstance.getCroppedCanvas({ maxWidth: 1600, maxHeight: 1600, imageSmoothingQuality: "high" });
      if (!canvas) return;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (uploadingRef) uploadingRef.value = true;
        closeCropModal();
        try {
          const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: "image/jpeg" });
          const url = await window.db.uploadImage(file, folder);
          assign(url);
        } catch (err) {
          alert("Gagal upload gambar. Cek koneksi internet kamu.");
        } finally {
          if (uploadingRef) uploadingRef.value = false;
        }
      }, "image/jpeg", 0.92);
    };


    // FORM STATES
    const formName = ref("");
    const formRole = ref("");
    const formMessage = ref("");
    const formStars = ref(5);
    const formDishLiked = ref("");
    const guestbookSuccess = ref(false);

    const dataLoading = ref(true);
    const dataLoadError = ref("");

    // Initialize Data — semua konten sekarang datang dari Supabase.
    // Kalau baris belum ada di Supabase (pertama kali), otomatis di-seed
    // dari default di data.js supaya Supabase langsung jadi sumber data.
    onMounted(async () => {
      try {
        const defaultMainPage = {
          name: "Nadya Nanda Adisty Hadian",
          title: "My \u2018Hidden Gem\u2019 Portofolio",
          photoUrl: "",
          slogan: "Fertilizer' my career path | bridging people, culture & branding",
          body: "A people operations facilitator obsessed with elegant administration and clean designs. I believe that workspace compliance doesn't have to look boring, and employee branding is best served with true transparency. Let's delve into my cozy archive of insights.",
          linkedinUrl: "https://linkedin.com",
          mobileQuote: "Kami memformulasikan budaya organisasi terstruktur dengan bumbu empati, menyajikan kepuasan talenta yang matang untuk pertumbuhan bisnis.",
          drawerDesc: "People Operations Specialist obsessed with elegant administration and clean organizational designs.",
          welcomeQuote: "\ud83c\udf31 Hi, I am Nadya. Every project here started as a small seed\u2014\nwatered through daily hands-on practice, fertilized by \npurposeful learning and reflection, and cultivated to \ndeliver meaningful impact.",
          welcomeCta: "[ Step inside the garden of growth \u2192 ]",
          alertMessage: ""
        };

        const defaultBackgroundHighlight = {
          image: "",
          sections: [
            {
              label: "WHY",
              title: "THE PURPOSE",
              body: "I believe structured systems and warm workplace cultures should never be mutually exclusive. I work to nourish environments where people and organization grow together."
            },
            {
              label: "HOW",
              title: "THE METHOD",
              body: "Applying engineering logic & data-driven insights to human-centered processes. I bridge people, culture, and branding through clean administration and clear workflows."
            },
            {
              label: "WHAT",
              title: "THE DELIVERABLES",
              body: "Optimized onboarding journeys, structured HRIS databases, vibrant internal culture events, and strategic employer branding materials."
            }
          ]
        };

        const [menuRes, certRes, chefRes, mainRes, bgHighlightRes, guestbook, session] = await Promise.all([
          window.db.getContent("portfolio_menu", PORTFOLIO_MENU),
          window.db.getContent("certificate_menu", typeof CERTIFICATE_MENU !== "undefined" ? CERTIFICATE_MENU : []),
          window.db.getContent("chef_profile", CHEF_PROFILE),
          window.db.getContent("main_page_content", defaultMainPage),
          window.db.getContent("background_highlight", defaultBackgroundHighlight),
          window.db.getGuestbook(),
          window.db.getSession()
        ]);

        portfolioMenu.value = normalizePortfolioMenu(menuRes.value);
        certificateMenu.value = certRes.value;
        chefProfileState.value = chefRes.value;
        chefForm.value = JSON.parse(JSON.stringify(chefProfileState.value));
        // Normalisasi data lama: kalau di Supabase belum ada field welcomeQuote/welcomeCta
        // (baru ditambahkan), pakai default dari defaultMainPage supaya tidak kosong.
        mainPageContent.value = {
          ...defaultMainPage,
          ...mainRes.value,
          welcomeQuote: (mainRes.value && mainRes.value.welcomeQuote) || defaultMainPage.welcomeQuote,
          welcomeCta: (mainRes.value && mainRes.value.welcomeCta) || defaultMainPage.welcomeCta,
          alertMessage: (mainRes.value && mainRes.value.alertMessage) || ""
        };
        homepageForm.value = JSON.parse(JSON.stringify(mainPageContent.value));
        // Normalisasi data lama: kalau di Supabase masih tersimpan format lama
        // ({ image, description }) atau sections belum lengkap, konversi dulu
        // ke format 3 section (WHY/HOW/WHAT) supaya tidak error di template.
        const rawBgHighlight = bgHighlightRes.value || {};
        const normalizedSections = makeEmptyHighlightSections().map((defaultSection, idx) => {
          const existing = Array.isArray(rawBgHighlight.sections) ? rawBgHighlight.sections[idx] : null;
          if (existing) return { ...defaultSection, ...existing };
          if (idx === 0 && !rawBgHighlight.sections && rawBgHighlight.description) {
            return { ...defaultSection, body: rawBgHighlight.description };
          }
          return defaultSection;
        });
        backgroundHighlight.value = { image: rawBgHighlight.image || "", sections: normalizedSections };
        backgroundHighlightForm.value = JSON.parse(JSON.stringify(backgroundHighlight.value));
        guestbookEntries.value = guestbook;

        isAdminLoggedIn.value = !!session;

        // Apply whatever page/popup is encoded in the URL hash now that
        // portfolioMenu/certificateMenu are loaded (needed to resolve item
        // ids into actual dish/certificate objects). If the link points
        // somewhere other than the plain homepage, skip the welcome splash
        // too — someone opening a shared link wants the content, not a
        // click-to-dismiss intro screen first.
        const initialRoute = parseHash();
        if (initialRoute.tab !== "home" || initialRoute.itemId) {
          showWelcome.value = false;
        }
        applyRouteFromHash();

        if (portfolioMenu.value.length > 0) {
          formDishLiked.value = portfolioMenu.value[0].name;
        }
      } catch (err) {
        console.error("Gagal memuat data dari Supabase:", err);
        dataLoadError.value = "Gagal memuat data dari Supabase. Cek koneksi internet & konfigurasi di supabase-config.js.";
      } finally {
        dataLoading.value = false;
        refreshIcons();
        // VISITOR COUNTER — dihitung 1x per pengunjung per hari (bukan tiap
        // refresh), pakai tanggal terakhir mampir yang disimpan di
        // localStorage browser pengunjung itu sendiri. Kalau tanggalnya beda
        // dari hari ini (atau belum pernah mampir sama sekali), counter di
        // Supabase ditambah 1 dan tanggalnya diperbarui. Dijalankan terpisah
        // (tidak ikut Promise.all di atas & tidak melempar error ke
        // dataLoadError) supaya kalau ada masalah di sini, halaman utama
        // tetap tampil normal — statistik pengunjung bukan konten inti.
        trackVisitor();
      }
    });

    // Reuses the same generic key-value content store as everything else
    // (window.db.getContent/saveContent — see the main data load above),
    // so it needs zero changes to supabase-client.js or the database schema.
    // Storage key: "visitor_stats" -> { count: number }.
    const VISITOR_LOCALSTORAGE_KEY = "nadyanah_portofolio_last_visit_date";
    const trackVisitor = async () => {
      try {
        const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        const lastVisit = localStorage.getItem(VISITOR_LOCALSTORAGE_KEY);

        const statsRes = await window.db.getContent("visitor_stats", { count: 0 });
        const currentCount = (statsRes && statsRes.value && typeof statsRes.value.count === "number")
          ? statsRes.value.count
          : 0;

        if (lastVisit === todayStr) {
          // Sudah dihitung hari ini di browser ini, cukup tampilkan angkanya.
          visitorCount.value = currentCount;
          return;
        }

        const newCount = currentCount + 1;
        await window.db.saveContent("visitor_stats", { count: newCount });
        localStorage.setItem(VISITOR_LOCALSTORAGE_KEY, todayStr);
        visitorCount.value = newCount;
      } catch (err) {
        // Statistik pengunjung bukan fitur inti — kalau gagal (mis. offline),
        // diamkan saja dan jangan ganggu tampilan halaman utama.
        console.warn("Gagal melacak/memuat jumlah pengunjung:", err);
      }
    };

    // HANDLERS

    // Turns a project title into a URL-friendly slug, e.g. "Employer
    // Branding: Q3 Campaign!" -> "employer-branding-q3-campaign". Falls back
    // to "porto" if the title is empty or has no usable characters (emoji-only,
    // symbols-only, etc), so we never end up with a blank/invalid id.
    const slugify = (str) => (str || "")
      .toString()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents (é -> e)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Builds a slug id from the title and makes sure it's unique among the
    // OTHER items in the given list (so two items named the same don't
    // collide) — appends -2, -3, etc. when needed. excludeId is the item's
    // own current id, so editing a title back to what it already was
    // doesn't falsely "collide with itself".
    const makeUniqueSlugId = (title, list, excludeId) => {
      const base = slugify(title) || "item";
      let candidate = base;
      let n = 2;
      while (list.some(item => item.id === candidate && item.id !== excludeId)) {
        candidate = `${base}-${n}`;
        n++;
      }
      return candidate;
    };

    // Normalizes a portfolio item's photos into a consistent
    // [{ url, caption }, ...] shape, regardless of which "generation" of
    // data it came from:
    //  1) newest: images: [{ url, caption }, ...]
    //  2) multi-photo (no captions yet): images: ["url1", "url2", ...]
    //  3) oldest (single-photo): image: "url" only
    // Used both when opening a project in the admin form and when reading
    // selectedDishImages for the public popup, so every project — however
    // old — always renders correctly.
    const normalizeImages = (item) => {
      if (!item) return [];
      if (Array.isArray(item.images) && item.images.length) {
        return item.images.map(img => typeof img === "string"
          ? { url: img, caption: "" }
          : { url: img.url, caption: img.caption || "" });
      }
      return item.image ? [{ url: item.image, caption: "" }] : [];
    };

    // Normalizes a "Solution" (recipe) or "Impact" (results) list into the
    // { text, points } shape, regardless of which "generation" it came from:
    //  1) newest: [{ text: "...", points: ["...", ...] }, ...]
    //  2) oldest: ["...", "...", ...] (plain strings, no sub-points support)
    // Used on load and whenever a card is opened in the admin form, so old
    // projects (and the bundled data.js defaults) keep working unchanged
    // while gaining the option to add sub-points.
    const normalizeStepList = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return [{ text: "", points: [] }];
      return arr.map(item => typeof item === "string"
        ? { text: item, points: [] }
        : { text: (item && item.text) || "", points: (item && Array.isArray(item.points)) ? item.points : [] });
    };

    // Applies normalizeStepList to every project's Solution/Impact lists —
    // called right after portfolioMenu is loaded (and after a reset), so
    // selectedDish in the public popup always reads the current shape too.
    const normalizePortfolioMenu = (list) => {
      if (!Array.isArray(list)) return [];
      return list.map(item => ({
        ...item,
        chefNotes: {
          ...item.chefNotes,
          recipe: normalizeStepList(item.chefNotes && item.chefNotes.recipe),
          results: normalizeStepList(item.chefNotes && item.chefNotes.results)
        }
      }));
    };

    // Formats the project's "Tanggal Pelaksanaan" — stored as "YYYY-MM" from
    // the <input type="month"> picker — into a readable "Jan 2026" label.
    // Falls back to showing the raw value as-is for older projects saved
    // before this field became a date picker (back when it was free text
    // like "Est. 2026" or "Scale 100+ Staff"), so old cards don't break.
    const formatProjectDate = (value) => {
      if (!value) return "";
      const match = /^(\d{4})-(\d{2})$/.exec(value);
      if (!match) return value;
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const monthLabel = months[parseInt(match[2], 10) - 1] || match[2];
      return `${monthLabel} ${match[1]}`;
    };

    // Lets the admin bold parts of a plain-text field by wrapping words in
    // **double asterisks** (same convention as Markdown/WhatsApp), without
    // needing a full rich-text editor. Escapes the raw text first so any
    // stray HTML the admin types can't inject markup, then turns the
    // **...** pairs into <strong>. Used with v-html on the rendered side;
    // the textarea itself stays a plain field, admin just types ** around
    // the words they want bold.
    // Also normalizes 3+ blank lines down to exactly one blank line, so
    // paragraph gaps look consistent no matter how many extra Enters the
    // admin happened to leave between paragraphs.
    // Strips HTML tags for compact single-line previews (e.g. the admin
    // portfolio list row) where fields edited via <rich-text-editor> could
    // otherwise contain block-level tags (like <li>) that don't play nicely
    // with a single-line `truncate` layout.
    const stripTags = (html) => (html || "").replace(/<[^>]*>/g, "");

    const renderBoldText = (text) => {
      if (!text) return "";
      const escaped = text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
      const normalized = escaped.replace(/\n{3,}/g, "\n\n");
      return normalized.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    };


    // PORTFOLIO ADMIN HANDLERS
    const startEditCard = (card) => {
      portfolioForm.value = JSON.parse(JSON.stringify(card));
      // Always (re)build from normalizeImages — handles old cards (single
      // `image` string, or an `images` array of plain strings from before
      // captions existed) as well as the current { url, caption } shape.
      portfolioForm.value.images = normalizeImages(card);
      // Same idea for Solution/Impact — handles old cards where each step
      // was a plain string, upgrading them to { text, points } on the fly.
      portfolioForm.value.chefNotes.recipe = normalizeStepList(card.chefNotes && card.chefNotes.recipe);
      portfolioForm.value.chefNotes.results = normalizeStepList(card.chefNotes && card.chefNotes.results);
      editingCardId.value = card.id;
      isAddingCard.value = true;
      portfolioImagesCollapsed.value = true;
    };
    
    const savePortfolioCard = async (e) => {
      if(e) e.preventDefault();
      if (!portfolioForm.value.images || portfolioForm.value.images.length === 0) {
        alert("Upload minimal 1 gambar proyek dulu ya.");
        return;
      }
      // shortDescription is now a rich-text (contenteditable) field, so it
      // no longer has the browser's native `required` validation — check
      // manually, stripping tags first so "<b></b>" (bold applied to
      // nothing) doesn't count as filled in.
      const taglineText = (portfolioForm.value.shortDescription || "").replace(/<[^>]*>/g, "").trim();
      if (!taglineText) {
        alert("Deskripsi Singkat / Tagline Proyek wajib diisi ya.");
        return;
      }
      // id is re-derived from the title every save — so renaming a project
      // also updates its shareable link (#/menu/<id>). NOTE: this means a
      // link copied before a rename will stop working after the rename;
      // that's the intended trade-off of having readable, title-based links.
      // `image` is kept in sync as the cover photo's url so every other place
      // that still reads the old single-image field (grid thumbnails, home
      // highlight slider, admin card list) keeps working unchanged.
      const submission = { ...portfolioForm.value, image: portfolioForm.value.images[0].url, id: makeUniqueSlugId(portfolioForm.value.name, portfolioMenu.value, editingCardId.value) };
      if (editingCardId.value) {
        const idx = portfolioMenu.value.findIndex(item => item.id === editingCardId.value);
        if (idx !== -1) portfolioMenu.value[idx] = submission;
      } else {
        portfolioMenu.value.push(submission);
      }
      try {
        await window.db.saveContent("portfolio_menu", portfolioMenu.value);
      } catch (err) {
        alert("Gagal menyimpan ke Supabase. Cek koneksi internet kamu.");
        return;
      }
      cancelPortfolioForm();
      refreshIcons();
    };
    
    const deletePortfolioCard = async (id) => {
      if (window.confirm(`Hapus sajian ini?`)) {
        const prev = portfolioMenu.value;
        portfolioMenu.value = portfolioMenu.value.filter(item => item.id !== id);
        try {
          await window.db.saveContent("portfolio_menu", portfolioMenu.value);
        } catch (err) {
          portfolioMenu.value = prev;
          alert("Gagal menghapus di Supabase. Cek koneksi internet kamu.");
        }
      }
    };

    // Toggle pin langsung dari daftar admin (tanpa perlu buka form edit).
    // Proyek yang di-pin selalu naik ke atas di halaman Portofolio — tapi
    // hanya ketika belum ada filter kategori/tanggal/pengalaman/pencarian
    // yang aktif (lihat isAnyFilterActive di filteredMenu).
    const togglePortfolioPin = async (item) => {
      const prevValue = item.pinned;
      item.pinned = !item.pinned;
      try {
        await window.db.saveContent("portfolio_menu", portfolioMenu.value);
      } catch (err) {
        item.pinned = prevValue;
        alert("Gagal menyimpan status pin ke Supabase. Cek koneksi internet kamu.");
      }
    };
    
    const cancelPortfolioForm = () => {
      portfolioForm.value = getEmptyPortfolioForm();
      editingCardId.value = null;
      isAddingCard.value = false;
      portfolioImagesCollapsed.value = false;
    };

    // Appends each newly uploaded/cropped photo to the project's photo list
    // (rather than replacing a single image), so a project can carry several
    // photos. The file input has no `multiple` attribute on purpose — each
    // photo still goes through the crop modal one at a time, then the admin
    // can click "Tambah Foto" again for the next one.
    const handlePortfolioImageUpload = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      openCropModal(file, { assign: (url) => { portfolioForm.value.images.push({ url, caption: "" }); refreshIcons(); }, folder: "portfolio", uploadingRef: portfolioImageUploading, aspect: 4 / 3 }, e.target);
    };
    const handlePortfolioImageRemove = (idx) => {
      portfolioForm.value.images.splice(idx, 1);
    };
    // Moves a photo to the front of the list — the first photo is always the
    // "cover" shown in grids/cards and as the popup's first photo.
    const setPortfolioCoverImage = (idx) => {
      if (idx <= 0 || idx >= portfolioForm.value.images.length) return;
      const [img] = portfolioForm.value.images.splice(idx, 1);
      portfolioForm.value.images.unshift(img);
      refreshIcons(); // the "jadikan sampul" star button re-mounts on whichever thumbnail is no longer first
    };

    // Drag-and-drop reordering for the project photo grid — grab any
    // thumbnail and drop it on another to move it there. Dropping on slot 0
    // also makes that photo the new cover, same as the star button.
    const draggedImageIndex = ref(null);
    const dragOverImageIndex = ref(null);
    const handlePortfolioImageDragStart = (idx) => {
      draggedImageIndex.value = idx;
    };
    const handlePortfolioImageDragOver = (idx) => {
      dragOverImageIndex.value = idx;
    };
    const handlePortfolioImageDrop = (idx) => {
      const from = draggedImageIndex.value;
      draggedImageIndex.value = null;
      dragOverImageIndex.value = null;
      if (from === null || from === idx) return;
      const imgs = portfolioForm.value.images;
      const [moved] = imgs.splice(from, 1);
      imgs.splice(idx, 0, moved);
      refreshIcons(); // cover badge/star re-mount when slot 0 changes hands
    };
    const handlePortfolioImageDragEnd = () => {
      draggedImageIndex.value = null;
      dragOverImageIndex.value = null;
    };

    // Full-size "lihat foto" preview — reused for any project-photo thumbnail.
    const previewImageUrl = ref(null);

    // Collapses the project-photo gallery in the edit form so a project with
    // many photos doesn't push the rest of the form (Solusi, Dampak, dll)
    // far down the page. Defaults open for a brand-new project (nothing to
    // hide yet) and collapsed when opening an existing project for editing.
    const portfolioImagesCollapsed = ref(false);

    const handleAddField = (field, subfield = null) => {
      // recipe/results steps carry sub-points, so they're { text, points }
      // objects; every other dynamic list (ingredients, allergens) is still
      // a plain string.
      if (subfield) portfolioForm.value.chefNotes[subfield].push({ text: "", points: [] });
      else portfolioForm.value[field].push("");
    };

    const handleRemoveField = (field, idx, subfield = null) => {
      if (subfield) portfolioForm.value.chefNotes[subfield].splice(idx, 1);
      else portfolioForm.value[field].splice(idx, 1);
    };

    const handleFieldChange = (field, idx, val, subfield = null) => {
      if (subfield) portfolioForm.value.chefNotes[subfield][idx] = val;
      else portfolioForm.value[field][idx] = val;
    };

    // Sub-points nested under a single Solution/Impact step — e.g. extra
    // details, examples, or breakdowns that belong to that one step.
    const handleAddPoint = (subfield, stepIdx) => {
      portfolioForm.value.chefNotes[subfield][stepIdx].points.push("");
    };

    const handleRemovePoint = (subfield, stepIdx, pointIdx) => {
      portfolioForm.value.chefNotes[subfield][stepIdx].points.splice(pointIdx, 1);
    };

    // CERTIFICATE ADMIN HANDLERS
    const startEditCertificate = (cert) => {
      certificateForm.value = JSON.parse(JSON.stringify(cert));
      editingCertificateId.value = cert.id;
      isAddingCertificate.value = true;
    };

    const saveCertificate = async (e) => {
      if (e) e.preventDefault();
      // id re-derived from the title every save — see savePortfolioCard
      // above for why (readable, title-based links; renaming breaks
      // previously-shared links to the old id, by design).
      const submission = { ...certificateForm.value, id: makeUniqueSlugId(certificateForm.value.title, certificateMenu.value, editingCertificateId.value) };
      if (editingCertificateId.value) {
        const idx = certificateMenu.value.findIndex(item => item.id === editingCertificateId.value);
        if (idx !== -1) certificateMenu.value[idx] = submission;
      } else {
        certificateMenu.value.push(submission);
      }
      try {
        await window.db.saveContent("certificate_menu", certificateMenu.value);
      } catch (err) {
        alert("Gagal menyimpan ke Supabase. Cek koneksi internet kamu.");
        return;
      }
      cancelCertificateForm();
      refreshIcons();
    };

    const deleteCertificate = async (id) => {
      if (window.confirm(`Hapus sertifikat ini?`)) {
        const prev = certificateMenu.value;
        certificateMenu.value = certificateMenu.value.filter(item => item.id !== id);
        try {
          await window.db.saveContent("certificate_menu", certificateMenu.value);
        } catch (err) {
          certificateMenu.value = prev;
          alert("Gagal menghapus di Supabase. Cek koneksi internet kamu.");
        }
      }
    };

    const cancelCertificateForm = () => {
      certificateForm.value = getEmptyCertificateForm();
      editingCertificateId.value = null;
      isAddingCertificate.value = false;
    };

    const handleCertificateImageUpload = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      openCropModal(file, { assign: (url) => certificateForm.value.image = url, folder: "certificates", uploadingRef: certificateImageUploading, aspect: 4 / 3 }, e.target);
    };
    const handleCertificateImageRemove = () => {
      certificateForm.value.image = "";
    };

    // CHEF ADMIN HANDLERS
    const handleChefFormSubmit = async (e) => {
      if(e) e.preventDefault();
      const next = JSON.parse(JSON.stringify(chefForm.value));
      // Normalisasi email: hapus spasi di awal/akhir dan prefix "mailto:" kalau
      // tidak sengaja ikut ke-ketik, supaya link mailto di tombol Email selalu
      // benar mengarah ke alamat yang diisi admin.
      if (next.contactEmail) {
        next.contactEmail = next.contactEmail.trim().replace(/^mailto:/i, "");
      }
      try {
        await window.db.saveContent("chef_profile", next);
      } catch (err) {
        alert("Gagal menyimpan ke Supabase. Cek koneksi internet kamu.");
        return;
      }
      chefProfileState.value = next;
      chefForm.value.contactEmail = next.contactEmail;
      alert("Profil Chef disimpan!");
    };
    const handleChefAvatarUpload = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      openCropModal(file, { assign: (url) => chefForm.value.avatar = url, folder: "chef", uploadingRef: chefAvatarUploading, aspect: 3 / 4 }, e.target);
    };
    const handleChefAvatarRemove = () => {
      chefForm.value.avatar = "";
    };
    const handleChefHeaderBgUpload = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      openCropModal(file, { assign: (url) => chefForm.value.headerBackground = url, folder: "chef", uploadingRef: chefHeaderBgUploading, aspect: 2.6 }, e.target);
    };
    const handleChefHeaderBgRemove = () => {
      chefForm.value.headerBackground = "";
    };
    const handleChefArrayAddField = (field) => {
      if (!Array.isArray(chefForm.value[field])) chefForm.value[field] = [];
      chefForm.value[field].push("");
    };
    const handleChefArrayRemoveField = (field, idx) => chefForm.value[field].splice(idx, 1);
    const handleChefArrayChange = (field, idx, val) => chefForm.value[field][idx] = val;

    // --- DYNAMIC CV SECTIONS (Summary, Professional Experience, Skills, Education, dst) ---
    // Setiap section punya "type": 'paragraph' | 'tags' | 'timeline'
    const sectionIcon = (type) => {
      if (type === "tags") return "sparkles";
      if (type === "timeline") return "bookmark-check";
      return "file-text";
    };
    const getEmptySection = (type) => {
      const base = { id: "section-" + Date.now() + "-" + Math.floor(Math.random() * 1000), title: "", type };
      if (type === "paragraph") return { ...base, content: "" };
      if (type === "tags") return { ...base, items: [""] };
      if (type === "timeline") return { ...base, entries: [{ heading: "", subheading: "", period: "", bullets: [""], showOnHome: true }] };
      return base;
    };
    const handleSectionAdd = (type) => {
      if (!Array.isArray(chefForm.value.sections)) chefForm.value.sections = [];
      chefForm.value.sections.push(getEmptySection(type));
    };
    const handleSectionRemove = (idx) => {
      if (window.confirm("Hapus section ini beserta seluruh isinya?")) chefForm.value.sections.splice(idx, 1);
    };
    const handleSectionMove = (idx, direction) => {
      const list = chefForm.value.sections;
      const target = idx + direction;
      if (target < 0 || target >= list.length) return;
      [list[idx], list[target]] = [list[target], list[idx]];
    };

    // "tags" type section helpers
    const handleSectionTagAdd = (sectionIdx) => chefForm.value.sections[sectionIdx].items.push("");
    const handleSectionTagRemove = (sectionIdx, tagIdx) => chefForm.value.sections[sectionIdx].items.splice(tagIdx, 1);

    // "timeline" type section helpers
    const handleSectionEntryAdd = (sectionIdx) => {
      chefForm.value.sections[sectionIdx].entries.push({ heading: "", subheading: "", period: "", description: "", bullets: [""], showOnHome: true });
    };
    const handleSectionEntryRemove = (sectionIdx, entryIdx) => chefForm.value.sections[sectionIdx].entries.splice(entryIdx, 1);
    const handleSectionEntryBulletAdd = (sectionIdx, entryIdx) => chefForm.value.sections[sectionIdx].entries[entryIdx].bullets.push("");
    const handleSectionEntryBulletRemove = (sectionIdx, entryIdx, bulletIdx) => chefForm.value.sections[sectionIdx].entries[entryIdx].bullets.splice(bulletIdx, 1);

    // HOMEPAGE ADMIN HANDLERS
    const handleHomepagePhotoUpload = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      openCropModal(file, { assign: (url) => homepageForm.value.photoUrl = url, folder: "homepage", uploadingRef: homepagePhotoUploading, aspect: 1 }, e.target);
    };
    const handleHomepagePhotoRemove = () => {
      homepageForm.value.photoUrl = "";
    };
    const handleHomepageSubmit = async (e) => {
      if(e) e.preventDefault();
      // slogan/body/welcomeQuote are rich-text (contenteditable) fields now,
      // so they lost the browser's native `required` validation — check
      // manually, stripping tags first so e.g. "<b></b>" doesn't count as filled in.
      const requiredRichFields = [
        ["slogan", "Kalimat Slogan Utama (Headline)"],
        ["body", "Paragraf Deskripsi Beranda"],
        ["welcomeQuote", "Kalimat Layar Sambutan (Welcome Screen)"]
      ];
      for (const [key, label] of requiredRichFields) {
        const plain = (homepageForm.value[key] || "").replace(/<[^>]*>/g, "").trim();
        if (!plain) {
          alert(`${label} wajib diisi ya.`);
          return;
        }
      }
      const next = JSON.parse(JSON.stringify(homepageForm.value));
      try {
        await window.db.saveContent("main_page_content", next);
      } catch (err) {
        alert("Gagal menyimpan ke Supabase. Cek koneksi internet kamu.");
        return;
      }
      mainPageContent.value = next;
      alert("Konten Beranda disimpan!");
    };

    // BACKGROUND HIGHLIGHT ADMIN HANDLERS (foto + 1 deskripsi di kartu HIGHLIGHT halaman Background)
    const handleBackgroundHighlightPhotoUpload = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      openCropModal(file, { assign: (url) => backgroundHighlightForm.value.image = url, folder: "background-highlight", uploadingRef: backgroundHighlightImageUploading, aspect: 4 / 5 }, e.target);
    };
    const handleBackgroundHighlightPhotoRemove = () => {
      backgroundHighlightForm.value.image = "";
    };
    const handleBackgroundHighlightSubmit = async (e) => {
      if(e) e.preventDefault();
      const next = JSON.parse(JSON.stringify(backgroundHighlightForm.value));
      try {
        await window.db.saveContent("background_highlight", next);
      } catch (err) {
        alert("Gagal menyimpan ke Supabase. Cek koneksi internet kamu.");
        return;
      }
      backgroundHighlight.value = next;
      alert("Highlight halaman Background disimpan!");
    };

    const handleResetToDefaults = async () => {
      if (window.confirm("Apakah Anda yakin ingin mengembalikan semua data ke pengaturan awal bawaan? Seluruh perubahan inputan Anda akan dihapus.")) {
        const defaultMainPage = {
          name: "Nadya",
          title: "'Hiden Gem' Portofolio",
          photoUrl: "",
          slogan: "I build structured organizational skeletons & cultivate vibrant workspace cultures.",
          body: "A people operations facilitator obsessed with elegant administration and clean designs. I believe that workspace compliance doesn't have to look boring, and employee branding is best served with true transparency. Let's delve into my cozy archive of insights.",
          linkedinUrl: "https://linkedin.com",
          mobileQuote: "Kami memformulasikan budaya organisasi terstruktur dengan bumbu empati, menyajikan kepuasan talenta yang matang untuk pertumbuhan bisnis.",
          drawerDesc: "People Operations Specialist obsessed dengan elegant administration and clean organizational designs.",
          welcomeQuote: "\ud83c\udf31 Hi, I am Nadya. Every project here started as a small seed\u2014\nwatered through daily hands-on practice, fertilized by \npurposeful learning and reflection, and cultivated to \ndeliver meaningful impact.",
          welcomeCta: "[ Step inside the garden of growth \u2192 ]",
          alertMessage: ""
        };
        try {
          await Promise.all([
            window.db.saveContent("portfolio_menu", PORTFOLIO_MENU),
            window.db.saveContent("chef_profile", CHEF_PROFILE),
            window.db.saveContent("main_page_content", defaultMainPage)
          ]);
        } catch (err) {
          alert("Gagal reset di Supabase. Cek koneksi internet kamu.");
          return;
        }

        portfolioMenu.value = normalizePortfolioMenu(JSON.parse(JSON.stringify(PORTFOLIO_MENU)));
        chefProfileState.value = JSON.parse(JSON.stringify(CHEF_PROFILE));
        mainPageContent.value = defaultMainPage;

        // Sync forms after reset
        chefForm.value = JSON.parse(JSON.stringify(CHEF_PROFILE));
        homepageForm.value = JSON.parse(JSON.stringify(defaultMainPage));

        alert("Seluruh data telah berhasil dikembalikan ke pengaturan awal bawaan!");
      }
    };

    const handleNameClick = () => {
      if (clickTimeoutRef.value) clearTimeout(clickTimeoutRef.value);
      clickCount.value++;
      if (clickCount.value >= 5) {
        isLoginModalOpen.value = true;
        clickCount.value = 0;
        refreshIcons();
      }
      clickTimeoutRef.value = setTimeout(() => {
        clickCount.value = 0;
      }, 1500);
    };

    const handleAddGuestbook = async (e) => {
      e.preventDefault();
      if (!formName.value.trim() || !formMessage.value.trim()) return;
      const draft = {
        name: formName.value,
        role: formRole.value || "Rekruter Budaya",
        message: formMessage.value,
        stars: formStars.value,
        dishLiked: formDishLiked.value,
        date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
      };
      let saved;
      try {
        saved = await window.db.addGuestbookEntry(draft);
      } catch (err) {
        alert("Gagal mengirim ulasan. Cek koneksi internet kamu.");
        return;
      }
      guestbookEntries.value.unshift(saved);
      formName.value = "";
      formRole.value = "";
      formMessage.value = "";
      formStars.value = 5;
      guestbookSuccess.value = true;
      setTimeout(() => { guestbookSuccess.value = false; }, 4000);
      refreshIcons();
    };

    const handleLikeEntry = async (id) => {
      const entry = guestbookEntries.value.find(e => e.id === id);
      if (!entry) return;
      const prevLikes = entry.likes;
      entry.likes++;
      try {
        const newLikes = await window.db.likeGuestbookEntry(id);
        entry.likes = newLikes;
      } catch (err) {
        entry.likes = prevLikes;
      }
    };

    // Opsi dropdown "Tanggal Pelaksanaan Proyek" — diambil otomatis dari tahun
    // pada field price ("YYYY-MM") tiap proyek, unik & diurutkan terbaru dulu.
    const dateFilterOptions = computed(() => {
      const years = new Set();
      portfolioMenu.value.forEach(item => {
        const match = /^(\d{4})-\d{2}$/.exec(item.price || "");
        if (match) years.add(match[1]);
      });
      return Array.from(years).sort((a, b) => b.localeCompare(a));
    });

    // Apakah ada filter/pencarian yang sedang aktif — dipakai untuk menentukan
    // apakah proyek yang dipin masih boleh "dipaksa" ke atas atau tidak.
    const isAnyFilterActive = computed(() => {
      return selectedCategory.value !== "all" ||
             selectedDateFilter.value !== "all" ||
             selectedExperienceFilter.value !== "all" ||
             !!searchQuery.value;
    });

    const filteredMenu = computed(() => {
      const filtered = portfolioMenu.value.filter(item => {
        const matchesCat = selectedCategory.value === "all" || item.category === selectedCategory.value;
        const matchesDate = selectedDateFilter.value === "all" || (item.price || "").startsWith(selectedDateFilter.value);
        const matchesExperience = selectedExperienceFilter.value === "all" ||
                                   (selectedExperienceFilter.value === "none" ? !item.experienceLink : item.experienceLink === selectedExperienceFilter.value);
        const search = searchQuery.value.toLowerCase();
        const matchesSearch = !search ||
                              item.name.toLowerCase().includes(search) ||
                              (item.shortDescription && item.shortDescription.toLowerCase().includes(search)) ||
                              (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(search)));
        return matchesCat && matchesDate && matchesExperience && matchesSearch;
      });

      // Default urutan: proyek terbaru dulu, berdasarkan "Tanggal Pelaksanaan
      // Proyek" (field price, format "YYYY-MM"). Proyek tanpa tanggal valid
      // ditaruh paling belakang, bukan ikut tercampur di urutan atas.
      const byDateDesc = (a, b) => {
        const dateA = /^\d{4}-\d{2}$/.test(a.price || "") ? a.price : "0000-00";
        const dateB = /^\d{4}-\d{2}$/.test(b.price || "") ? b.price : "0000-00";
        return dateB.localeCompare(dateA);
      };

      // Proyek yang di-pin selalu naik ke paling atas — TAPI hanya saat lagi
      // tidak ada filter kategori/tanggal/pengalaman/pencarian yang aktif.
      // Begitu ada filter aktif, urutan balik ke murni tanggal terbaru saja,
      // supaya hasil filter tetap terasa "apa adanya" tanpa proyek pin
      // menyerobot posisi di atas hasil pencarian/filter tertentu.
      if (isAnyFilterActive.value) {
        return [...filtered].sort(byDateDesc);
      }
      const pinned = filtered.filter(item => item.pinned);
      const rest = filtered.filter(item => !item.pinned);
      pinned.sort(byDateDesc);
      rest.sort(byDateDesc);
      return [...pinned, ...rest];
    });

    const currentDish = computed(() => portfolioMenu.value[currentSlideIndex.value] || portfolioMenu.value[0]);

    // --- HOME PAGE: pin the "PERJALANAN KARIER" card's height to SHAPE 1's
    // (profile + portfolio) height, one-way only, via ResizeObserver. This is
    // deliberately NOT done with CSS self-stretch/items-stretch — that matches
    // whichever sibling is tallest in EITHER direction, so a long career list
    // would drag SHAPE 1 taller too. Here SHAPE 1 always stays its natural
    // size, and SHAPE 2 is capped to match it; overflowing career entries just
    // scroll inside their own card (see index.html). Only applied on xl+ where
    // the two cards sit side by side — below that they stack and each sizes
    // to its own natural content height.
    const homeShapeLeftRef = ref(null);
    const homeCareerCardHeight = ref(null);
    const HOME_XL_BREAKPOINT = 1280;
    let homeShapeResizeObserver = null;
    let homeShapeResizeRaf = null;

    const updateHomeCareerCardHeight = () => {
      if (!homeShapeLeftRef.value) return;
      homeCareerCardHeight.value = window.innerWidth >= HOME_XL_BREAKPOINT
        ? homeShapeLeftRef.value.offsetHeight
        : null;
    };

    // Deferring the actual height read/write to the next animation frame
    // (instead of doing it synchronously inside the ResizeObserver callback)
    // keeps the browser from ever seeing "the thing I'm observing changed
    // size again, in response to my own callback" in the same tick — which
    // is exactly what triggers the harmless-but-noisy "ResizeObserver loop
    // completed with undelivered notifications" browser warning.
    const scheduleHomeCareerCardHeightUpdate = () => {
      if (homeShapeResizeRaf) cancelAnimationFrame(homeShapeResizeRaf);
      homeShapeResizeRaf = requestAnimationFrame(() => {
        homeShapeResizeRaf = null;
        updateHomeCareerCardHeight();
      });
    };

    watch(homeShapeLeftRef, (el) => {
      if (homeShapeResizeObserver) {
        homeShapeResizeObserver.disconnect();
        homeShapeResizeObserver = null;
      }
      if (el) {
        updateHomeCareerCardHeight();
        homeShapeResizeObserver = new ResizeObserver(() => scheduleHomeCareerCardHeightUpdate());
        homeShapeResizeObserver.observe(el);
      } else {
        homeCareerCardHeight.value = null;
      }
    });

    window.addEventListener("resize", scheduleHomeCareerCardHeightUpdate);
    onUnmounted(() => {
      window.removeEventListener("resize", scheduleHomeCareerCardHeightUpdate);
      if (homeShapeResizeObserver) homeShapeResizeObserver.disconnect();
      if (homeShapeResizeRaf) cancelAnimationFrame(homeShapeResizeRaf);
    });

    // Entri "Perjalanan Karier" untuk halaman Background — diambil dari section
    // "Professional Experience" (type: timeline) di data profil, supaya satu
    // sumber data yang sama dipakai di halaman Profile & Background.
    // Halaman Background SELALU menampilkan seluruh entri ini apa adanya
    // (lengkap, sesuai admin panel — tidak difilter).
    const careerEntries = computed(() => {
      const sections = chefProfileState.value.sections || [];
      const experienceSection = sections.find(s => s.id === "experience");
      if (!experienceSection || !experienceSection.entries) return [];
      return experienceSection.entries;
    });

    // Subset dari careerEntries khusus untuk kartu "CAREER JOURNEY" di Beranda —
    // admin bisa memilih entri mana saja yang mau disembunyikan dari Beranda (dan
    // juga dari bagian Professional Experience di halaman Profil/CV) lewat toggle
    // "Tampilkan di Beranda & Profil (CV)" per entri (field entry.showOnHome, boolean).
    // Entri lama yang belum punya field ini (showOnHome === undefined) dianggap
    // tetap tampil by default, supaya data lama tidak tiba-tiba hilang.
    const homeCareerEntries = computed(() => careerEntries.value.filter(entry => entry.showOnHome !== false));

    // SYNC PORTOFOLIO <-> PROFESSIONAL EXPERIENCE — sebuah proyek portofolio
    // bisa "disinkronkan" ke salah satu entri Professional Experience (dari
    // Admin > Profil Saya). Karena entri experience tidak punya id tetap,
    // pautannya disimpan sebagai kombinasi heading+period (lewat experienceKey)
    // di portfolioForm.experienceLink / item.experienceLink. Kalau admin
    // mengganti judul atau periode entri tsb, pautan lama otomatis lepas
    // (dianggap trade-off yang wajar, sama seperti id proyek yang re-derive
    // dari judul di savePortfolioCard).
    const experienceKey = (entry) => `${entry.heading || ""}||${entry.period || ""}`;
    const getLinkedExperience = (item) => {
      if (!item || !item.experienceLink) return null;
      return careerEntries.value.find(entry => experienceKey(entry) === item.experienceLink) || null;
    };

    // Daftar proyek di Admin > Kelola Portofolio, disaring berdasarkan
    // adminExperienceFilter — supaya admin bisa cepat cek proyek mana yang
    // belum disinkronkan ("Belum Disinkronkan") atau lihat semua proyek
    // milik satu entri Professional Experience tertentu.
    const adminFilteredPortfolio = computed(() => {
      if (adminExperienceFilter.value === "all") return portfolioMenu.value;
      if (adminExperienceFilter.value === "none") return portfolioMenu.value.filter(item => !item.experienceLink);
      return portfolioMenu.value.filter(item => item.experienceLink === adminExperienceFilter.value);
    });

    const handlePrevSlide = () => {
      if (portfolioMenu.value.length === 0) return;
      currentSlideIndex.value = currentSlideIndex.value === 0 ? portfolioMenu.value.length - 1 : currentSlideIndex.value - 1;
    };

    const handleNextSlide = () => {
      if (portfolioMenu.value.length === 0) return;
      currentSlideIndex.value = currentSlideIndex.value === portfolioMenu.value.length - 1 ? 0 : currentSlideIndex.value + 1;
    };

    const switchTab = (tabId) => {
      activeTab.value = tabId;
      // Navigating to a different top-level tab always closes any open
      // portfolio/certificate popup — a "page" shouldn't carry over another
      // page's popup, and it keeps the shareable URL for that page clean
      // (no leftover /item-id from whatever was open before).
      selectedDish.value = null;
      selectedCertificate.value = null;
      refreshIcons();
    };

    const openDishDetails = (dish) => {
      selectedDish.value = dish;
      refreshIcons();
    };

    // POPUP PHOTO GALLERY — "images" is the current project's photo list;
    // falls back to the old single "image" field for projects saved before
    // multi-photo support. Index resets to 0 every time a different project
    // is opened, so you always start on the cover photo.
    const selectedDishImageIndex = ref(0);
    const selectedDishImages = computed(() => normalizeImages(selectedDish.value));
    watch(selectedDish, () => { selectedDishImageIndex.value = 0; dishPhotoLightboxOpen.value = false; });
    const nextDishImage = () => {
      const total = selectedDishImages.value.length;
      if (total < 2) return;
      selectedDishImageIndex.value = (selectedDishImageIndex.value + 1) % total;
    };
    const prevDishImage = () => {
      const total = selectedDishImages.value.length;
      if (total < 2) return;
      selectedDishImageIndex.value = (selectedDishImageIndex.value - 1 + total) % total;
    };

    // Tap-to-enlarge for the project popup's photo (mainly for mobile, where
    // the photo sits in a cropped/cover-fit strip) — opens the current photo
    // full-size with its real proportions (object-contain, not cropped).
    // Reuses selectedDishImageIndex/next/prevDishImage so left/right still
    // navigate exactly like the regular card view, just from the lightbox.
    const dishPhotoLightboxOpen = ref(false);

    const openCertificate = (cert) => {
      selectedCertificate.value = cert;
      refreshIcons();
    };

    // --- FILTER KATEGORI SERTIFIKAT (Sertifikat / HKI-Paten / Publikasi
    // Jurnal / dll) — daftar kategori diambil otomatis & unik dari data yang
    // ada, jadi tidak perlu di-hardcode dan otomatis nambah kalau ada
    // kategori baru yang diinput lewat form admin.
    const selectedCertificateCategory = ref("all");
    const certificateCategories = computed(() => {
      const cats = new Set();
      certificateMenu.value.forEach(item => {
        if (item.category && item.category.trim()) cats.add(item.category.trim());
      });
      return Array.from(cats).sort((a, b) => a.localeCompare(b, "id"));
    });
    const filteredCertificates = computed(() => {
      if (selectedCertificateCategory.value === "all") return certificateMenu.value;
      return certificateMenu.value.filter(item => item.category === selectedCertificateCategory.value);
    });

    // --- URL ROUTING (shareable links) ---
    // Every page/tab AND every portfolio-card / certificate popup gets its
    // own link via the URL hash, e.g.:
    //   #/menu                        -> Portofolio tab
    //   #/menu/onboarding-delight     -> Portofolio tab + that dish's popup open
    //   #/certificate/cert-people-analytics -> Sertifikat tab + that cert's popup open
    // Hash-based routing works on plain static hosting too (no server-side
    // routes needed). State -> URL and URL -> state are kept in sync so
    // browser back/forward and pasted links both work correctly.
    const VALID_TABS = ["home", "chef", "background", "menu", "certificate"];
    let isApplyingRouteFromHash = false; // guard against the hash<->state sync looping on itself

    const parseHash = () => {
      const raw = window.location.hash.replace(/^#\/?/, "");
      const parts = raw.split("/").filter(Boolean);
      const tab = VALID_TABS.includes(parts[0]) ? parts[0] : "home";
      const itemId = parts[1] ? decodeURIComponent(parts[1]) : null;
      return { tab, itemId };
    };

    const applyRouteFromHash = () => {
      const { tab, itemId } = parseHash();
      isApplyingRouteFromHash = true;
      activeTab.value = tab;
      selectedDish.value = (tab === "menu" && itemId)
        ? (portfolioMenu.value.find(d => d.id === itemId) || null)
        : null;
      selectedCertificate.value = (tab === "certificate" && itemId)
        ? (certificateMenu.value.find(c => c.id === itemId) || null)
        : null;
      refreshIcons();
      nextTick(() => { isApplyingRouteFromHash = false; });
    };

    const updateHashFromState = () => {
      if (isApplyingRouteFromHash) return;
      if (activeTab.value === "admin") return; // admin area is never a public shareable route
      let hash = "#/" + activeTab.value;
      if (activeTab.value === "menu" && selectedDish.value) hash += "/" + encodeURIComponent(selectedDish.value.id);
      if (activeTab.value === "certificate" && selectedCertificate.value) hash += "/" + encodeURIComponent(selectedCertificate.value.id);
      if (window.location.hash !== hash) {
        history.replaceState(null, "", hash);
      }
    };

    window.addEventListener("hashchange", applyRouteFromHash);
    onUnmounted(() => window.removeEventListener("hashchange", applyRouteFromHash));
    watch([activeTab, selectedDish, selectedCertificate], updateHashFromState);

    // "Salin Link" — copies the current shareable URL (already reflects
    // whichever page/popup is open, thanks to the routing above) to the
    // clipboard, with a small temporary confirmation state for the UI.
    const linkCopied = ref(false);
    let linkCopiedTimeoutId = null;
    const copyLink = async () => {
      const url = window.location.href;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          const ta = document.createElement("textarea");
          ta.value = url;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        linkCopied.value = true;
        clearTimeout(linkCopiedTimeoutId);
        linkCopiedTimeoutId = setTimeout(() => { linkCopied.value = false; }, 1800);
      } catch (err) {
        console.error("Gagal menyalin link:", err);
        alert("Gagal menyalin link. Silakan salin manual dari address bar.");
      }
    };
    onUnmounted(() => clearTimeout(linkCopiedTimeoutId));

    // LOGIN MODAL STATE
    const password = ref("");
    const showPassword = ref(false);
    const loginError = ref("");
    const loginSuccess = ref(false);

    const handleLogin = async (e) => {
      e.preventDefault();
      loginError.value = "";
      const { error } = await window.db.signIn(password.value);
      if (!error) {
        loginSuccess.value = true;
        setTimeout(() => {
          isAdminLoggedIn.value = true;
          switchTab("admin");
          isLoginModalOpen.value = false;
          password.value = "";
          loginSuccess.value = false;
        }, 1000);
      } else {
        loginError.value = "Incorrect password! Please try again.";
      }
    };

    const handleLogout = async () => {
      await window.db.signOut();
      isAdminLoggedIn.value = false;
      switchTab("home");
    };

    // Watcher to re-render lucide icons when important states change
    watch([adminTab, activeTab, showWelcome, isAddingCard, isAddingCertificate, selectedCategory, selectedDateFilter, selectedExperienceFilter, adminExperienceFilter, searchQuery, selectedDish, selectedCertificate, selectedCertificateCategory, isLoginModalOpen, isContactMenuOpen, cropModalOpen, linkCopied, previewImageUrl, dishPhotoLightboxOpen, portfolioImagesCollapsed], () => {
      refreshIcons();
    });

    // The floating nav dock (fixed to the bottom of the screen) is hidden on
    // the home tab, which has its own top nav bar instead. Body only needs
    // the extra bottom padding that makes room for that dock when it's
    // actually visible — keeping it on the home tab wastes vertical space
    // and can force an unnecessary page scrollbar.
    watch(activeTab, (tab) => {
      document.body.classList.toggle("pb-24", tab !== "home");
    }, { immediate: true });

    return {
      activeTab, showWelcome, adminTab, switchTab, isContactMenuOpen, currentSlideIndex, selectedCategory, selectedDateFilter, selectedExperienceFilter, dateFilterOptions, isAnyFilterActive, searchQuery, selectedDish, openDishDetails,
      selectedDishImages, selectedDishImageIndex, nextDishImage, prevDishImage, formatProjectDate, renderBoldText, stripTags, dishPhotoLightboxOpen,
      portfolioMenu, chefProfileState, mainPageContent, guestbookEntries, visitorCount,
      certificateMenu, selectedCertificate, openCertificate,
      selectedCertificateCategory, certificateCategories, filteredCertificates,
      isAdminLoggedIn, isLoginModalOpen, handleNameClick, filteredMenu, currentDish, handlePrevSlide, handleNextSlide, careerEntries, homeCareerEntries,
      experienceKey, getLinkedExperience,
      homeShapeLeftRef, homeCareerCardHeight,
      linkCopied, copyLink,
      portfolioForm, isAddingCard, editingCardId, chefForm, homepageForm, 
      adminExperienceFilter, adminFilteredPortfolio,
      startEditCard, savePortfolioCard, deletePortfolioCard, cancelPortfolioForm, togglePortfolioPin,
      handleAddField, handleRemoveField, handleFieldChange, handleAddPoint, handleRemovePoint, adminTabs, activeAdminTab,
      portfolioImageUploading, handlePortfolioImageUpload, handlePortfolioImageRemove, setPortfolioCoverImage,
      draggedImageIndex, dragOverImageIndex, handlePortfolioImageDragStart, handlePortfolioImageDragOver, handlePortfolioImageDrop, handlePortfolioImageDragEnd, previewImageUrl,
      portfolioImagesCollapsed,
      certificateForm, isAddingCertificate, editingCertificateId,
      startEditCertificate, saveCertificate, deleteCertificate, cancelCertificateForm,
      certificateImageUploading, handleCertificateImageUpload, handleCertificateImageRemove,
      handleChefArrayAddField, handleChefArrayRemoveField, handleChefArrayChange,
      sectionIcon, handleSectionAdd, handleSectionRemove, handleSectionMove,
      handleSectionTagAdd, handleSectionTagRemove,
      handleSectionEntryAdd, handleSectionEntryRemove, handleSectionEntryBulletAdd, handleSectionEntryBulletRemove,
      handleHomepageSubmit, handleHomepagePhotoUpload, handleHomepagePhotoRemove, homepagePhotoUploading, handleChefFormSubmit, handleResetToDefaults,
      backgroundHighlight, backgroundHighlightForm, backgroundHighlightImageUploading,
      handleBackgroundHighlightPhotoUpload, handleBackgroundHighlightPhotoRemove, handleBackgroundHighlightSubmit,
      chefAvatarUploading, handleChefAvatarUpload, handleChefAvatarRemove,
      chefHeaderBgUploading, handleChefHeaderBgUpload, handleChefHeaderBgRemove,
      cropModalOpen, cropImageUrl, cropZoomValue, closeCropModal, setCropZoom, cropZoomStep, confirmCrop,
      formName, formRole, formMessage, formStars, formDishLiked, guestbookSuccess, handleAddGuestbook, handleLikeEntry,
      password, showPassword, loginError, loginSuccess, handleLogin, handleLogout,
      dataLoading, dataLoadError
    };
  }
});

// Jaring pengaman terakhir: kalau ada error tak terduga saat Vue render/patch
// komponen (bukan dari kode kita sendiri), jangan biarkan itu menghentikan
// seluruh aplikasi — cukup log ke console supaya bisa didiagnosis, tapi UI
// tetap jalan untuk user.
app.config.errorHandler = (err, instance, info) => {
  console.error("Vue error tertangkap (app tetap jalan):", err, info);
};

// RICH TEXT EDITOR — small reusable contenteditable component with a
// Bold/Italic/Underline/Bullet-list toolbar, used wherever a portfolio
// field should support basic formatting: Tagline, Challenge, Solution
// steps, Impact results, and "What Made It Special". It stores/emits HTML,
// so anywhere a field edited through this component is displayed
// elsewhere in the app, it must be rendered with v-html (not {{ }}) or the
// tags show up literally as text.
// Uses the classic (deprecated-but-still-universally-supported, no-bundler-
// needed) document.execCommand — acceptable here since this is admin-only,
// single-user input, not a public-facing WYSIWYG for untrusted users.
app.component('rich-text-editor', {
  props: {
    modelValue: { type: String, default: "" },
    placeholder: { type: String, default: "" },
    minRows: { type: Number, default: 3 }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const editorRef = ref(null);
    const active = reactive({ bold: false, italic: false, underline: false, list: false });

    const refreshActiveStates = () => {
      try {
        active.bold = document.queryCommandState('bold');
        active.italic = document.queryCommandState('italic');
        active.underline = document.queryCommandState('underline');
        active.list = document.queryCommandState('insertUnorderedList');
      } catch (e) { /* queryCommandState can throw if selection is outside the editor */ }
    };

    const emitContent = () => {
      emit('update:modelValue', editorRef.value ? editorRef.value.innerHTML : "");
    };

    const exec = (command) => {
      if (editorRef.value) editorRef.value.focus();
      document.execCommand(command, false, null);
      refreshActiveStates();
      emitContent();
    };

    // Pastes are forced to plain text (formatting stripped) so admins can't
    // accidentally drag in styled HTML from Word/a webpage — every bit of
    // formatting in the field is something they applied themselves via the
    // toolbar above, which keeps the stored HTML small and predictable.
    const handlePaste = (e) => {
      e.preventDefault();
      const clipboard = e.clipboardData || window.clipboardData;
      const text = clipboard ? clipboard.getData('text/plain') : "";
      document.execCommand('insertText', false, text);
      emitContent();
    };

    // Keeps the contenteditable DOM in sync when modelValue changes from
    // *outside* this component (e.g. opening a different project to edit,
    // or resetting the form) — but skips the write if the content already
    // matches, so it doesn't fight the caret while the admin is typing.
    watch(() => props.modelValue, (val) => {
      const next = val || "";
      if (editorRef.value && editorRef.value.innerHTML !== next) {
        editorRef.value.innerHTML = next;
      }
    });

    onMounted(() => {
      if (editorRef.value) editorRef.value.innerHTML = props.modelValue || "";
    });

    return { editorRef, active, exec, emitContent, refreshActiveStates, handlePaste };
  },
  template: `
    <div class="rich-text-field border border-neutral-200 rounded-xl bg-white overflow-hidden focus-within:border-brand-gold-dark transition-colors">
      <div class="flex items-center gap-0.5 px-1.5 py-1 border-b border-neutral-100 bg-brand-bone/40">
        <button type="button" @mousedown.prevent="exec('bold')" :class="['h-6 w-6 rounded-md flex items-center justify-center hover:bg-white cursor-pointer transition-colors', active.bold ? 'bg-white text-brand-gold-dark shadow-sm' : 'text-brand-muted']" title="Bold">
          <i data-lucide="bold" class="h-3 w-3"></i>
        </button>
        <button type="button" @mousedown.prevent="exec('italic')" :class="['h-6 w-6 rounded-md flex items-center justify-center hover:bg-white cursor-pointer transition-colors', active.italic ? 'bg-white text-brand-gold-dark shadow-sm' : 'text-brand-muted']" title="Italic">
          <i data-lucide="italic" class="h-3 w-3"></i>
        </button>
        <button type="button" @mousedown.prevent="exec('underline')" :class="['h-6 w-6 rounded-md flex items-center justify-center hover:bg-white cursor-pointer transition-colors', active.underline ? 'bg-white text-brand-gold-dark shadow-sm' : 'text-brand-muted']" title="Underline">
          <i data-lucide="underline" class="h-3 w-3"></i>
        </button>
        <div class="w-px h-4 bg-neutral-200 mx-0.5"></div>
        <button type="button" @mousedown.prevent="exec('insertUnorderedList')" :class="['h-6 w-6 rounded-md flex items-center justify-center hover:bg-white cursor-pointer transition-colors', active.list ? 'bg-white text-brand-gold-dark shadow-sm' : 'text-brand-muted']" title="Bullet list">
          <i data-lucide="list" class="h-3 w-3"></i>
        </button>
        <button type="button" @mousedown.prevent="exec('removeFormat')" class="h-6 w-6 rounded-md flex items-center justify-center text-brand-muted hover:bg-white cursor-pointer ml-auto transition-colors" title="Hapus format">
          <i data-lucide="remove-formatting" class="h-3 w-3"></i>
        </button>
      </div>
      <div
        ref="editorRef"
        contenteditable="true"
        class="rich-text-input rich-text-content px-3 py-1.5 text-sm leading-relaxed focus:outline-none"
        :style="{ minHeight: (minRows * 1.5) + 'em' }"
        :data-placeholder="placeholder"
        @input="emitContent"
        @keyup="refreshActiveStates"
        @mouseup="refreshActiveStates"
        @focus="refreshActiveStates"
        @paste="handlePaste"
      ></div>
    </div>
  `
});

app.mount('#root');

// Patch applied externally - handled via watch in main app
