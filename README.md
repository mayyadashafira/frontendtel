# Telventory Systems — Backend (FastAPI + Supabase + Gemini)

Backend baru untuk frontend React yang sudah ada di folder `kptel/`,
menggantikan backend Node.js lama (`kptel/server/`, SQLite). Backend
ini dibuat 1:1 mengikuti kontrak API yang sudah diasumsikan oleh kode
frontend (`src/services/*.js`), jadi **tidak perlu mengubah kode
frontend sama sekali** — cukup arahkan proxy/`.env` frontend ke server
ini.

Stack:
- **FastAPI** (Python) — HTTP API
- **Supabase (Postgres)** — database
- **JWT custom** (bukan Supabase Auth) — sesi login, sama seperti backend lama
- **Google Gemini API** — otak chatbot "Tel AI", dengan masking data sensitif sebelum dikirim ke Gemini
- **ReportLab** — generate laporan PDF

---

## 1. Struktur folder

```
kptel_backend/
  app/
    main.py                  # entry point FastAPI, daftar semua router
    core/
      config.py              # baca .env
      security.py            # hash password + sign/verify JWT
      supabase_client.py      # koneksi Supabase
      deps.py                 # dependency auth (get_current_user, require_admin)
    models/                   # schema Pydantic (request/response)
      user.py
      asset.py
      chat.py
    routers/
      auth.py                 # /api/auth/*
      users.py                # /api/users*  (admin: approve/decline/edit/delete)
      assets.py                # /api/assets/{resource}* (CRUD + bulk import/restock)
      dashboard.py             # /api/dashboard/summary
      chatbot.py               # /api/tel-ai/*
      reports.py               # /api/reports/generate (PDF)
    services/
      chatbot_service.py       # logika Tel AI: masking + panggil Gemini
    utils/
      resources.py             # daftar resource valid + kategori + RESOURCE_TABLE_MAP (port dari resources.js)
      field_map.py              # pemetaan kolom master_assets <-> field camelCase frontend
      normalize.py             # normalisasi payload asset (camelCase vs snake_case)
      status.py                 # baca status/condition/action secara toleran (case-insensitive)
      masking.py                # masking IP/MAC/email/nama sebelum ke Gemini
      activity.py               # tulis log ke tabel activities
  scripts/
    schema.sql                 # SQL untuk membuat tabel master_assets, users, activities di Supabase
    init_db.py                 # jalankan schema.sql otomatis lewat DATABASE_URL
  requirements.txt
  .env.example
```

> **Tabel database**: backend ini menyambung langsung ke tabel
> `master_assets` yang SUDAH ADA di Supabase (bukan tabel generik
> buatan sendiri) — lihat bagian 12 di bawah untuk detail lengkap
> pemetaan kolomnya.

## 2. Kebutuhan

