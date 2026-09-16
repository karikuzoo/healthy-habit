import { newId, nowIso, todayLocal } from './helpers';

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
    [userId]
  );
}

export async function getTemplateExercises(db, templateId) {
  return await db.getAllAsync(
    `SELECT ${EXERCISE_COLUMNS} FROM workout_template_exercises
      WHERE template_id = ? AND deleted_at IS NULL
      ORDER BY position ASC`,
    [templateId]
  );
}

export async function saveTemplate(db, userId, name, exercises) {
  const timestamp = nowIso();
  const templateId = newId();

  await db.withTransactionAsync(async () => {
    // 1. Simpan template
    await db.runAsync(
      `INSERT INTO workout_templates (id, user_id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [templateId, userId, name, timestamp, timestamp]
    );

    // 2. Simpan semua gerakan di dalamnya
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await db.runAsync(
        `INSERT INTO workout_template_exercises 
         (id, template_id, exercise_id, sets, reps, position, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId(), templateId, ex.exerciseId, ex.sets, ex.reps, i, timestamp]
      );
    }
  });

  return templateId;
}

export async function deleteTemplate(db, userId, templateId) {
  const timestamp = nowIso();
  const today = todayLocal();
  
  await db.withTransactionAsync(async () => {
    // 1. Ambil ID gerakan dari template ini
    const exercises = await db.getAllAsync(
      `SELECT exercise_id FROM workout_template_exercises WHERE template_id = ? AND deleted_at IS NULL`,
      [templateId]
    );

    // 2. Hapus dari workout_templates
    await db.runAsync(
      `UPDATE workout_templates SET deleted_at = ?, updated_at = ?, synced_at = NULL
       WHERE id = ? AND user_id = ?`,
      [timestamp, timestamp, templateId, userId]
    );
    
    // 3. Hapus dari workout_template_exercises
    await db.runAsync(
      `UPDATE workout_template_exercises SET deleted_at = ?, updated_at = ?, synced_at = NULL
       WHERE template_id = ?`,
      [timestamp, timestamp, templateId]
    );

    // 4. Hapus juga gerakan-gerakan tersebut dari rencana hari ini
    if (exercises.length > 0) {
       const ids = exercises.map(ex => `'${ex.exercise_id}'`).join(',');
       await db.runAsync(
         `UPDATE workout_plan_exercises SET deleted_at = ?, updated_at = ?, synced_at = NULL
          WHERE user_id = ? AND planned_on = ? AND exercise_id IN (${ids}) AND deleted_at IS NULL`,
         [timestamp, timestamp, userId, today]
       );
    }
  });
}

export async function updateTemplate(db, templateId, name, exercises) {
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    // 1. Update nama template
    await db.runAsync(
      `UPDATE workout_templates SET name = ?, updated_at = ?, synced_at = NULL
       WHERE id = ?`,
      [name, timestamp, templateId]
    );

    // 2. Hapus semua gerakan lama
    await db.runAsync(
      `DELETE FROM workout_template_exercises WHERE template_id = ?`,
      [templateId]
    );

    // 3. Masukkan gerakan baru
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await db.runAsync(
        `INSERT INTO workout_template_exercises 
         (id, template_id, exercise_id, sets, reps, position, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId(), templateId, ex.exerciseId, ex.sets, ex.reps, i, timestamp]
      );
    }
  });
}
