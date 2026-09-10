# Healthy Habit — Product Requirements Document

> Dokumen ini adalah acuan tunggal untuk requirement produk dan standar teknis
> Healthy Habit. Status setiap requirement ditandai eksplisit agar dokumen ini
> tidak berbeda dari kondisi kode.
>
> **Terakhir diperbarui:** 11 September 2026
> **Status produk:** pengembangan awal, belum dirilis

**Legenda status:** ✅ selesai · 🚧 sebagian · ⬜ belum dikerjakan · ❓ perlu keputusan

---

## 1. Ringkasan produk

Healthy Habit adalah aplikasi mobile pelacak kebiasaan sehat berbahasa
Indonesia. Aplikasi menyatukan empat aspek yang biasanya tersebar di beberapa
aplikasi berbeda — **latihan, nutrisi, tidur, dan langkah harian** — ke dalam
satu ritme harian, lalu meringkasnya menjadi satu skor harian.

Pembeda utamanya: target kalori dan makronutrien **dihitung dari data tubuh
pengguna** (BMR → TDEE → program), bukan angka seragam untuk semua orang.

### 1.1 Prinsip produk

1. **Mencatat harus lebih cepat daripada malas mencatat.** Setiap alur input
   maksimal 3 ketukan dari tab utamanya.
2. **Angka harus jujur dan dapat dijelaskan.** Tidak ada ringkasan yang
   berbeda dari data penyusunnya; setiap total dihitung, tidak ditulis tetap.
3. **Jalan tanpa internet.** Pencatatan tidak boleh bergantung pada koneksi.
4. **Satu bahasa.** Seluruh teks yang dilihat pengguna berbahasa Indonesia.

### 1.2 Yang belum diputuskan ❓

Bagian ini sengaja dibiarkan kosong karena merupakan keputusan pemilik produk,
bukan sesuatu yang bisa disimpulkan dari kode atau desain:

- Definisi pengguna sasaran yang lebih tajam (rentang usia, tingkat kebugaran)
- Metrik keberhasilan (retensi H+7, jumlah catatan per pengguna per hari, dst.)
- Model monetisasi — gratis, freemium, atau berlangganan
- Target tanggal rilis
- Kewajiban kepatuhan data kesehatan di yurisdiksi sasaran

---

## 2. Ruang lingkup

### 2.1 Termasuk

| Area | Cakupan |
|---|---|
| Onboarding | Registrasi 2 tahap, pengumpulan data tubuh & tujuan |
| Dashboard | Skor harian, langkah, ringkasan tidur/kalori/latihan |
| Nutrisi | Pencatatan makanan per waktu makan, target kalori & makro |
| Tidur | Durasi, kualitas, tren mingguan, pengingat waktu tidur |
| Latihan | Rencana harian, katalog gerakan per kategori, sesi latihan |
| Profil | Data tubuh, program aktif, pengaturan, keluar akun |

### 2.2 Tidak termasuk (di luar lingkup saat ini)

- Fitur sosial: teman, papan peringkat, berbagi ke media sosial
- Integrasi perangkat wearable (Google Fit, Apple Health, smartwatch)
- Pelatih/nutrisionis manusia di dalam aplikasi
- Pemindaian barcode makanan dan basis data makanan pihak ketiga
- Mode gelap — **dihapus** dari lingkup pada 8 Sep 2026
- Dukungan web dan tablet; fokus telepon potret saja

---

## 3. Requirement fungsional

### 3.1 Autentikasi & onboarding

| ID | Requirement | Status |
|---|---|---|
| AUTH-1 | Layar Welcome sebagai titik masuk pertama | ✅ |
| AUTH-2 | Masuk dengan email + kata sandi | 🚧 UI selesai, tanpa backend |
| AUTH-3 | Registrasi 2 tahap dengan indikator langkah | ✅ |
| AUTH-4 | Tahap 2 mengumpulkan aktivitas, tanggal lahir, jenis kelamin, tinggi, berat, tujuan | ✅ |
| AUTH-5 | Persetujuan Syarat Layanan & Kebijakan Privasi wajib dicentang | 🚧 UI selesai, belum memblokir lanjut |
| AUTH-6 | Masuk dengan Google | ⬜ |
| AUTH-7 | Lupa kata sandi | ⬜ |
| AUTH-8 | Keluar akun dengan konfirmasi | ✅ |
| AUTH-9 | Sesi bertahan setelah aplikasi ditutup | ⬜ status login masih di memori |
| AUTH-10 | Pemilih tanggal lahir | ⬜ butuh dependensi date picker |

