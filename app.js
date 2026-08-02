const { createApp, ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } = Vue;

const app = createApp({
  setup() {
    // --- STATE MANAGEMENT ---
    const activeTab = ref("home");
    const showWelcome = ref(true);
    const adminTab = ref("portfolio");
    const isContactMenuOpen = ref(false);
    const currentSlideIndex = ref(0);
    const selectedCategory = ref("all");
    const searchQuery = ref("");
    const selectedDish = ref(null);

    // PERSISTENT STATES
    const portfolioMenu = ref([]);
    const chefProfileState = ref({});
    const mainPageContent = ref({});
    const guestbookEntries = ref([]);
    const certificateMenu = ref([]);
    const selectedCertificate = ref(null);
    
    // ADMIN STATES
    const isAdminLoggedIn = ref(false);
    const isLoginModalOpen = ref(false);
    const clickCount = ref(0);
    const clickTimeoutRef = ref(null);

    // ADMIN FORM STATES
    const getEmptyPortfolioForm = () => ({
      name: "", category: "people-culture", categoryLabel: "", price: "", prepTime: "", 
      satisfaction: "", impactMetric: "", image: "", shortDescription: "", 
      ingredients: [""], allergens: [""],
      chefNotes: { background: "", challenge: "", recipe: [""], results: [""], philosophy: "" }
    });
    const portfolioForm = ref(getEmptyPortfolioForm());
    const isAddingCard = ref(false);
    const editingCardId = ref(null);
    const portfolioImageUploading = ref(false);

    // CERTIFICATE ADMIN FORM STATES
    const getEmptyCertificateForm = () => ({
      title: "", issuer: "", date: "", category: "", credentialId: "", credentialUrl: "", image: ""
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
        cropperInstance = new window.Cropper(imgEl, {
          aspectRatio: aspect || NaN,
          viewMode: 1,
          dragMode: "move",
          autoCropArea: 1,
          background: false,
          responsive: true,
          zoomOnWheel: true,
        });
      });
    };

    const closeCropModal = () => {
      cropModalOpen.value = false;
      if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
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
          drawerDesc: "People Operations Specialist obsessed with elegant administration and clean organizational designs."
        };

        const [menuRes, certRes, chefRes, mainRes, guestbook, session] = await Promise.all([
          window.db.getContent("portfolio_menu", PORTFOLIO_MENU),
          window.db.getContent("certificate_menu", typeof CERTIFICATE_MENU !== "undefined" ? CERTIFICATE_MENU : []),
          window.db.getContent("chef_profile", CHEF_PROFILE),
          window.db.getContent("main_page_content", defaultMainPage),
          window.db.getGuestbook(),
          window.db.getSession()
        ]);

        portfolioMenu.value = menuRes.value;
        certificateMenu.value = certRes.value;
        chefProfileState.value = chefRes.value;
        chefForm.value = JSON.parse(JSON.stringify(chefProfileState.value));
        mainPageContent.value = mainRes.value;
        homepageForm.value = JSON.parse(JSON.stringify(mainPageContent.value));
        guestbookEntries.value = guestbook;

        isAdminLoggedIn.value = !!session;

        if (portfolioMenu.value.length > 0) {
          formDishLiked.value = portfolioMenu.value[0].name;
        }
      } catch (err) {
        console.error("Gagal memuat data dari Supabase:", err);
        dataLoadError.value = "Gagal memuat data dari Supabase. Cek koneksi internet & konfigurasi di supabase-config.js.";
      } finally {
        dataLoading.value = false;
        nextTick(() => {
          if(window.lucide) window.lucide.createIcons();
        });
      }
    });

    // HANDLERS
    
    // PORTFOLIO ADMIN HANDLERS
    const startEditCard = (card) => {
      portfolioForm.value = JSON.parse(JSON.stringify(card));
      editingCardId.value = card.id;
      isAddingCard.value = true;
    };
    
    const savePortfolioCard = async (e) => {
      if(e) e.preventDefault();
      if (!portfolioForm.value.image) {
        alert("Upload gambar proyek dulu ya.");
        return;
      }
      const submission = { ...portfolioForm.value, id: editingCardId.value || "porto-" + Date.now() };
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
      nextTick(() => { if(window.lucide) window.lucide.createIcons(); });
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
    
    const cancelPortfolioForm = () => {
      portfolioForm.value = getEmptyPortfolioForm();
      editingCardId.value = null;
      isAddingCard.value = false;
    };

    const handlePortfolioImageUpload = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      openCropModal(file, { assign: (url) => portfolioForm.value.image = url, folder: "portfolio", uploadingRef: portfolioImageUploading, aspect: 1 }, e.target);
    };
    const handlePortfolioImageRemove = () => {
      portfolioForm.value.image = "";
    };

    const handleAddField = (field, subfield = null) => {
      if (subfield) portfolioForm.value.chefNotes[subfield].push("");
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

    // CERTIFICATE ADMIN HANDLERS
    const startEditCertificate = (cert) => {
      certificateForm.value = JSON.parse(JSON.stringify(cert));
      editingCertificateId.value = cert.id;
      isAddingCertificate.value = true;
    };

    const saveCertificate = async (e) => {
      if (e) e.preventDefault();
      const submission = { ...certificateForm.value, id: editingCertificateId.value || "cert-" + Date.now() };
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
      nextTick(() => { if(window.lucide) window.lucide.createIcons(); });
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
      openCropModal(file, { assign: (url) => certificateForm.value.image = url, folder: "certificates", uploadingRef: certificateImageUploading, aspect: 1 }, e.target);
    };
    const handleCertificateImageRemove = () => {
      certificateForm.value.image = "";
    };

    // CHEF ADMIN HANDLERS
    const handleChefFormSubmit = async (e) => {
      if(e) e.preventDefault();
      const next = JSON.parse(JSON.stringify(chefForm.value));
      try {
        await window.db.saveContent("chef_profile", next);
      } catch (err) {
        alert("Gagal menyimpan ke Supabase. Cek koneksi internet kamu.");
        return;
      }
      chefProfileState.value = next;
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
      if (type === "timeline") return { ...base, entries: [{ heading: "", subheading: "", period: "", bullets: [""] }] };
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
      chefForm.value.sections[sectionIdx].entries.push({ heading: "", subheading: "", period: "", bullets: [""] });
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
          drawerDesc: "People Operations Specialist obsessed dengan elegant administration and clean organizational designs."
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

        portfolioMenu.value = JSON.parse(JSON.stringify(PORTFOLIO_MENU));
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
        nextTick(() => { if(window.lucide) window.lucide.createIcons(); });
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
        date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
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
      nextTick(() => { if(window.lucide) window.lucide.createIcons(); });
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

    const filteredMenu = computed(() => {
      return portfolioMenu.value.filter(item => {
        const matchesCat = selectedCategory.value === "all" || item.category === selectedCategory.value;
        const search = searchQuery.value.toLowerCase();
        const matchesSearch = !search ||
                              item.name.toLowerCase().includes(search) ||
                              (item.shortDescription && item.shortDescription.toLowerCase().includes(search)) ||
                              (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(search)));
        return matchesCat && matchesSearch;
      });
    });

    const currentDish = computed(() => portfolioMenu.value[currentSlideIndex.value] || portfolioMenu.value[0]);

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
      nextTick(() => { if(window.lucide) window.lucide.createIcons(); });
    };

    const openDishDetails = (dish) => {
      selectedDish.value = dish;
      nextTick(() => { if(window.lucide) window.lucide.createIcons(); });
    };

    const openCertificate = (cert) => {
      selectedCertificate.value = cert;
      nextTick(() => { if(window.lucide) window.lucide.createIcons(); });
    };

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
        loginError.value = "Password rahasia salah! Silakan coba lagi.";
      }
    };

    const handleLogout = async () => {
      await window.db.signOut();
      isAdminLoggedIn.value = false;
      switchTab("home");
    };

    // Watcher to re-render lucide icons when important states change
    watch([adminTab, activeTab, isAddingCard, isAddingCertificate, selectedCategory, searchQuery, selectedDish, selectedCertificate, isLoginModalOpen, isContactMenuOpen, cropModalOpen], () => {
      nextTick(() => { if(window.lucide) window.lucide.createIcons(); });
    });

    return {
      activeTab, showWelcome, adminTab, switchTab, isContactMenuOpen, currentSlideIndex, selectedCategory, searchQuery, selectedDish, openDishDetails,
      portfolioMenu, chefProfileState, mainPageContent, guestbookEntries,
      certificateMenu, selectedCertificate, openCertificate,
      isAdminLoggedIn, isLoginModalOpen, handleNameClick, filteredMenu, currentDish, handlePrevSlide, handleNextSlide,
      portfolioForm, isAddingCard, editingCardId, chefForm, homepageForm, 
      startEditCard, savePortfolioCard, deletePortfolioCard, cancelPortfolioForm,
      handleAddField, handleRemoveField, handleFieldChange,
      portfolioImageUploading, handlePortfolioImageUpload, handlePortfolioImageRemove,
      certificateForm, isAddingCertificate, editingCertificateId,
      startEditCertificate, saveCertificate, deleteCertificate, cancelCertificateForm,
      certificateImageUploading, handleCertificateImageUpload, handleCertificateImageRemove,
      handleChefArrayAddField, handleChefArrayRemoveField, handleChefArrayChange,
      sectionIcon, handleSectionAdd, handleSectionRemove, handleSectionMove,
      handleSectionTagAdd, handleSectionTagRemove,
      handleSectionEntryAdd, handleSectionEntryRemove, handleSectionEntryBulletAdd, handleSectionEntryBulletRemove,
      handleHomepageSubmit, handleHomepagePhotoUpload, handleHomepagePhotoRemove, homepagePhotoUploading, handleChefFormSubmit, handleResetToDefaults,
      chefAvatarUploading, handleChefAvatarUpload, handleChefAvatarRemove,
      chefHeaderBgUploading, handleChefHeaderBgUpload, handleChefHeaderBgRemove,
      cropModalOpen, cropImageUrl, cropZoomValue, closeCropModal, setCropZoom, cropZoomStep, confirmCrop,
      formName, formRole, formMessage, formStars, formDishLiked, guestbookSuccess, handleAddGuestbook, handleLikeEntry,
      password, showPassword, loginError, loginSuccess, handleLogin, handleLogout,
      dataLoading, dataLoadError
    };
  }
});

app.mount('#root');

// Patch applied externally - handled via watch in main app
