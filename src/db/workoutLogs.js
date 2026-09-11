import { newId, nowIso, todayLocal } from "./helpers";

/**
 * Pencatatan latihan memakai dua tabel:
 *
 * - `workout_logs`          satu sesi per hari (durasi & kalori terakumulasi)
 * - `workout_log_exercises` satu baris per gerakan di dalam sesi itu
 *
 * Keduanya ditulis dalam satu transaksi, jadi tidak mungkin ada sesi tanpa
 * gerakan atau gerakan tanpa induk sesi.
 *
 * Catatan: schema tidak memasang unique index pada kedua tabel ini (berbeda
 * dari `sleep_logs`), jadi pola tulisnya cari-dulu-lalu-insert-atau-update,
 * bukan UPSERT. Itu disengaja supaya nanti tetap terbuka kemungkinan lebih
 * dari satu sesi per hari tanpa perlu migrasi.
 */

/** Sesi hari ini, atau null kalau belum ada. */
export async function getTodaySession(db, userId, loggedOn = todayLocal()) {
  return db.getFirstAsync(
    `SELECT * FROM workout_logs
      WHERE user_id = ? AND logged_on = ? AND deleted_at IS NULL
      ORDER BY started_at ASC LIMIT 1`,
    [userId, loggedOn],
  );
}

/** Gerakan yang sudah tercatat hari ini, dipetakan exerciseId -> jumlah set. */
export async function listTodayExercises(db, userId, loggedOn = todayLocal()) {
  const rows = await db.getAllAsync(
    `SELECT e.exercise_id, e.sets_completed, e.sets_planned
       FROM workout_log_exercises e
       JOIN workout_logs w ON w.id = e.workout_log_id
      WHERE w.user_id = ? AND w.logged_on = ?
        AND w.deleted_at IS NULL AND e.deleted_at IS NULL`,
    [userId, loggedOn],
  );

  return new Map(
    rows.map((row) => [
      row.exercise_id,
      { setsCompleted: row.sets_completed, setsPlanned: row.sets_planned },
    ]),
  );
}

/** Ringkasan sesi hari ini untuk dashboard dan tab Workout. */
export async function daySummary(db, userId, loggedOn = todayLocal()) {
  const row = await db.getFirstAsync(
    `SELECT COALESCE(SUM(w.duration_seconds), 0) AS duration_seconds,
            COALESCE(SUM(w.calories), 0)         AS calories
       FROM workout_logs w
      WHERE w.user_id = ? AND w.logged_on = ? AND w.deleted_at IS NULL`,
    [userId, loggedOn],
  );

  const { total } = await db.getFirstAsync(
    `SELECT COUNT(*) AS total
       FROM workout_log_exercises e
       JOIN workout_logs w ON w.id = e.workout_log_id
      WHERE w.user_id = ? AND w.logged_on = ?
        AND w.deleted_at IS NULL AND e.deleted_at IS NULL
        AND e.sets_completed > 0`,
    [userId, loggedOn],
  );

  return {
    durationSeconds: Math.round(row.duration_seconds),
    durationMinutes: Math.round(row.duration_seconds / 60),
    calories: Math.round(row.calories),
    exercisesDone: total,
  };
}

/**
 * Ringkasan latihan per tanggal, hari terbaru lebih dulu.
 *
 * "Gerakan selesai" dihitung dengan definisi yang SAMA seperti
 * `daySummary` — baris dengan `sets_completed > 0`. Kalau kedua layar
 * memakai definisi berbeda, hari yang sama akan menyebut angka berbeda di
 * ringkasan hari ini dan di riwayat.
 *
 * Jumlah gerakan diambil lewat subquery, bukan JOIN, karena menggabungkan
 * baris anak lebih dulu akan menggandakan `duration_seconds` dan
 * `calories` sebanyak jumlah gerakannya saat dijumlahkan.
 */
export async function sessionHistory(db, userId, limit = 60) {
  const rows = await db.getAllAsync(
    `SELECT w.logged_on,
            COALESCE(SUM(w.duration_seconds), 0) AS duration_seconds,
            COALESCE(SUM(w.calories), 0)         AS calories,
            (SELECT COUNT(*)
               FROM workout_log_exercises e
               JOIN workout_logs x ON x.id = e.workout_log_id
              WHERE x.user_id = w.user_id AND x.logged_on = w.logged_on
                AND x.deleted_at IS NULL AND e.deleted_at IS NULL
                AND e.sets_completed > 0) AS exercises_done
       FROM workout_logs w
      WHERE w.user_id = ? AND w.deleted_at IS NULL
      GROUP BY w.logged_on
      ORDER BY w.logged_on DESC
      LIMIT ?`,
    [userId, limit],
  );

  return rows
    .map((row) => ({
      loggedOn: row.logged_on,
      durationSeconds: Math.round(row.duration_seconds),
      durationMinutes: Math.round(row.duration_seconds / 60),
      calories: Math.round(row.calories),
      exercisesDone: row.exercises_done,
    }))
    // Sesi yang seluruh gerakannya sudah dihapus menyisakan baris induk
    // kosong; itu bukan hari latihan dan tidak perlu muncul di riwayat.
    .filter((day) => day.exercisesDone > 0);
}

