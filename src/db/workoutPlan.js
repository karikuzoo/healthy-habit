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
  const seeded = await db.getFirstAsync(
    `SELECT COUNT(*) AS total FROM workout_plan_exercises
      WHERE user_id = ? AND planned_on = ?`,
    [userId, plannedOn],
  );
  if (seeded?.total > 0) return;

  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    for (const [index, item] of todayWorkout.plan.entries()) {
      await db.runAsync(
        `INSERT OR IGNORE INTO workout_plan_exercises
           (${COLUMNS}, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(),
          userId,
          plannedOn,
          item.id,
          item.sets,
          item.reps,
          index,
          timestamp,
        ],
      );
    }
  });
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

/** Satu gerakan pada rencana hari ini, atau null kalau tidak ada di rencana. */
export async function getPlanExercise(
  db,
  userId,
  exerciseId,
  plannedOn = todayLocal(),
) {
  const row = await db.getFirstAsync(
    `SELECT ${COLUMNS} FROM workout_plan_exercises
      WHERE user_id = ? AND planned_on = ? AND exercise_id = ?
        AND deleted_at IS NULL`,
    [userId, plannedOn, exerciseId],
  );

  return row ? toPlanItem(row) : null;
}

/**
 * Menambahkan gerakan ke rencana, atau mengubah resepnya kalau sudah ada.
 *
 * Satu fungsi untuk keduanya, bukan dua, karena dari sudut pandang pengguna
 * memang satu hal: "gerakan ini, sekian set, sekian repetisi". Menambahkan
 * gerakan yang sudah ada di rencana tidak menggandakannya — indeks unik
 * (user, tanggal, gerakan) membuat baris lamanya yang diperbarui.
 *
 * Gerakan yang pernah dihapus lalu ditambahkan lagi masuk ke urutan paling
 * bawah, sama seperti gerakan yang benar-benar baru.
 */
export async function savePlanExercise(
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
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, planned_on, exercise_id) DO UPDATE SET
       sets       = excluded.sets,
       reps       = excluded.reps,
       -- gerakan yang masih hidup tetap di tempatnya; yang dihapus lalu
       -- ditambahkan lagi pindah ke urutan paling bawah
       position   = CASE WHEN workout_plan_exercises.deleted_at IS NULL
                         THEN workout_plan_exercises.position
                         ELSE excluded.position END,
       deleted_at = NULL,
       updated_at = excluded.updated_at,
       synced_at  = NULL`,
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

/** Mengeluarkan gerakan dari rencana (soft delete, supaya ikut tersinkron). */
export async function removePlanExercise(
  db,
  userId,
  exerciseId,
  plannedOn = todayLocal(),
) {
  const timestamp = nowIso();

  await db.runAsync(
    `UPDATE workout_plan_exercises
        SET deleted_at = ?, updated_at = ?, synced_at = NULL
      WHERE user_id = ? AND planned_on = ? AND exercise_id = ?
        AND deleted_at IS NULL`,
    [timestamp, timestamp, userId, plannedOn, exerciseId],
  );
}