- Python **3.10+**
- Akun [Supabase](https://supabase.com) (gratis) — untuk database Postgres
- API key [Google Gemini](https://aistudio.google.com/app/apikey) (gratis tier tersedia) — untuk chatbot Tel AI

## 3. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com/dashboard).
2. Buka **Project Settings → API**, catat:
   - `Project URL` → jadi `SUPABASE_URL`
   - `service_role` key (bukan `anon` key!) → jadi `SUPABASE_SERVICE_ROLE_KEY`
3. Buka **Project Settings → Database → Connection string → URI**, catat
   connection string-nya → jadi `DATABASE_URL` (isi password project kamu).
4. Buat tabel dengan salah satu cara berikut:
   - **Cara mudah**: buka **SQL Editor** di dashboard Supabase → New query
     → copy-paste seluruh isi `scripts/schema.sql` → klik **Run**.
   - **Cara otomatis**: jalankan `python scripts/init_db.py` (lihat langkah 5).

Tabel yang dibutuhkan: `master_assets` (tabel utama semua kategori
aset — kemungkinan **sudah ada** di project Supabase kamu; `schema.sql`
memakai `CREATE TABLE IF NOT EXISTS` jadi aman dijalankan ulang tanpa
menimpa data), `users`, `activities` (feed dashboard), `tel_ai_messages`
(riwayat chat, opsional). Lihat bagian 11 untuk detail lengkap
pemetaan kolom `master_assets`.

## 4. Setup Gemini

1. Buka https://aistudio.google.com/app/apikey → **Create API key**.
2. Copy key-nya → jadi `GEMINI_API_KEY`.

## 5. Instalasi & jalankan backend

```bash
cd kptel_backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# --> edit .env, isi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
#     DATABASE_URL, JWT_SECRET_KEY, GEMINI_API_KEY

# (opsional, jika belum jalankan schema.sql manual di SQL Editor)
python scripts/init_db.py

# jalankan server
uvicorn app.main:app --reload --port 8787
```

Backend berjalan di `http://localhost:8787`, seluruh endpoint di
bawah prefix `/api` (contoh: `http://localhost:8787/api/health`).
Dokumentasi interaktif otomatis (Swagger) tersedia di
`http://localhost:8787/docs`.

## 6. Menyambungkan ke frontend

Frontend (`kptel/`) memakai Vite proxy: semua request `/api/*`
diteruskan ke `VITE_BACKEND_URL` (default `http://localhost:8787`,
lihat `vite.config.js`). Jadi cukup jalankan backend di port 8787,
frontend otomatis tersambung tanpa perubahan apa pun:

```bash
# terminal 1
cd kptel_backend && uvicorn app.main:app --reload --port 8787

# terminal 2
cd kptel && npm install && npm run dev
```

Buka `http://localhost:5173`.

## 7. Role, registrasi & approval — sistem 3 tingkat

- **Superuser**: akses tertinggi. CRUD penuh ke data aset (sama seperti
  Admin), DAN satu-satunya role yang boleh **menghapus atau mengubah**
  akun Admin maupun Superuser lain lewat menu Admin.
- **Admin**: CRUD penuh ke data aset (Import CSV, Bulk Restock CSV,
  kelola user), TAPI **tidak bisa** menghapus atau mengubah akun
  Superuser (tombol Edit/Delete otomatis nonaktif di UI untuk baris
  Superuser, dan backend tetap menolak dengan `403` kalau dipaksa lewat
  API langsung).
- **User**: read-only — cuma bisa lihat data + Export CSV, tidak bisa
  create/update/delete apa pun.

Saat Register, isi kolom **"Admin Registration Code"** dengan salah
satu dari 2 kode di `.env` untuk langsung aktif tanpa approval:

| Isi kolom dengan... | Jadi role | Env var terkait |
|---|---|---|
| `SUPERUSER_REGISTRATION_CODE` (default: `TELVENTORY-SUPERUSER-2026`) | Superuser | jaga kode ini KETAT, jangan dibagikan sembarangan |
| `ADMIN_REGISTRATION_CODE` (default: `TELVENTORY-ADMIN-2026`) | Admin | |
| *(dikosongkan)* | User | akun masuk status `pending`, wajib di-approve dulu oleh Admin/Superuser lewat menu **Admin → Pending Admin Request** |

**Penting**: karena registrasi Superuser pertama juga lewat form
Register yang sama (field "Admin Registration Code"), pastikan kamu
ganti `SUPERUSER_REGISTRATION_CODE` di `.env` ke nilai rahasia sendiri
SEBELUM deploy ke publik — siapa pun yang tahu kode ini bisa daftar
jadi Superuser.

### Sistem hanya boleh punya SATU Superuser

Dibatasi otomatis di backend (`app/utils/user_normalize.py` ->
`superuser_exists()`), dicek di 2 tempat:

1. **Saat Register** — kalau slot Superuser sudah terisi, pendaftaran
   dengan `SUPERUSER_REGISTRATION_CODE` akan ditolak (`409 Conflict`)
   walau kodenya benar. Pendaftar tetap harus daftar ulang tanpa kode
   itu (jadi User biasa) atau minta Admin buatkan akun.
2. **Saat ubah role lewat menu Admin** — Superuser tidak bisa
   mempromosikan orang lain jadi Superuser kalau slotnya sudah terisi
   (`409 Conflict`).

Karena Superuser tidak bisa mengubah role akun sendiri (mencegah kunci
diri sendiri) dan Admin tidak boleh menyentuh akun Superuser sama
sekali, **satu-satunya cara memindahkan/mencabut status Superuser**
saat ini adalah lewat Supabase Table Editor langsung (ubah kolom
`role` baris tsb jadi `"Admin"` atau `"Staff"` secara manual). Kalau
kamu butuh alur transfer Superuser lewat UI juga, kabari saya —
tinggal tambah 1 endpoint khusus untuk itu.

Role di tabel `users` (kolom `role`) disimpan sebagai teks
`"Superuser"` / `"Admin"` / `"Staff"` — lihat bagian 12 untuk detail
konversinya.

## 8. Ringkasan endpoint API

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/health` | - | health check |
| POST | `/api/auth/register` | - | daftar user/admin |
| POST | `/api/auth/login` | - | login, balas `{ token, user }` |
| GET | `/api/auth/me` | user | profil user login |
| POST | `/api/auth/forgot-password` | - | respons generik |
| POST | `/api/auth/reset-password` | - | set password baru |
| GET | `/api/users` | admin | daftar user approved |
| GET | `/api/users/pending` | admin | daftar user pending |
| POST | `/api/users/{id}/approve` | admin | approve pendaftaran |
| POST | `/api/users/{id}/decline` | admin | tolak pendaftaran |
| PUT | `/api/users/{id}` | admin | edit user |
| DELETE | `/api/users/{id}` | admin | hapus user |
| GET | `/api/assets/{resource}` | user | list aset kategori tsb |
| POST | `/api/assets/{resource}` | admin | tambah aset |
| PUT | `/api/assets/{resource}/{id}` | admin | edit aset |
| DELETE | `/api/assets/{resource}/{id}` | admin | hapus aset |
| POST | `/api/assets/{resource}/bulk-import` | admin | import CSV (bulk insert) |
| POST | `/api/assets/{resource}/bulk-restock` | admin | restock CSV (tambah stok) |
| GET | `/api/dashboard/summary` | user | kartu ringkasan + grafik + aktivitas + low stock |
| POST | `/api/tel-ai/chat` | user | chat ke Tel AI (Gemini, data sensitif dimasking) |
| GET | `/api/tel-ai/suggestions` | user | starter suggestion chips |
| GET | `/api/reports/generate` | user | unduh laporan PDF (ReportLab) |

`{resource}` valid: `ramAssets`, `batteryAssets`, `ssdAssets`,
`hddAssets`, `flashdiskAssets`, `healthReports`, `keyboardAssets`,
`comboAssets`, `webcamAssets`, `headphoneAssets`, `multiportUsbAssets`,
`hubAdaptorAssets`, `hdmiPortAssets`, `mswAssets`, `mouseAssets`,
`dongleWifiAssets`, `networkPortAssets`, `fortiSwitchAssets`,
`tabletAssets`, `castAssets`, `printerAssets`, `upsAssets`, `pcAssets`
(lihat `app/utils/resources.py`).

## 9. Tentang Tel AI (chatbot)

`app/services/chatbot_service.py` **tidak** mengizinkan frontend
memanggil Gemini secara langsung. Alurnya:

1. Backend mengambil ringkasan jumlah aset per kategori dari Supabase.
2. Nama karyawan (tabel `users`) + pesan/histori dari user di-**mask**
   terlebih dahulu (`app/utils/masking.py`): alamat IP, MAC address,
   email, dan nama karyawan diganti jadi placeholder (`[IP-REDACTED]`,
   dst) sebelum menyentuh Gemini.
3. Prompt (system instruction + konteks yang sudah dimasking + histori
   + pesan) baru dikirim ke Gemini.
4. Balasan Gemini di-mask ulang (jaga-jaga) sebelum dibalas ke frontend.
5. Riwayat percakapan disimpan ke tabel `tel_ai_messages` (best-effort,
   tidak menggagalkan response jika gagal simpan).

## 10. Keamanan & catatan produksi

- Password di-hash dengan **bcrypt** (`passlib`).
- Token sesi adalah **JWT custom** (bukan Supabase Auth), ditandatangani
  dengan `JWT_SECRET_KEY`, berlaku `JWT_EXPIRE_HOURS` jam (default 12).
- Backend memakai **Supabase service role key**, yang melewati (bypass)
  Row Level Security — semua otorisasi admin/user divalidasi penuh di
  kode FastAPI (`app/core/deps.py`), bukan di RLS Supabase.
- Ganti `JWT_SECRET_KEY` dan `ADMIN_REGISTRATION_CODE` sebelum go-live,
  dan jalankan backend di belakang HTTPS.
- Jangan commit file `.env` (sudah di-`.gitignore`).

## 11. Tabel `master_assets` — cara backend menyambung ke skema asli kamu

Backend ini **tidak** membuat tabel generik sendiri untuk aset —
langsung memakai tabel `master_assets` yang sudah ada di Supabase,
dengan kolom:

```
id, entity_id, category, sub_category, sub_sub, condition,
last_check_date, year, dept, health, action, serial_number,
manufacture, capacity, speed, brand, charger_tab, casing_tab, mac,
port, type, size, location, device_type, assign_to, quantity, notes,
pc_name, employed_name, pic, username, created_at, updated_at
```

Karena frontend **tidak diubah sama sekali** (masih memanggil
`/api/assets/{resource}` dan mengirim field camelCase seperti
`entityId`, `assignTo`, `dept`, `status`, dst — lihat `emptyForm` di
tiap `src/pages/*.jsx`), backend butuh 2 lapis pemetaan:

### a) `{resource}` -> `category` + `sub_category` (app/utils/resources.py -> `RESOURCE_TABLE_MAP`)

Tabel `master_assets` tidak punya kolom "resource" — jenis aset
dibedakan lewat kombinasi `category` + `sub_category`. Nilai-nilai ini
diambil **persis** (termasuk typo!) dari `emptyForm` di source code
frontend, contoh:

| resource (URL path) | category (DB) | sub_category (DB) |
|---|---|---|
| `ramAssets` | `Hardware & Component` | `RAM` |
| `ssdAssets` | `Storage Management` | `SSD` |
| `pcAssets` | `PC & Wokrshop` | `PC` |
| `keyboardAssets` | `Peripherals & Accecories` | `Keyboard` |
| `hubAdaptorAssets` | `Peripherals & Accessories` *(ejaan beda dari baris di atas!)* | `Hub/ Adaptor` |

Daftar lengkap 23 resource ada di `RESOURCE_TABLE_MAP`. **Kalau ada
halaman yang tampil kosong padahal datanya ada di Supabase**, cek dulu
lewat SQL Editor:

```sql
SELECT DISTINCT category, sub_category FROM master_assets;
```

lalu bandingkan dengan `RESOURCE_TABLE_MAP` di
`app/utils/resources.py` — perbaiki baris yang tidak cocok (cukup edit
1 dict, tidak perlu ubah logic lain).

### b) Kolom DB <-> field camelCase (app/utils/field_map.py)

| Field frontend (camelCase) | Kolom `master_assets` | Catatan |
|---|---|---|
| `entityId` | `entity_id` | |
| `serialNumber` | `serial_number` | |
| `status` | `action` | **beda nama!** konsep IN USE/IN STORE/BROKEN |
| `manufactur` *(typo di frontend)* | `manufacture` *(typo di DB)* | keduanya salah ketik, disamakan apa adanya |
| `dept` | `dept` | sama persis |
| `assignTo` | `assign_to` | |
| `pcName` | `pc_name` | |
| `employeeName` | `employed_name` | typo di DB (`employed` bukan `employee`) |
| `deviceType` | `device_type` | |
| `lastCheckDate` | `last_check_date` | |
| `charger` / `case` *(khusus Tablet)* | `charger_tab` / `casing_tab` | |
| `entityPc` *(khusus RAM)* | `pc_name` | override khusus resource `ramAssets` |
| `deviceId` *(khusus Health Report)* | `entity_id` | override khusus resource `healthReports` |
| `condition`, `health`, `capacity`, `speed`, `brand`, `mac`, `port`, `type`, `size`, `location`, `quantity`, `notes`, `pic`, `username`, `year`, `category`, `subCategory` | kolom dengan nama sama | |

Semua ini ada di `GLOBAL_FIELD_MAP` + `RESOURCE_FIELD_ALIASES` pada
`app/utils/field_map.py` — kalau ternyata ada field lain yang meleset,
cukup tambah/ubah 1 baris di situ, tidak perlu sentuh router lain.

### c) Field `photo`

`master_assets` tidak punya kolom untuk gambar. Field `photo` yang ada
di beberapa form frontend saat ini **tidak disimpan** ke database
(diabaikan backend). Kalau nanti perlu, tambah kolom (mis.
`photo_url`) lalu daftarkan di `GLOBAL_FIELD_MAP`.

### d) Soal kolom `quantity`

Backend memakai model **1 baris = 1 unit fisik** (konsisten dengan
adanya `serial_number` per baris): fitur **Bulk Restock** menambah
`qty` baris BARU dengan `entity_id` yang sama, bukan menambah angka di
kolom `quantity` pada 1 baris. Kolom `quantity` tetap ada & bisa diisi
manual lewat form kalau kategori tsb memangnya butuh (mis. hanya
sebagai catatan jumlah), tapi tidak dipakai untuk perhitungan dashboard
(perhitungan dashboard menghitung JUMLAH BARIS, bukan `SUM(quantity)`).
Kalau desain yang kamu mau sebenarnya "1 baris = banyak unit sekaligus
lewat kolom quantity", kabari saya supaya logic restock & dashboard-nya
disesuaikan.

## 12. Tabel `users` — konvensi asli yang berbeda dari asumsi awal

Sama seperti `master_assets`, tabel `users` yang sudah ada di project
kamu memakai konvensi sendiri (bukan skema "bersih" yang saya asumsikan
di awal). Semua konversi 2 arah ada di `app/utils/user_normalize.py`,
dipakai konsisten di `auth.py`, `users.py`, dan `deps.py`:

| Kolom DB | Nilai asli di DB | Nilai di API (dipakai frontend) |
|---|---|---|
| `role` | teks `"Superuser"` / `"Admin"` / `"Staff"` (bebas huruf besar-kecil, nilai lain dianggap `"Staff"`) | `"superuser"` / `"admin"` / `"user"` |
| `status` | angka `1` (approved/aktif) / `0` (pending) | `"approved"` / `"pending"` |
| `phone` | angka (kolom BIGINT) | teks bebas |

**Soal kolom `phone`**: karena tipenya angka di database, nomor yang
diawali `"0"` (umum di nomor HP Indonesia) akan **kehilangan angka 0
di depan** setelah disimpan (`"0852..."` jadi cuma `852...`). Ini
keterbatasan tipe kolom, bukan bug di kode. Solusi permanen kalau ini
masalah buat kamu:

```sql
ALTER TABLE users ALTER COLUMN phone TYPE TEXT;
```

Setelah kolomnya jadi TEXT, backend otomatis tetap jalan normal tanpa
perlu ubah kode apa pun lagi (kode di `phone_to_db()` cuma
membersihkan karakter non-digit sebelum simpan — begitu kolomnya TEXT,
Postgres tidak lagi memotong angka 0 di depan).

Kalau nanti muncul lagi error `pydantic_core.ValidationError` yang
mirip (field tertentu "Input should be ..."), itu tandanya ada kolom
lain di tabel `users` yang juga polanya beda dari asumsi — kirim saja
pesan error lengkapnya, nanti saya sesuaikan lagi di
`user_normalize.py` (satu tempat, tidak perlu ubah router manapun).

## 13. Catatan tentang filter laporan PDF

Karena tiap kategori aset punya nama kolom "status" yang sedikit
berbeda (PC pakai `condition`, kategori lain pakai `status`, kode lama
menyebutnya `action`), endpoint `/api/reports/generate` mencocokkan
filter `action`/`condition` secara longgar ke `status`, `condition`,
**atau** `action`, mana pun yang ada di data aset tsb. Parameter
`category` boleh berupa nama kategori gabungan (mis. `Storage
Management`), nama resource tunggal (mis. `pcAssets`), atau label
(mis. `SSD`).

## 14. Perhitungan kartu Dashboard (Low Stock / Device in Use / PC & Workstation)

Semua logika ini ada di `app/routers/dashboard.py`, dibantu
`app/utils/status.py`. Poin penting supaya angkanya akurat:

- **Device in Use** hanya menghitung field `status` bernilai "IN USE"
  (atau variasi penulisannya: `in use`, `IN-USE`, `Active`, dst — sudah
  dinormalisasi case-insensitive). PC & Workstation sengaja **tidak**
  ikut dihitung di sini karena field-nya `condition` (Good/Broken),
  bukan status pemakaian.
- **Low Stock** (kartu ringkasan) menghitung semua aset berstatus
  "rusak/bermasalah" — dicek di field `status`, `condition`, **atau**
  `action`, jadi PC & Workstation dengan `condition: "Broken"` tetap
  ikut terhitung.
- **PC & Workstation** murni menghitung jumlah baris `resource ==
  "pcAssets"`, tidak bergantung status.
- **Low Stock Alert** (daftar di bagian bawah dashboard) beda konsep:
  ini menghitung kategori yang JUMLAH UNITNYA menipis (`< 5` unit,
  atur di `LOW_STOCK_THRESHOLD`), bukan soal rusak/tidaknya.

Jika angka kartu tetap 0 padahal data sudah banyak, kemungkinan
penyebabnya:
1. Data dimasukkan langsung lewat SQL/Supabase Table Editor (bukan
   lewat aplikasi) — **Recent Activities** memang hanya tercatat saat
   aksi lewat API (create/update/delete/import/restock), bukan lewat
   insert manual ke database.
2. Kolom `action`/`condition` pada baris tsb memang kosong (null) —
   cek langsung datanya di Supabase Table Editor, tabel `master_assets`.
3. Pasangan `category`/`sub_category` baris tsb tidak cocok dengan
   `RESOURCE_TABLE_MAP` (lihat bagian 11) — baris itu jadi tidak
   "dikenali" masuk resource mana pun, sehingga tidak ikut terhitung
   sama sekali (bukan cuma status-nya yang salah).