**Aturan validasi** ❓ — belum ditetapkan. Perlu keputusan: panjang minimum
kata sandi, aturan format email, rentang wajar tinggi/berat, batas usia minimum.

### 3.2 Dashboard (Home)

| ID | Requirement | Status |
|---|---|---|
| HOME-1 | Sapaan sesuai waktu + nama depan pengguna | 🚧 teks "Selamat pagi" masih tetap |
| HOME-2 | Skor harian 0–100 dengan ring progres | ✅ dihitung dari tidur/nutrisi/latihan |
| HOME-3 | Kartu langkah: jumlah, target, persentase, sisa langkah | 🚧 angka masih contoh |
| HOME-4 | Ringkasan tidur, kalori, dan durasi latihan hari ini | ✅ ketiganya dari database |
| HOME-5 | Kartu rekomendasi harian | 🚧 teks masih tetap; kalimat skor sudah dinamis |

**HOME-2 — rumus skor harian** (ditetapkan 9 Sep 2026, lihat `src/lib/dailyScore.js`)

| Komponen | Bobot | Bentuk kurva |
|---|---|---|
| Tidur | 35% | Pita: penuh 7–9 jam, nol di ≤4 jam dan ≥12 jam |
| Nutrisi | 35% | Proporsional sampai target, lalu turun ke nol di 150% target |
| Latihan | 30% | Linear terhadap jumlah gerakan selesai |
| Langkah | 0% | Dikeluarkan — belum ada sumber data |

Tidur dinilai dengan pita karena tidur adalah peristiwa yang sudah selesai
saat dinilai; kekurangan tidak bisa "disusul". Kalori justru terakumulasi
sepanjang hari, jadi kekurangan di siang hari diberi kredit proporsional —
kalau dipakai pita, skor akan nol sepanjang hari lalu melompat di malam hari.
Kelebihan kalori tetap dihukum karena sudah terjadi dan tidak bisa dibatalkan.

Komponen tanpa data dinilai 0, bukan dikeluarkan dari perhitungan. Kalau
dikeluarkan lalu bobotnya dinormalkan ulang, pengguna yang baru mencatat
tidur saja bisa memperoleh 100 padahal harinya belum berjalan.

**Batasan yang diketahui:** skor tidak mengenal waktu. Asupan 60% target
menghasilkan pesan positif — wajar pada siang hari, menyesatkan pada malam
hari. Perlu keputusan ❓ apakah skor perlu sadar jam.

**HOME-3 perlu keputusan** ❓ — sumber data langkah. Tanpa integrasi
pedometer/wearable, langkah harus diinput manual atau fitur ini ditunda.

### 3.3 Nutrisi

| ID | Requirement | Status |
|---|---|---|
| NUT-1 | Total kalori harian vs target, dengan bar progres | ✅ |
| NUT-2 | Rincian protein/karbo/lemak vs target | ✅ |
| NUT-3 | Makanan dikelompokkan per waktu makan (Sarapan/Siang/Malam/Cemilan) | ✅ |
| NUT-4 | Total per waktu makan dihitung dari itemnya | ✅ |
| NUT-5 | Layar detail makanan: makro, gizi mikro, dampak ke kebutuhan harian | 🚧 makro & dampak ✅; gizi mikro belum ada di dataset |
| NUT-6 | Pencarian makanan | ✅ katalog 1.141 entri, pencarian tertunda 200 ms |
| NUT-7 | Menyimpan catatan makanan ke database | ✅ |
| NUT-8 | Mengubah & menghapus catatan makanan | 🚧 hapus via tekan-lama; ubah belum ada |
| NUT-9 | Pengaturan porsi mempengaruhi kalori & makro | ✅ ukuran saji & jumlah mengalikan angka |
| NUT-10 | Riwayat nutrisi per tanggal | ⬜ |
| NUT-11 | Menambahkan makanan sendiri ("makanan saya") | ✅ per 100 g, validasi fisik, ukuran saji kustom |
| NUT-12 | Mengoreksi nilai gizi makanan di katalog | ✅ diubah di tempat, sumber jadi "dikoreksi"; catatan lama tidak berubah |

**NUT-6 — sumber data** (ditetapkan 9 Sep 2026)

