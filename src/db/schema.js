/**
 * Schema SQLite lokal, dirancang siap disinkronkan ke Postgres.
 *
 * Empat keputusan yang membuat sinkronisasi nanti tidak perlu migrasi besar:
 *
 * 1. Primary key TEXT berisi UUID, bukan INTEGER AUTOINCREMENT. Baris yang
 *    dibuat offline di dua HP berbeda tidak akan bertabrakan id-nya saat
 *    keduanya push ke server.
 * 2. `updated_at` (ISO 8601 UTC) di setiap tabel — dasar resolusi konflik
 *    last-write-wins.
 * 3. `synced_at` NULL berarti baris belum terkirim ke server. Kolom ini
 *    sekaligus berfungsi sebagai antrean sinkronisasi, jadi tidak perlu
 *    tabel queue terpisah.
 * 4. `deleted_at` untuk soft delete. Baris yang dihapus permanen tidak bisa
 *    diberitahukan ke server — device lain tidak akan pernah tahu.
 *
 * Kolom `logged_on` menyimpan tanggal lokal 'YYYY-MM-DD' terpisah dari
 * timestamp penuh, supaya query harian ("total kalori per hari") bisa
 * memakai index tanpa konversi zona waktu di setiap baris.
 */

export const DATABASE_NAME = 'healthyhabit.db';

const SCHEMA_VERSION = 3;

const V1 = `
PRAGMA journal_mode = 'wal';

CREATE TABLE users (
  id            TEXT PRIMARY KEY NOT NULL,
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  gender        TEXT NOT NULL DEFAULT 'Laki-Laki',
  birth_date    TEXT,
  height_cm     REAL,
  weight_kg     REAL,
  activity_level TEXT NOT NULL DEFAULT 'sedentary',
  program       TEXT NOT NULL DEFAULT 'maintenance',
  target_goal   TEXT NOT NULL DEFAULT '',
  units         TEXT NOT NULL DEFAULT 'metric',
  avatar_uri    TEXT,
  updated_at    TEXT NOT NULL,
  synced_at     TEXT,
  deleted_at    TEXT
);

CREATE TABLE food_logs (
  id          TEXT PRIMARY KEY NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_on   TEXT NOT NULL,
  logged_at   TEXT NOT NULL,
  meal_slot   TEXT NOT NULL,
  name        TEXT NOT NULL,
  portion     TEXT,
  weight_g    REAL,
  calories    REAL NOT NULL DEFAULT 0,
  protein_g   REAL NOT NULL DEFAULT 0,
  carbs_g     REAL NOT NULL DEFAULT 0,
  fat_g       REAL NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL,
  synced_at   TEXT,
  deleted_at  TEXT
);

CREATE TABLE sleep_logs (
  id               TEXT PRIMARY KEY NOT NULL,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_on        TEXT NOT NULL,
  bedtime          TEXT NOT NULL,
  wake_time        TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  quality          TEXT,
  notes            TEXT,
  updated_at       TEXT NOT NULL,
  synced_at        TEXT,
  deleted_at       TEXT
);

CREATE TABLE workout_logs (
  id               TEXT PRIMARY KEY NOT NULL,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_on        TEXT NOT NULL,
  started_at       TEXT NOT NULL,
  ended_at         TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  calories         REAL NOT NULL DEFAULT 0,
  updated_at       TEXT NOT NULL,
  synced_at        TEXT,
  deleted_at       TEXT
);

CREATE TABLE workout_log_exercises (
  id              TEXT PRIMARY KEY NOT NULL,
  workout_log_id  TEXT NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id     TEXT NOT NULL,
  name            TEXT NOT NULL,
  sets_planned    INTEGER NOT NULL DEFAULT 0,
  sets_completed  INTEGER NOT NULL DEFAULT 0,
  reps            TEXT,
  position        INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL,
  synced_at       TEXT,
  deleted_at      TEXT
);

CREATE TABLE step_logs (
  id          TEXT PRIMARY KEY NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_on   TEXT NOT NULL,
  steps       INTEGER NOT NULL DEFAULT 0,
  target      INTEGER NOT NULL DEFAULT 8000,
  updated_at  TEXT NOT NULL,
  synced_at   TEXT,
  deleted_at  TEXT
);

-- Satu catatan tidur & langkah per hari per user
CREATE UNIQUE INDEX idx_sleep_logs_unique ON sleep_logs(user_id, logged_on);
CREATE UNIQUE INDEX idx_step_logs_unique ON step_logs(user_id, logged_on);

-- Query harian per user (dashboard, tab Nutrition)
CREATE INDEX idx_food_logs_day ON food_logs(user_id, logged_on);
CREATE INDEX idx_workout_logs_day ON workout_logs(user_id, logged_on);
CREATE INDEX idx_workout_log_exercises_parent ON workout_log_exercises(workout_log_id);

-- Mencari baris yang belum tersinkron, dipakai layer sync nanti
CREATE INDEX idx_food_logs_unsynced ON food_logs(synced_at) WHERE synced_at IS NULL;
CREATE INDEX idx_sleep_logs_unsynced ON sleep_logs(synced_at) WHERE synced_at IS NULL;
CREATE INDEX idx_workout_logs_unsynced ON workout_logs(synced_at) WHERE synced_at IS NULL;
CREATE INDEX idx_step_logs_unsynced ON step_logs(synced_at) WHERE synced_at IS NULL;
`;

