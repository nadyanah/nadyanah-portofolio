-- Jalankan seluruh file ini sekali di Supabase Dashboard -> SQL Editor -> New query -> Run.

-- 1) Tabel untuk konten yang diedit lewat panel admin
--    (portfolio_menu, certificate_menu, chef_profile, main_page_content)
create table if not exists site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

create policy "site_content: public read"
  on site_content for select
  using (true);

create policy "site_content: admin write"
  on site_content for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 2) Tabel guestbook (ulasan pengunjung)
create table if not exists guestbook (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  message text not null,
  stars int not null default 5,
  dish_liked text,
  entry_date text,
  likes int not null default 0,
  created_at timestamptz not null default now()
);

alter table guestbook enable row level security;

create policy "guestbook: public read"
  on guestbook for select
  using (true);

create policy "guestbook: public insert"
  on guestbook for insert
  with check (true);

create policy "guestbook: admin update/delete"
  on guestbook for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "guestbook: admin delete"
  on guestbook for delete
  using (auth.role() = 'authenticated');

-- 3) Fungsi khusus supaya pengunjung publik bisa nge-"like" ulasan
--    tanpa perlu hak admin, dan tanpa bisa mengubah kolom lain.
create or replace function increment_guestbook_like(entry_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_likes int;
begin
  update guestbook set likes = likes + 1 where id = entry_id
  returning likes into new_likes;
  return new_likes;
end;
$$;

grant execute on function increment_guestbook_like(uuid) to anon, authenticated;

-- 4) Storage bucket untuk gambar yang diupload lewat panel admin
--    (foto profil, gambar proyek portfolio, gambar sertifikat)
--
--    Bucket-nya sendiri HARUS dibuat lewat Dashboard (SQL tidak bisa
--    membuat bucket baru), jadi lakukan ini dulu SEBELUM menjalankan
--    bagian di bawah:
--      Dashboard -> Storage -> New bucket
--      Name: portfolio-images
--      Public bucket: ON (nyalakan toggle-nya)
--
--    Setelah bucket "portfolio-images" dibuat, lanjutkan run bagian SQL
--    di bawah ini untuk mengatur siapa yang boleh baca/upload/hapus.

create policy "portfolio-images: public read"
  on storage.objects for select
  using (bucket_id = 'portfolio-images');

create policy "portfolio-images: admin upload"
  on storage.objects for insert
  with check (bucket_id = 'portfolio-images' and auth.role() = 'authenticated');

create policy "portfolio-images: admin update"
  on storage.objects for update
  using (bucket_id = 'portfolio-images' and auth.role() = 'authenticated');

create policy "portfolio-images: admin delete"
  on storage.objects for delete
  using (bucket_id = 'portfolio-images' and auth.role() = 'authenticated');