Katalog dibangun dari CSV gizi eksternal (1.346 baris, per 100 gram),
dikonversi lewat `scripts/build-food-catalog.mjs` menjadi
`src/data/foodCatalog.json` — **1.141 entri diterima, 205 dikarantina** ke
`scripts/food-catalog-review.json` untuk diperiksa manual.

Aturan penyaringan: kalori 0 atau di atas 900 per 100 g ditolak (di atas lemak
murni), total makro di atas 100 g per 100 g ditolak (hampir selalu titik desimal
tergeser), dan selisih kalori terhadap hitungan makro di atas 25% ditolak.
Ambang 25% dipilih, bukan lebih ketat, karena rumus 4/4/9 itu sendiri hanya
pendekatan — pada 15% entri yang benar seperti "Tahu" ikut terbuang.

Sumber ditandai `'dataset-eksternal'`, **bukan** `'tkpi-2017'`: pola isinya
sangat menyerupai TKPI ("Minyak Hati Hiu (Eulamia)", varietas beras spesifik),
tetapi asalnya tidak terbukti sehingga menandainya sebagai data Kemenkes akan
mengaku-aku asal yang tidak dapat dibuktikan.

**Perlu diputuskan** ❓ — lisensi CSV sumber belum terverifikasi. Untuk
keperluan belajar risikonya kecil; untuk rilis komersial asalnya harus
dipastikan lebih dahulu.

### 3.4 Tidur

| ID | Requirement | Status |
|---|---|---|
| SLEEP-1 | Durasi tidur dengan ring progres terhadap target 8 jam | ✅ |
| SLEEP-2 | Durasi dihitung dari jam tidur & bangun | ✅ |
| SLEEP-3 | Penilaian kualitas tidur (Nyenyak/Biasa/Buruk) | ✅ |
| SLEEP-4 | Tren mingguan berbentuk grafik batang | ✅ dari database, hari tanpa catatan tetap tampil |
| SLEEP-5 | Input manual jam tidur & bangun | ✅ format HH:MM dengan validasi |
| SLEEP-6 | Catatan opsional | ✅ |
| SLEEP-7 | Pengingat waktu tidur | 🚧 sakelar ada, notifikasi belum |
| SLEEP-8 | Menyimpan catatan tidur ke database | ✅ UPSERT, satu catatan per malam |

**SLEEP-7** butuh `expo-notifications` dan izin notifikasi; belum terpasang.

### 3.5 Latihan

| ID | Requirement | Status |
|---|---|---|
| WO-1 | Rencana latihan harian dengan ringkasan (kalori, jumlah gerakan, istirahat) | ✅ 7 gerakan, 28 menit, 184 kkal |
| WO-2 | Jumlah gerakan diturunkan dari daftar, bukan angka terpisah | ✅ |
| WO-3 | Katalog gerakan per kategori (Kaki, Dada, Punggung, Inti) | ✅ |
| WO-4 | Sesi latihan dengan penghitung waktu (play/pause/reset, berbasis jam dinding) | ✅ |
| WO-5 | Menandai set selesai | ✅ |
| WO-6 | Estimasi kalori terbakar | ✅ dari set selesai atau waktu berjalan, mana yang lebih besar |
| WO-7 | Menyimpan sesi latihan ke database | ✅ satu sesi per hari, gerakan sebagai baris anak |
| WO-8 | Menambahkan gerakan ke rencana hari ini | ⬜ hanya membuka katalog |
| WO-9 | Riwayat latihan | 🚧 data tersimpan per hari; layar riwayat belum ada |
| WO-10 | Gambar peraga gerakan | ✅ seluruh 19 gerakan, 2 foto (awal & akhir) dari free-exercise-db |

### 3.6 Profil

| ID | Requirement | Status |
|---|---|---|
| PROF-1 | Menampilkan nama, umur, berat, tinggi | ✅ |
| PROF-2 | Umur dihitung dari tanggal lahir | ✅ |
| PROF-3 | Memilih program aktif (Bulking/Maintenance/Cutting) | ✅ |
| PROF-4 | Target kalori & makro terhitung ulang saat program diganti | ✅ |
| PROF-5 | Mengubah data personal & target | ✅ |
| PROF-6 | Perubahan profil bertahan setelah aplikasi ditutup | ✅ |
| PROF-7 | Ganti satuan metrik/imperial | 🚧 nilai berubah, angka belum dikonversi |
| PROF-8 | Preferensi notifikasi | ⬜ |
| PROF-9 | Ganti foto profil | ⬜ butuh image picker |