/**
 * V2 — katalog makanan dan ukuran sajinya.
 *
 * Gizi disimpan per 100 gram karena itu normalisasi yang dipakai TKPI maupun
 * USDA; kalau data resmi masuk kemudian, tidak ada konversi yang diperlukan.
 *
 * `food_servings` yang memungkinkan porsi mengubah angka: TKPI mencatat gizi
 * per 100 g, sementara pengguna mencatat "1 porsi". Tanpa berat per ukuran
 * saji, kolom porsi hanya bisa jadi teks.
 */
const V2 = `
CREATE TABLE foods (
  id             TEXT PRIMARY KEY NOT NULL,
  -- NULL = katalog bawaan (data referensi, tidak ikut sinkron per pengguna)
  -- terisi = "makanan saya" milik pengguna
  user_id        TEXT REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  name_search    TEXT NOT NULL,
  category       TEXT,

  -- gizi per 100 gram
  calories       REAL NOT NULL DEFAULT 0,
  protein_g      REAL NOT NULL DEFAULT 0,
  carbs_g        REAL NOT NULL DEFAULT 0,
  fat_g          REAL NOT NULL DEFAULT 0,
  fiber_g        REAL,
  sugar_g        REAL,
  sodium_mg      REAL,
  cholesterol_mg REAL,

  -- 'estimasi' | 'tkpi-2017' | 'usda' | 'dataset-eksternal'
  -- | 'pengguna' (dibuat pengguna) | 'dikoreksi' (entri katalog yang diubah pengguna)
  source         TEXT NOT NULL DEFAULT 'estimasi',
  updated_at     TEXT NOT NULL,
  synced_at      TEXT,
  deleted_at     TEXT
);

CREATE TABLE food_servings (
  id          TEXT PRIMARY KEY NOT NULL,
  food_id     TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  grams       REAL NOT NULL,
  is_default  INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL,
  synced_at   TEXT,
  deleted_at  TEXT
);

-- Catatan makanan boleh merujuk katalog, tapi salinan angkanya tetap tinggal
-- di baris log. Sengaja TANPA foreign key: dengan cascade, merapikan katalog
-- akan menghapus riwayat pengguna; tanpa cascade, katalog tidak bisa
-- dirapikan sama sekali. Log harus bisa hidup lebih lama dari entri katalog.
ALTER TABLE food_logs ADD COLUMN food_id       TEXT;
ALTER TABLE food_logs ADD COLUMN serving_label TEXT;
ALTER TABLE food_logs ADD COLUMN serving_grams REAL;
ALTER TABLE food_logs ADD COLUMN quantity      REAL;

-- Pencocokan nama persis, dipakai jalur peningkatan data (WHERE name_search = ?).
-- Pencarian pengguna memakai LIKE '%kata%' yang tidak bisa memanfaatkan index
-- ini — untuk ukuran katalog di bawah beberapa ribu baris, pemindaian tabel
-- masih di bawah satu milidetik.
CREATE INDEX idx_foods_search ON foods(name_search);
CREATE INDEX idx_foods_user ON foods(user_id);
CREATE INDEX idx_food_servings_parent ON food_servings(food_id);

CREATE INDEX idx_foods_unsynced ON foods(synced_at) WHERE synced_at IS NULL;
CREATE INDEX idx_food_servings_unsynced ON food_servings(synced_at) WHERE synced_at IS NULL;
`;

