import { newId, nowIso, todayLocal } from './helpers';
import { todayWorkout } from '../data/workout';

/**
 * Rencana latihan hari ini — daftar gerakan yang MAU dikerjakan, terpisah dari
 * `workoutLogs.js` yang mencatat apa yang SUDAH dikerjakan.
 *
 * Pemisahan ini yang membuat "Tambahkan gerakan" punya arti: menambah gerakan
 * mengubah rencana, bukan langsung mencatat latihan. Sebelumnya rencana hanya
 * konstanta di `src/data/workout.js`, jadi satu-satunya yang bisa dilakukan
 * tombol itu adalah membuka sesi latihan.
 *
 * Rencana dikunci per tanggal. Hari pertama sebuah tanggal dibuka, rencana
 * bawaan disalin ke sini sekali (`ensureTodayPlan`); sesudah itu tabel inilah
 * sumber kebenarannya — termasuk kalau pengguna mengosongkannya sama sekali.
 */

const COLUMNS = `id, user_id, planned_on, exercise_id, sets, reps, position`;

/** Bentuk baris database menjadi bentuk yang dipakai layar. */
function toPlanItem(row) {
  return {
    planId: row.id,
    exerciseId: row.exercise_id,
    sets: row.sets,
    reps: row.reps,
    position: row.position,
  };
}

/**
 * Menyalin rencana bawaan ke tanggal ini, sekali saja.
 *
 * Baris yang sudah dihapus IKUT dihitung: rencana yang sengaja dikosongkan
 * pengguna tidak boleh terisi ulang sendiri setiap kali layar dibuka.
 *
 * Tab Workout dan dashboard sama-sama memanggilnya saat fokus, jadi dua
 * penyemaian bisa saja beririsan. Yang menjaga bukan kunci transaksi,
 * melainkan INSERT OR IGNORE di atas indeks unik (pengguna, tanggal,
 * gerakan): penyemaian kedua tidak menghasilkan apa-apa, bukan baris kembar.
 */
export async function ensureTodayPlan(db, userId, plannedOn = todayLocal()) {
  // Tidak lagi melakukan auto-seed template default (Latihan Campuran).
  // Akun baru akan mulai dengan plan kosong.
  return;
}

/** Rencana hari ini, urut sesuai posisi. Tidak menyemai apa pun. */
export async function listPlan(db, userId, plannedOn = todayLocal()) {
  const rows = await db.getAllAsync(
    `SELECT ${COLUMNS} FROM workout_plan_exercises
      WHERE user_id = ? AND planned_on = ? AND deleted_at IS NULL
      ORDER BY position ASC`,
    [userId, plannedOn],
  );

  return rows.map(toPlanItem);
}

/** Jalur yang dipakai layar: semai kalau perlu, lalu baca. */
export async function getTodayPlan(db, userId, plannedOn = todayLocal()) {
  await ensureTodayPlan(db, userId, plannedOn);
  return listPlan(db, userId, plannedOn);
}

/** Mengosongkan rencana hari ini (soft delete semua barisnya). */
export async function clearTodayPlan(db, userId, plannedOn = todayLocal()) {
  const timestamp = nowIso();
  await db.runAsync(
    `UPDATE workout_plan_exercises
        SET deleted_at = ?, updated_at = ?, synced_at = NULL
      WHERE user_id = ? AND planned_on = ? AND deleted_at IS NULL`,
    [timestamp, timestamp, userId, plannedOn],
  );
}

/**
 * Menambahkan satu gerakan ke rencana hari ini.
 *
 * Selalu baris baru, tidak pernah menimpa yang sudah ada. Sejak migrasi V5
 * membuang indeks unik (pengguna, tanggal, gerakan), satu gerakan memang
 * boleh muncul dua kali dalam sehari — misalnya Shoulder Press di awal dan
 * di akhir sesi. Tiap salinan punya `id` sendiri, dan `id` itulah yang
 * dipakai layar untuk menghapus salinan tertentu.
 *
 * Dulu fungsi ini sebuah upsert `ON CONFLICT(user_id, planned_on,
 * exercise_id)`. Klausa itu menuntut UNIQUE constraint yang cocok, jadi
 * begitu V5 jalan SQLite menolaknya di tahap prepare dan menambah gerakan
 * gagal total — bukan cuma yang duplikat.
 */
export async function addPlanExercise(
  db,
  userId,
  { exerciseId, sets, reps },
  plannedOn = todayLocal(),
) {
  const timestamp = nowIso();

  const last = await db.getFirstAsync(
    `SELECT COALESCE(MAX(position), -1) AS last_position
       FROM workout_plan_exercises
      WHERE user_id = ? AND planned_on = ? AND deleted_at IS NULL`,
    [userId, plannedOn],
  );

  await db.runAsync(
    `INSERT INTO workout_plan_exercises
       (${COLUMNS}, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId(),
      userId,
      plannedOn,
      exerciseId,
      sets,
      reps,
      (last?.last_position ?? -1) + 1,
      timestamp,
    ],
  );
}

/**
 * Mengeluarkan SATU salinan gerakan dari rencana (soft delete, supaya ikut
 * tersinkron).
 *
 * Dikunci ke `planId`, bukan `exerciseId`: dengan gerakan ganda diizinkan,
 * menghapus berdasarkan gerakan akan menghapus semua salinannya sekaligus.
 */
export async function removePlanExercise(db, planId) {
  const timestamp = nowIso();

  await db.runAsync(
    `UPDATE workout_plan_exercises
        SET deleted_at = ?, updated_at = ?, synced_at = NULL
      WHERE id = ? AND deleted_at IS NULL`,
    [timestamp, timestamp, planId],
  );
}

/** Mengganti semua rencana hari ini dengan template (soft delete yang lama, insert yang baru). */
export async function replaceTodayPlanWithTemplate(
  db,
  userId,
  templateExercises,
  plannedOn = todayLocal(),
) {
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    // 1. Soft delete semua rencana hari ini
    await db.runAsync(
      `UPDATE workout_plan_exercises
          SET deleted_at = ?, updated_at = ?, synced_at = NULL
        WHERE user_id = ? AND planned_on = ? AND deleted_at IS NULL`,
      [timestamp, timestamp, userId, plannedOn]
    );

    // 2. Insert gerakan dari template
    for (let i = 0; i < templateExercises.length; i++) {
      const ex = templateExercises[i];
      await db.runAsync(
        `INSERT INTO workout_plan_exercises
           (id, user_id, planned_on, exercise_id, sets, reps, position, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(),
          userId,
          plannedOn,
          ex.exerciseId || ex.exercise_id,
          ex.sets,
          ex.reps,
          i,
          timestamp,
        ],
      );
    }
  });
}