---

## 4. Model data

### 4.1 Perhitungan target kalori

Ditetapkan pada 8 Sep 2026: target **dihitung**, tidak diambil dari tabel.

```
BMR   = 10·berat(kg) + 6,25·tinggi(cm) − 5·umur + (pria ? +5 : −161)   [Mifflin-St Jeor]
TDEE  = BMR × pengali aktivitas
Target = TDEE + selisih program
```

| Tingkat aktivitas | Pengali | | Program | Selisih | Protein/Karbo/Lemak |
|---|---|---|---|---|---|
| Jarang bergerak | 1,20 | | Bulking | +400 kkal | 25% / 50% / 25% |
| Aktivitas ringan | 1,375 | | Maintenance | 0 | 30% / 40% / 30% |
| Cukup aktif | 1,55 | | Cutting | −400 kkal | 40% / 35% / 25% |
| Aktif | 1,725 | | | | |
| Sangat aktif | 1,90 | | | | |

Protein & karbo dihitung 4 kkal/g, lemak 9 kkal/g.

> **Catatan penting:** angka yang tampil **sengaja berbeda** dari mockup
> (2.400 kkal, P150/C250/F80). Nilai mockup tidak bisa dihasilkan rumus apa pun
> untuk data tubuh pengguna contoh. Jangan "memperbaiki" angka agar cocok
> dengan mockup — itu mematikan rumusnya.

### 4.2 Arsitektur penyimpanan

Pola **local-first**: SQLite di perangkat sebagai sumber data untuk UI,
Postgres di server untuk akun dan sinkronisasi.

| Lapisan | Teknologi | Status |
|---|---|---|
| Lokal | SQLite via `expo-sqlite` | ✅ terpasang |
| Server | Postgres (rencana via Supabase) | ⬜ |
| Sinkronisasi | Dorong/tarik berbasis `synced_at` | ⬜ |
| Token auth | `expo-secure-store` | ⬜ |

### 4.3 Tabel

`users` · `food_logs` · `sleep_logs` · `workout_logs` ·
`workout_log_exercises` · `step_logs` · `foods` · `food_servings`

Katalog gerakan dan slot waktu makan tetap sebagai data referensi di kode
(`src/data/`). Katalog makanan pindah ke tabel `foods` sejak schema v2, karena
harus bisa dicari dan ditambahi oleh pengguna.

**Schema v2** (9 Sep 2026) menambahkan `foods` dan `food_servings`, plus empat
kolom pada `food_logs` (`food_id`, `serving_label`, `serving_grams`,
`quantity`). Gizi katalog disimpan per 100 gram mengikuti normalisasi TKPI dan
USDA. `food_logs.food_id` sengaja **tanpa** foreign key: dengan cascade,
merapikan katalog akan menghapus riwayat pengguna; tanpa cascade, katalog
tidak bisa dirapikan. Catatan harus bisa hidup lebih lama dari entri katalognya.

### 4.4 Pola kolom wajib — WAJIB untuk setiap tabel baru

| Kolom | Aturan | Alasan |
|---|---|---|
| `id` | `TEXT` berisi UUID yang dibuat di sisi client | Bukan `AUTOINCREMENT`. Baris yang dibuat offline di beberapa perangkat tidak boleh bertabrakan id-nya saat disinkronkan |
| `updated_at` | `TEXT` ISO 8601 UTC, wajib | Dasar resolusi konflik last-write-wins |
| `synced_at` | `TEXT` nullable | `NULL` berarti belum terkirim ke server; kolom ini sekaligus antrean sinkronisasi |
| `deleted_at` | `TEXT` nullable | Soft delete. Baris yang dihapus permanen tidak bisa diberitahukan ke perangkat lain |
| `user_id` | Referensi ke `users(id)` | Untuk semua tabel milik pengguna |
| `logged_on` | `TEXT` `'YYYY-MM-DD'` waktu **lokal** | Dipisah dari timestamp penuh agar query harian memakai index tanpa konversi zona waktu per baris. "Makan siang hari ini" ditentukan kalender pengguna, bukan UTC |

Setiap query pembacaan **wajib** menyertakan `WHERE deleted_at IS NULL`.