/**
 * V3 — rencana latihan harian yang bisa disunting pengguna.
 *
 * Sebelumnya rencana hari ini adalah konstanta di `src/data/workout.js`, jadi
 * menambah atau menghapus gerakan tidak punya tempat untuk disimpan: tombol
 * "Tambahkan gerakan" langsung membuka sesi latihan, dan gerakan yang dihapus
 * muncul lagi begitu layar dibuka ulang.
 *
 * `sets` dan `reps` ikut di tabel ini, bukan di katalog gerakan, karena
 * keduanya resep latihan milik pengguna — gerakan yang sama boleh 3×12 hari
 * ini dan 4×15 minggu depan. `reps` tetap TEXT supaya satu kolom bisa memuat
 * "12 repetisi" maupun "30 detik", sama seperti `workout_log_exercises.reps`.
 *
 * Rencana disimpan per tanggal (`planned_on`), sehingga rencana kemarin tetap
 * utuh dan hari baru dimulai lagi dari rencana bawaan.
 */
const V3 = `
CREATE TABLE workout_plan_exercises (
  id           TEXT PRIMARY KEY NOT NULL,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  planned_on   TEXT NOT NULL,
  exercise_id  TEXT NOT NULL,
  sets         INTEGER NOT NULL DEFAULT 3,
  reps         TEXT NOT NULL,
  position     INTEGER NOT NULL DEFAULT 0,
  updated_at   TEXT NOT NULL,
  synced_at    TEXT,
  deleted_at   TEXT
);

-- Satu baris per gerakan per hari. Menambahkan gerakan yang pernah dihapus
-- menghidupkan kembali baris lamanya, bukan menduplikasinya.
CREATE UNIQUE INDEX idx_workout_plan_unique
  ON workout_plan_exercises(user_id, planned_on, exercise_id);

CREATE INDEX idx_workout_plan_day ON workout_plan_exercises(user_id, planned_on);
CREATE INDEX idx_workout_plan_unsynced
  ON workout_plan_exercises(synced_at) WHERE synced_at IS NULL;
`;

/**
 * Dijalankan lewat prop `onInit` milik SQLiteProvider, sebelum children render.
 * Versi schema dilacak dengan `PRAGMA user_version`.
 */
export async function migrate(db) {
  /**
   * `foreign_keys` adalah setelan PER-KONEKSI dan tidak ikut tersimpan di
   * file database — berbeda dari `journal_mode`. Jadi harus dinyalakan
   * ulang setiap kali database dibuka, BUKAN sekali saat migrasi.
   *
   * Kalau ditaruh di dalam skrip V1, ON DELETE CASCADE akan diam-diam mati
   * pada peluncuran kedua dan seterusnya, karena migrasi dilewati.
   */
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  if (version >= SCHEMA_VERSION) return;

  // Setiap langkah berjalan berurutan, sehingga database lama ikut naik
  // versi tanpa perlu dipasang ulang.
  if (version === 0) {
    await db.execAsync(V1);
    version = 1;
  }

  if (version === 1) {
    await db.execAsync(V2);
    version = 2;
  }

  if (version === 2) {
    await db.execAsync(V3);
    version = 3;
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
