/* ==========================================================================
   translate-select.js
   Fitur: kalau pengunjung nge-block/select kalimat di halaman ini, muncul
   tombol kecil "Terjemahkan ke Indonesia" mengambang di dekat teks yang
   diblok. Diklik → teks diterjemahkan pakai API terjemahan publik (MyMemory)
   dan hasilnya muncul di kartu kecil di bawah tombol.

   Sengaja dibuat berdiri sendiri (bukan bagian dari app.js / Vue) supaya:
   - Tidak perlu utak-atik state Vue yang sudah kompleks di app.js
   - Kalau API terjemahan down/error, fitur ini gagal sendiri tanpa
     merusak apapun di sisa halaman (Vue, Cropper.js, dll tetap aman)

   Otomatis nonaktif kalau seleksi terjadi di dalam form/textarea/input
   (misalnya waktu admin lagi edit konten), supaya tidak mengganggu.
   ========================================================================== */
(function () {
  "use strict";

  // MyMemory Translated — API terjemahan publik, gratis, tidak perlu API key,
  // dan mendukung CORS jadi bisa dipanggil langsung dari browser.
  // Batas: ~500 karakter per request, ~5000 karakter/hari untuk pemakaian anonim.
  const TRANSLATE_ENDPOINT = "https://api.mymemory.translated.net/get";
  const SOURCE_LANG = "en";
  const TARGET_LANG = "id";
  const MIN_SELECTION_LENGTH = 2;
  const MAX_SELECTION_LENGTH = 480;

  let popupEl = null;
  let debounceTimer = null;

  function removePopup() {
    if (popupEl && popupEl.parentNode) {
      popupEl.parentNode.removeChild(popupEl);
    }
    popupEl = null;
  }

  // Jangan tawarkan terjemahan kalau seleksi terjadi di dalam elemen yang
  // bisa diedit (input, textarea, contenteditable) — itu berarti kemungkinan
  // besar admin sedang mengetik/mengedit konten, bukan membaca.
  function isInsideEditable(node) {
    let el = node && (node.nodeType === 1 ? node : node.parentElement);
    while (el) {
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable) return true;
      el = el.parentElement;
    }
    return false;
  }

  function clampToViewport(wrap, rect) {
    const margin = 8;
    const width = wrap.offsetWidth || 200;
    let left = rect.left + rect.width / 2;
    left = Math.min(Math.max(left, width / 2 + margin), window.innerWidth - width / 2 - margin);
    let top = rect.top - 10;
    if (top < 60) top = rect.bottom + 10; // kalau kepotong atas layar, taruh di bawah seleksi
    wrap.style.left = left + "px";
    wrap.style.top = top + "px";
    wrap.style.transform = top === rect.top - 10 ? "translate(-50%, -100%)" : "translate(-50%, 0)";
  }

  function buildPopup(rect, selectedText) {
    removePopup();

    const wrap = document.createElement("div");
    wrap.className = "translate-select-popup";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "translate-select-btn";
    btn.innerHTML = '<span class="translate-select-icon">\uD83C\uDF10</span><span>Terjemahkan ke Indonesia</span>';

    // Cegah klik tombol menghapus seleksi teks sebelum kita sempat baca teksnya
    btn.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });

    btn.addEventListener("click", async function () {
      btn.disabled = true;
      btn.innerHTML = '<span class="translate-select-icon translate-select-spin">\u23F3</span><span>Menerjemahkan...</span>';
      try {
        const translated = await translateText(selectedText);
        showResult(wrap, translated);
      } catch (err) {
        showError(wrap);
      }
    });

    wrap.appendChild(btn);
    document.body.appendChild(wrap);
    popupEl = wrap;
    clampToViewport(wrap, rect);

    return wrap;
  }

  async function translateText(text) {
    const q = text.slice(0, MAX_SELECTION_LENGTH);
    const url = TRANSLATE_ENDPOINT + "?q=" + encodeURIComponent(q) + "&langpair=" + SOURCE_LANG + "|" + TARGET_LANG;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Permintaan terjemahan gagal");
    const data = await res.json();
    const translated = data && data.responseData && data.responseData.translatedText;
    if (!translated) throw new Error("Hasil terjemahan kosong");
    return translated;
  }

  function showResult(wrap, translated) {
    wrap.innerHTML = "";

    const card = document.createElement("div");
    card.className = "translate-select-card";

    const label = document.createElement("div");
    label.className = "translate-select-label";
    label.textContent = "Terjemahan Indonesia";

    const body = document.createElement("div");
    body.className = "translate-select-body";
    body.textContent = translated;

    const actions = document.createElement("div");
    actions.className = "translate-select-actions";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "translate-select-action-btn";
    copyBtn.textContent = "Salin";
    copyBtn.addEventListener("click", function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(translated).catch(function () {});
      }
      copyBtn.textContent = "Tersalin!";
      setTimeout(function () {
        copyBtn.textContent = "Salin";
      }, 1200);
    });

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "translate-select-action-btn translate-select-close";
    closeBtn.textContent = "Tutup";
    closeBtn.addEventListener("click", removePopup);

    actions.appendChild(copyBtn);
    actions.appendChild(closeBtn);

    card.appendChild(label);
    card.appendChild(body);
    card.appendChild(actions);
    wrap.appendChild(card);
  }

  function showError(wrap) {
    wrap.innerHTML = "";
    const card = document.createElement("div");
    card.className = "translate-select-card translate-select-card-error";
    card.textContent = "Gagal menerjemahkan, coba lagi.";
    wrap.appendChild(card);
    setTimeout(removePopup, 2000);
  }

  function handleSelectionChange(e) {
    // Kalau mouseup/touchend ini berasal dari dalam popup kita sendiri
    // (misalnya klik tombol "Terjemahkan"), JANGAN proses ulang seleksi —
    // kalau tidak, popup langsung di-reset balik ke tombol awal padahal
    // proses terjemahan baru saja mulai (teks yang diblok tetap ter-select
    // karena mousedown tombol pakai preventDefault).
    if (popupEl && e && e.target && popupEl.contains(e.target)) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        removePopup();
        return;
      }
      const text = selection.toString().trim();
      if (text.length < MIN_SELECTION_LENGTH) {
        removePopup();
        return;
      }
      if (isInsideEditable(selection.anchorNode)) {
        removePopup();
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        removePopup();
        return;
      }

      buildPopup(rect, text);
    }, 80);
  }

  document.addEventListener("mouseup", handleSelectionChange);
  document.addEventListener("touchend", handleSelectionChange);
  document.addEventListener("mousedown", function (e) {
    if (popupEl && !popupEl.contains(e.target)) removePopup();
  });
  document.addEventListener("scroll", removePopup, true);
  window.addEventListener("resize", removePopup);
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") removePopup();
  });
})();