Migrasi schema dilacak `PRAGMA user_version` di `src/db/schema.js`, dijalankan
lewat prop `onInit` milik `SQLiteProvider`.

`PRAGMA foreign_keys = ON` dijalankan di setiap pembukaan database, di luar
pemeriksaan versi — pragma itu bersifat per-koneksi dan tidak tersimpan di
file (berbeda dari `journal_mode`), jadi menaruhnya di dalam skrip migrasi
akan membuat ON DELETE CASCADE mati pada peluncuran kedua.

---

## 5. Requirement non-fungsional

| ID | Requirement | Status |
|---|---|---|
| NFR-1 | Seluruh pencatatan berfungsi tanpa koneksi internet | ✅ |
| NFR-2 | Seluruh teks antarmuka berbahasa Indonesia | 🚧 judul bagian masih Inggris |
| NFR-3 | Format angka mengikuti locale Indonesia (`1.850`, bukan `1,850`) | ✅ |
| NFR-4 | Orientasi potret saja | ✅ |
| NFR-5 | Elemen interaktif punya `accessibilityRole` dan label | ✅ |
| NFR-6 | Sasaran ketuk minimal 44×44 pt | 🚧 belum diaudit |
| NFR-7 | Aman terhadap area notch/home indicator | ✅ via `Screen` |
| NFR-8 | Bar & ring progres tidak meluber saat data melebihi target | ✅ dijepit 0..1 |
| NFR-9 | Data kesehatan terenkripsi saat disimpan | ⬜ SQLCipher butuh prebuild |
| NFR-10 | Uji otomatis | ⬜ belum ada |

**Target performa** ❓ — belum ditetapkan. Perlu angka konkret untuk waktu
mulai dingin dan waktu render tab.

---

## 6. Standar rekayasa

### 6.1 Tumpukan teknologi

Versi dikunci oleh Expo SDK 57 — **jangan naikkan `react` atau
`react-native` melebihi versi yang ditetapkan SDK.**

| Paket | Versi |
|---|---|
| expo | ~57.0.20 |
| react-native | 0.86.3 |
| react / react-dom | 19.2.3 (eksak) |
| expo-router | ~57.0.19 |
| nativewind | ^4.2.6 |
| tailwindcss | ^3.4.19 (dev) |
| expo-sqlite | ~57.0.2 |

Sebelum menulis kode, baca dokumentasi berversi di
<https://docs.expo.dev/versions/v57.0.0/> — API Expo berubah antar SDK.

### 6.2 Struktur berkas

```
app/                  rute expo-router (berbasis struktur folder)
  (tabs)/             lima tab utama
src/components/       komponen UI bersama
src/context/          state lintas layar
src/data/             data referensi statis & fungsi turunannya
src/db/               schema, migrasi, repository
src/lib/              util murni
src/theme/            token warna & shadow
```

### 6.3 Standar penataan gaya

1. **Gunakan `className` NativeWind. Jangan `StyleSheet.create`.** Dilarang
   memakai nilai heksadesimal langsung di layar — pakai token.
2. **`style` hanya untuk yang tidak bisa dinyatakan sebagai class:** nilai
   dinamis (`width: ${persen}%`), shadow (`src/theme/shadows.js`), dan prop
   yang menuntut warna sungguhan (`tintColor`, `trackColor`, stroke SVG).
   Untuk kasus itu impor `colors` dari `src/theme/colors.js`.
3. **Satu sumber warna.** `src/theme/colors.js` dibaca `tailwind.config.js`,
   sehingga token yang sama tersedia sebagai class maupun nilai JavaScript.

### 6.4 Standar komponen

- Gunakan komponen bersama sebelum membuat markup baru:
  `Button` `Card` `Chip` `Field` `Loading` `MacroTiles` `ProgressBar`
  `ProgressRing` `Screen` `ScreenHeader` `Segmented` `SelectField`
  `StatTile` `StepProgress`
- Setiap layar dibungkus `<Screen>`; setiap layar stack memakai `<ScreenHeader>`
- Gunakan `Pressable`, bukan `TouchableOpacity`
- Umpan balik tekan lewat class `active:` (`active:opacity-80`)
- Ring dan lingkaran progres memakai `react-native-svg` — **jangan** meniru
  lingkaran dengan `borderColor` + `transform: rotate`; sudutnya tidak akurat