/**
 * Gerakan yang tercatat pada satu tanggal, urut sesuai posisinya di rencana.
 *
 * Berbeda dari `listTodayExercises` yang hanya memetakan jumlah set: layar
 * riwayat perlu NAMA gerakannya juga, dan nama itu diambil dari baris log —
 * bukan dari katalog. Catatan latihan harus tetap terbaca meski gerakannya
 * kelak dihapus dari katalog.
 */
export async function listExercisesForDay(db, userId, loggedOn = todayLocal()) {
  const rows = await db.getAllAsync(
    `SELECT e.exercise_id, e.name, e.sets_planned, e.sets_completed, e.reps
       FROM workout_log_exercises e
       JOIN workout_logs w ON w.id = e.workout_log_id
      WHERE w.user_id = ? AND w.logged_on = ?
        AND w.deleted_at IS NULL AND e.deleted_at IS NULL
        AND e.sets_completed > 0
      ORDER BY e.position ASC`,
    [userId, loggedOn],
  );

  return rows.map((row) => ({
    exerciseId: row.exercise_id,
    name: row.name,
    setsPlanned: row.sets_planned,
    setsCompleted: row.sets_completed,
    reps: row.reps,
  }));
}

export async function deleteTodayExercise(
  db,
  userId,
  exerciseId,
  loggedOn = todayLocal(),
) {
  const timestamp = nowIso();

  // Cari dulu sesi hari ini milik user
  const session = await getTodaySession(db, userId, loggedOn);
  if (!session) return;

  // Set deleted_at pada gerakan terkait di dalam tabel workout_log_exercises
  await db.runAsync(
    `UPDATE workout_log_exercises
        SET deleted_at = ?, updated_at = ?, synced_at = NULL
      WHERE workout_log_id = ? AND exercise_id = ? AND deleted_at IS NULL`,
    [timestamp, timestamp, session.id, exerciseId],
  );
}

/**
 * Menyimpan hasil satu gerakan ke sesi hari ini.
 *
 * `durationSeconds` dan `calories` DITAMBAHKAN ke total sesi, sedangkan
 * `setsCompleted` diambil nilai terbesar antara yang lama dan yang baru —
 * supaya mengulang gerakan yang sama tidak pernah membuat progres mundur.
 */
export async function logExerciseSession(
  db,
  userId,
  entry,
  loggedOn = todayLocal(),
) {
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    let session = await getTodaySession(db, userId, loggedOn);

    if (session) {
      await db.runAsync(
        `UPDATE workout_logs
            SET ended_at = ?,
                duration_seconds = duration_seconds + ?,
                calories = calories + ?,
                updated_at = ?,
                synced_at = NULL
          WHERE id = ?`,
        [
          timestamp,
          entry.durationSeconds,
          entry.calories,
          timestamp,
          session.id,
        ],
      );
    } else {
      const sessionId = newId();
      await db.runAsync(
        `INSERT INTO workout_logs
           (id, user_id, logged_on, started_at, ended_at, duration_seconds, calories, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          userId,
          loggedOn,
          timestamp,
          timestamp,
          entry.durationSeconds,
          entry.calories,
          timestamp,
        ],
      );
      session = { id: sessionId };
    }

    const existing = await db.getFirstAsync(
      `SELECT id, sets_completed FROM workout_log_exercises
        WHERE workout_log_id = ? AND exercise_id = ? AND deleted_at IS NULL`,
      [session.id, entry.exerciseId],
    );

    if (existing) {
      await db.runAsync(
        `UPDATE workout_log_exercises
            SET sets_completed = ?, updated_at = ?, synced_at = NULL
          WHERE id = ?`,
        [
          Math.max(existing.sets_completed, entry.setsCompleted),
          timestamp,
          existing.id,
        ],
      );
    } else {
      await db.runAsync(
        `INSERT INTO workout_log_exercises
           (id, workout_log_id, exercise_id, name, sets_planned, sets_completed, reps, position, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(),
          session.id,
          entry.exerciseId,
          entry.name,
          entry.setsPlanned,
          entry.setsCompleted,
          entry.reps ?? null,
          entry.position ?? 0,
          timestamp,
        ],
      );
    }
  });
}

/** Jumlah set yang sudah tercatat untuk satu gerakan hari ini. */
export async function getExerciseProgress(
  db,
  userId,
  exerciseId,
  loggedOn = todayLocal(),
) {
  const row = await db.getFirstAsync(
    `SELECT e.sets_completed
       FROM workout_log_exercises e
       JOIN workout_logs w ON w.id = e.workout_log_id
      WHERE w.user_id = ? AND w.logged_on = ? AND e.exercise_id = ?
        AND w.deleted_at IS NULL AND e.deleted_at IS NULL`,
    [userId, loggedOn, exerciseId],
  );
  return row?.sets_completed ?? 0;
}
