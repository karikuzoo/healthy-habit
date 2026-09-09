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

const SCHEMA_VERSION = 1;

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

  if (version === 0) {
    await db.execAsync(V1);
    version = 1;
  }

  // Migrasi berikutnya menyusul di sini:
  // if (version === 1) { await db.execAsync(V2); version = 2; }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