- Ekspor komponen sebagai named export, lalu daftarkan di
  `src/components/index.js`

### 6.5 Standar data & angka

1. **Ringkasan wajib dihitung, tidak ditulis tetap.** Total per waktu makan,
   jumlah gerakan, dan durasi tidur diturunkan dari data penyusunnya. Angka
   ringkasan yang ditulis manual pernah menjadi sumber bug nyata di proyek ini.
2. **Satu sumber untuk setiap fakta.** Durasi tidur dihitung dari jam tidur &
   bangun; umur dihitung dari tanggal lahir. Jangan menyimpan nilai turunan
   berdampingan dengan sumbernya.
3. **Format angka lewat `src/lib/format.js`**, jangan `toLocaleString`
   tersebar di layar.
4. **Tulis ke database dahulu, lalu jadikan hasil tulisan itu sebagai state**,
   sehingga UI tidak pernah menampilkan nilai yang gagal tersimpan.
5. Setiap penulisan yang diikuti navigasi **wajib** di-`await`.

### 6.6 Standar navigasi

- Rute ditemukan dari struktur folder; jangan daftarkan `Stack.Screen`
  satu per satu
- Rute statis menang atas rute dinamis (`workout/add` mengalahkan
  `workout/[category]`)
- **Hindari tabrakan rute:** berkas di `app/(tabs)/` dan folder bernama sama
  di `app/` memetakan ke URL yang sama
- Perpindahan karena status autentikasi lewat satu gerbang di
  `app/(tabs)/_layout.jsx`; jangan sebar `router.replace` di banyak layar

### 6.7 Perintah

Pada mesin pengembangan Windows saat ini, PowerShell memblokir `npx.ps1`.
Gunakan `npx.cmd`:

```bash
npx.cmd expo start
```

Verifikasi perubahan dengan membundel seluruh aplikasi:

```bash
npx.cmd expo export --platform android --output-dir ../tmp-export
```

---

## 7. Standar desain

### 7.1 Token warna

| Token | Nilai | Penggunaan |
|---|---|---|
| `brand` | `#2D6A4F` | Tombol utama, keadaan aktif, bar ringkasan |
| `brand-dark` | `#1B4332` | Kartu skor, penekanan teks |
| `brand-darker` | `#123524` | Teks di atas latar hijau muda |
| `brand-light` | `#40916C` | Ring progres di atas latar gelap |
| `brand-soft` | `#E8F1EB` | Kartu rekomendasi, tombol sekunder, lencana |
| `brand-softer` | `#F1F7F3` | Isian pilihan terpilih |
| `ink` | `#111827` | Teks utama |
| `ink-muted` | `#6B7280` | Teks sekunder |
| `ink-subtle` | `#9CA3AF` | Placeholder, ikon nonaktif |
| `surface` | `#FFFFFF` | Kartu |
| `surface-muted` | `#F6F8F7` | Latar layar |
| `surface-sunken` | `#F3F4F6` | Kotak dalam, track |
| `line` | `#E5E7EB` | Garis tepi, track progres |
| `line-soft` | `#F1F5F4` | Pemisah di dalam kartu |
| `macro-calories` | `#F97316` | Kalori |
| `macro-protein` | `#10B981` | Protein |
| `macro-carbs` | `#F59E0B` | Karbohidrat |
| `macro-fat` | `#3B82F6` | Lemak |
| `sleep` / `sleep-soft` | `#3B82F6` / `#E7F0FD` | Ring & grafik tidur |
| `steps` / `steps-soft` | `#F59E0B` / `#FDF0DC` | Progres langkah |
| `danger` / `danger-soft` | `#EF4444` / `#FEF2F2` | Aksi merusak |

Warna makro **wajib** konsisten di seluruh aplikasi — protein selalu hijau,
karbo selalu kuning, lemak selalu biru.

### 7.2 Tipografi

Memakai skala Tailwind bawaan, ditambah ukuran khusus:

| Class | Ukuran | Penggunaan |
|---|---|---|
| `text-2xs` | 10px | Label huruf besar berspasi lebar |
| `text-3xl` | 30px | Judul layar |
| `text-stat` | 32px | Angka statistik besar |
| `text-score` | 40px | Skor harian |
| `text-timer` | 64px | Penghitung waktu sesi latihan |

### 7.3 Tata letak

