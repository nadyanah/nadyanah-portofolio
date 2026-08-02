/**
 * Konfigurasi koneksi Supabase.
 *
 * Isi 2 nilai di bawah dengan punya project Supabase kamu sendiri:
 * - SUPABASE_URL   : Project Settings → API → "Project URL"
 * - SUPABASE_ANON_KEY : Project Settings → API → "anon public" key
 *
 * Nilai-nilai ini AMAN untuk ditaruh di kode frontend (public), karena
 * akses baca/tulis tetap dibatasi oleh Row Level Security (RLS) yang
 * diatur lewat file supabase-schema.sql. JANGAN pernah menaruh
 * "service_role" key di sini.
 *
 * ADMIN_EMAIL harus sama persis dengan email user admin yang kamu buat
 * di Supabase → Authentication → Users. Password admin diatur di sana,
 * BUKAN di kode ini.
 */
const SUPABASE_URL = "https://xafemxehfquoqfmvyqpj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_76_phvIUxbdr8gb_Uiql7Q_YebI1fW5";
const ADMIN_EMAIL = "nadyanah@porto.com";
