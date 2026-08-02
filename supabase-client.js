/**
 * Lapisan akses data ke Supabase. app.js memanggil fungsi-fungsi di
 * `window.db` ini, jadi app.js sendiri tidak perlu tahu detail Supabase.
 */
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.db = {
  supabase: supabaseClient,

  // ---- site_content: portfolio_menu, certificate_menu, chef_profile, main_page_content ----
  async getContent(key, fallbackValue) {
    const { data, error } = await supabaseClient
      .from("site_content")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error(`Gagal memuat "${key}" dari Supabase:`, error);
      return { value: fallbackValue, seeded: false, error };
    }

    if (!data) {
      // Belum ada baris untuk key ini -> isi dengan default dari data.js
      // supaya Supabase langsung jadi sumber data sejak load pertama.
      const { error: seedError } = await supabaseClient
        .from("site_content")
        .upsert({ key, value: fallbackValue });
      if (seedError) console.error(`Gagal seed "${key}":`, seedError);
      return { value: fallbackValue, seeded: true };
    }

    return { value: data.value, seeded: false };
  },

  async saveContent(key, value) {
    const { error } = await supabaseClient
      .from("site_content")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) {
      console.error(`Gagal menyimpan "${key}" ke Supabase:`, error);
      throw error;
    }
  },

  // ---- guestbook ----
  async getGuestbook() {
    const { data, error } = await supabaseClient
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Gagal memuat guestbook:", error);
      return [];
    }
    return data.map(row => ({
      id: row.id,
      name: row.name,
      role: row.role,
      message: row.message,
      stars: row.stars,
      dishLiked: row.dish_liked,
      date: row.entry_date,
      likes: row.likes
    }));
  },

  async addGuestbookEntry(entry) {
    const { data, error } = await supabaseClient
      .from("guestbook")
      .insert({
        name: entry.name,
        role: entry.role,
        message: entry.message,
        stars: entry.stars,
        dish_liked: entry.dishLiked,
        entry_date: entry.date,
        likes: 0
      })
      .select()
      .single();
    if (error) {
      console.error("Gagal mengirim ulasan:", error);
      throw error;
    }
    return {
      id: data.id, name: data.name, role: data.role, message: data.message,
      stars: data.stars, dishLiked: data.dish_liked, date: data.entry_date, likes: data.likes
    };
  },

  async likeGuestbookEntry(id) {
    // Pakai RPC (security definer) supaya pengunjung bisa nge-like tanpa
    // butuh hak akses admin, dan tanpa bisa mengubah field lain.
    const { data, error } = await supabaseClient.rpc("increment_guestbook_like", { entry_id: id });
    if (error) {
      console.error("Gagal menambah like:", error);
      throw error;
    }
    return data; // jumlah likes terbaru
  },

  // ---- storage (image uploads from admin panel) ----
  async uploadImage(file, folder = "misc") {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabaseClient.storage
      .from("portfolio-images")
      .upload(path, file, { upsert: false, cacheControl: "3600" });
    if (error) {
      console.error("Gagal upload gambar:", error);
      throw error;
    }
    const { data } = supabaseClient.storage.from("portfolio-images").getPublicUrl(path);
    return data.publicUrl;
  },

  // ---- auth (admin) ----
  async signIn(password) {
    return supabaseClient.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
  },
  async signOut() {
    return supabaseClient.auth.signOut();
  },
  async getSession() {
    const { data } = await supabaseClient.auth.getSession();
    return data.session;
  }
};