- Padding tepi layar: `px-5`
- Jarak antar bagian: `gap-5`
- Sudut kartu: `rounded-2xl` (16px); `rounded-card` (20px) untuk kartu penekanan
- Tinggi input & tombol: `h-14`
- Bayangan kartu lewat komponen `<Card>`, jangan didefinisikan ulang

---

## 8. Status & rencana berikutnya

### 8.1 Sudah selesai

- 16 rute, 14 komponen bersama, token desain tunggal
- Target kalori & makro terhitung dari data tubuh
- SQLite terpasang dengan schema siap-sinkron; profil sudah persisten

### 8.2 Roadmap

Lapisan data lokal sudah lengkap — nutrisi, tidur, dan latihan semuanya di
SQLite, dan dashboard menghitung dari data nyata. Yang tersisa dikelompokkan
menurut apa yang menghalanginya.

**Butuh keputusan atau aset dari pemilik produk lebih dulu** ❓

| Item | Penghalang |
|---|---|
| Auth & sinkronisasi (AUTH-2, AUTH-6, AUTH-9) | Perlu project Supabase; tidak bisa dibuat dari sisi pengembang |
| Lisensi katalog makanan | Asal CSV belum terverifikasi; wajib dipastikan sebelum rilis komersial |
| HOME-3 langkah kaki | Belum ada sumber data. Tanpa pedometer, harus input manual atau ditunda |
| PROF-9 foto profil | Butuh image picker |
| AUTH-10 tanggal lahir | Butuh dependensi date picker |

**Bisa dikerjakan sekarang, berdampak besar**

1. **Notifikasi pengingat tidur** (SLEEP-7) — sakelarnya sudah ada tapi belum
   berbunyi; butuh `expo-notifications` dan izin notifikasi
2. **Riwayat per tanggal** (NUT-10, WO-9) — datanya sudah tersimpan lengkap
   dengan `logged_on`, yang belum hanya layarnya
3. **Ubah catatan makanan** (NUT-8) — hapus sudah bisa, ubah belum

**Perbaikan kecil**

4. **HOME-1** sapaan mengikuti jam, bukan "Selamat pagi" tetap
5. **HOME-5** kartu rekomendasi masih teks tetap
6. **AUTH-5** centang syarat layanan belum memblokir tombol lanjut
7. **PROF-7** ganti satuan baru mengubah label, angkanya belum dikonversi
8. **WO-8** "Tambahkan gerakan" baru membuka katalog, belum menambah ke rencana
9. **NUT-5** mikronutrien belum ada di dataset katalog

### 8.3 Utang teknis

| Hal | Catatan |
|---|---|
| `@react-native-async-storage/async-storage` | Terpasang, tidak dipakai. `expo-sqlite/kv-store` adalah pengganti langsungnya — dependensi ini bisa dibuang |
| `expo-haptics`, `expo-linear-gradient` | Terpasang, tidak dipakai. Buang atau gunakan |
| Seluruh gambar | Masih placeholder ikon; belum ada aset foto |
| Data contoh | `seedDemoDayIfEmpty` & `seedDemoWeekIfEmpty` masih menyemai hari/minggu contoh pada peluncuran pertama; hapus bila tidak diperlukan lagi |
| Judul bagian berbahasa Inggris | "Active Program", "Settings", "Weekly Trend" — perlu keputusan: terjemahkan atau pertahankan |
| Konversi satuan | PROF-7 mengubah label saja, angka belum dikonversi |
| Tanpa uji otomatis | Verifikasi saat ini bersandar pada keberhasilan bundling |

---

## 9. Riwayat keputusan

| Tanggal | Keputusan | Alasan |
|---|---|---|
| 8 Sep 2026 | Seluruh gaya memakai NativeWind, `StyleSheet` ditinggalkan | Nilai heksadesimal terduplikasi ~40 kali; token menjadi satu sumber |
| 8 Sep 2026 | Target kalori dihitung dari BMR, bukan tabel statis | Membuat data onboarding benar-benar berpengaruh |
| 8 Sep 2026 | Mode gelap dihapus dari lingkup | Sakelarnya tidak pernah mengubah tema |
| 8 Sep 2026 | Arsitektur data local-first: SQLite + Postgres | Pencatatan harus jalan offline; server untuk akun & backup |
| 8 Sep 2026 | `react-dom` dipin ke 19.2.3 | Menyamakan dengan pin `react` milik Expo SDK 57 |
