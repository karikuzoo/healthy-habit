import { newId, nowIso, todayLocal } from './helpers';

/**
 * Langkah harian (HOME-3).
 *
 * Ada DUA cara menulis, dan bedanya berasal dari sensornya — bukan dari
 * selera:
 *
 * - `setStepsForDay` MENIMPA. Dipakai di iOS, karena CoreMotion bisa ditanya
 *   "berapa langkah dari tengah malam sampai sekarang" dan jawabannya adalah
 *   total hari itu yang sebenarnya.
 * - `addSteps` MENAMBAH. Dipakai di Android, karena yang tersedia hanya
 *   `watchStepCount` — sensor melaporkan pertambahan sejak aplikasi
 *   berlangganan, bukan total harian. Menimpa dengan angka itu akan
 *   menghapus langkah yang sudah terkumpul sesi sebelumnya.
 *
 * Keduanya UPSERT di atas unique index (user_id, logged_on): satu baris per
 * hari, sama seperti `sleep_logs`.
 */

export const DEFAULT_STEP_TARGET = 8000;

/** Langkah satu hari. Hari yang belum ada barisnya dianggap nol, bukan null. */
export async function getStepsForDay(db, userId, loggedOn = todayLocal()) {
  const row = await db.getFirstAsync(
    `SELECT steps, target FROM step_logs
      WHERE user_id = ? AND logged_on = ? AND deleted_at IS NULL`,
    [userId, loggedOn],
  );

  return {
    steps: row?.steps ?? 0,
    target: row?.target ?? DEFAULT_STEP_TARGET,
  };
}

/** iOS: sensor tahu total hariannya, jadi angkanya ditimpa. */
export async function setStepsForDay(db, userId, steps, loggedOn = todayLocal()) {
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO step_logs (id, user_id, logged_on, steps, target, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, logged_on) DO UPDATE SET
       steps      = excluded.steps,
       updated_at = excluded.updated_at,
       synced_at  = NULL,
       deleted_at = NULL`,
    [newId(), userId, loggedOn, Math.round(steps), DEFAULT_STEP_TARGET, timestamp],
  );
}

/**
 * Android: sensor hanya melaporkan pertambahan, jadi ditambahkan.
 *
 * `target` pada klausa UPDATE sengaja tidak disentuh — kalau nanti pengguna
 * bisa mengubah targetnya, penambahan langkah tidak boleh mengembalikannya
 * ke nilai bawaan.
 */
export async function addSteps(db, userId, delta, loggedOn = todayLocal()) {
  if (!delta || delta <= 0) return;

  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO step_logs (id, user_id, logged_on, steps, target, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, logged_on) DO UPDATE SET
       steps      = step_logs.steps + excluded.steps,
       updated_at = excluded.updated_at,
       synced_at  = NULL,
       deleted_at = NULL`,
    [newId(), userId, loggedOn, Math.round(delta), DEFAULT_STEP_TARGET, timestamp],
  );
}
