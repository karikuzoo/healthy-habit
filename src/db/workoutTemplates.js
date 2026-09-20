import { newId, nowIso } from "./helpers";
import { resolveExercise } from "../data/workout";

const TEMPLATE_COLUMNS = `id, user_id, name, created_at, updated_at`;
const EXERCISE_COLUMNS = `id, template_id, exercise_id, sets, reps, position`;

export async function listTemplates(db, userId) {
  return await db.getAllAsync(
    `SELECT t.id, t.user_id, t.name, t.created_at, t.updated_at,
       (SELECT exercise_id FROM workout_template_exercises 
        WHERE template_id = t.id AND deleted_at IS NULL 
        ORDER BY position ASC LIMIT 1) as first_exercise_id
     FROM workout_templates t
     WHERE t.user_id = ? AND t.deleted_at IS NULL
     ORDER BY t.created_at DESC`,
    [userId],
  );
}

/**
 * Gerakan tersimpan di satu template, sudah DIGABUNG dengan katalog
 * (`resolveExercise`) supaya pemanggilnya langsung dapat `name` dan
 * `category` — bukan cuma `exercise_id` mentah dari tabelnya.
 *
 * Tabel `workout_template_exercises` sengaja cuma menyimpan `exercise_id` +
 * resep (`sets`/`reps`): nama, kategori, dan media gerakan bisa berubah di
 * katalog kapan saja, jadi tidak disalin ke baris database. Sebelumnya
 * fungsi ini mengembalikan baris mentah apa adanya — layar yang memakainya
 * (mis. edit template) jadi tidak tahu nama atau gambar gerakannya sama
 * sekali, karena kolom itu memang tidak pernah ada di tabelnya.
 *
 * `exercise_id` gerakan yang sudah dihapus dari katalog dilewati (bukan
 * error) — daripada menampilkan baris kosong yang membingungkan.
 */
export async function getTemplateExercises(db, templateId) {
  const rows = await db.getAllAsync(
    `SELECT ${EXERCISE_COLUMNS} FROM workout_template_exercises
      WHERE template_id = ? AND deleted_at IS NULL
      ORDER BY position ASC`,
    [templateId],
  );

  return rows
    .map((row) => {
      const exercise = resolveExercise(row.exercise_id, {
        sets: row.sets,
        reps: row.reps,
      });
      if (!exercise) return null;

      return {
        ...exercise,
        // Dobel exerciseId & id sengaja: beberapa pemanggil (mis.
        // replaceTodayPlanWithTemplate) membaca exerciseId, yang lain
        // membaca id — daripada harus menyamakan semua pemanggil sekaligus.
        exerciseId: exercise.id,
        templateExerciseId: row.id,
        position: row.position,
      };
    })
    .filter(Boolean);
}

export async function saveTemplate(db, userId, name, exercises) {
  const timestamp = nowIso();
  const templateId = newId();

  await db.withTransactionAsync(async () => {
    // 1. Simpan template
    await db.runAsync(
      `INSERT INTO workout_templates (id, user_id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [templateId, userId, name, timestamp, timestamp],
    );

    // 2. Simpan semua gerakan di dalamnya
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await db.runAsync(
        `INSERT INTO workout_template_exercises 
         (id, template_id, exercise_id, sets, reps, position, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId(), templateId, ex.exerciseId, ex.sets, ex.reps, i, timestamp],
      );
    }
  });

  return templateId;
}

export async function deleteTemplate(db, userId, templateId) {
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    // 1. Hapus dari workout_templates
    await db.runAsync(
      `UPDATE workout_templates SET deleted_at = ?, updated_at = ?, synced_at = NULL
       WHERE id = ? AND user_id = ?`,
      [timestamp, timestamp, templateId, userId],
    );

    // 2. Hapus dari workout_template_exercises
    //
    // SENGAJA berhenti di sini. Template hanyalah cetakan/preset — rencana
    // hari ini (workout_plan_exercises) sudah jadi salinan independen sejak
    // template-nya diterapkan. Sebelumnya fungsi ini juga menghapus gerakan
    // dari rencana hari ini berdasarkan kecocokan exercise_id, tanpa cek
    // apakah gerakan itu memang berasal dari template ini — akibatnya kalau
    // gerakan yang sama dipakai di template lain (dan template lain itu
    // masih ada), gerakan itu ikut hilang dari rencana hari ini juga.
    // Menghapus gerakan dari rencana yang aktif itu tugas layar
    // [category].jsx / review.jsx, bukan tugas menghapus template.
    await db.runAsync(
      `UPDATE workout_template_exercises SET deleted_at = ?, updated_at = ?, synced_at = NULL
       WHERE template_id = ?`,
      [timestamp, timestamp, templateId],
    );
  });
}

export async function updateTemplate(db, templateId, name, exercises) {
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    // 1. Update nama template
    await db.runAsync(
      `UPDATE workout_templates SET name = ?, updated_at = ?, synced_at = NULL
       WHERE id = ?`,
      [name, timestamp, templateId],
    );

    // 2. Hapus semua gerakan lama
    await db.runAsync(
      `DELETE FROM workout_template_exercises WHERE template_id = ?`,
      [templateId],
    );

    // 3. Masukkan gerakan baru
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await db.runAsync(
        `INSERT INTO workout_template_exercises 
         (id, template_id, exercise_id, sets, reps, position, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId(), templateId, ex.exerciseId, ex.sets, ex.reps, i, timestamp],
      );
    }
  });
}
