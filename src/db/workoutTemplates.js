import { newId, nowIso } from "./helpers";
import { resolveExercise } from "../data/workout";
import { replaceTodayPlanWithTemplate } from "./workoutPlan";
import { updateUserRow } from "./users";

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

/**
 * Menghapus satu template.
 *
 * Kalau yang dihapus BUKAN template yang sedang aktif
 * (`users.active_template_id`), cukup hapus template ini beserta
 * gerakannya — rencana hari ini maupun template lain tidak disentuh sama
 * sekali (lihat catatan panjang di versi sebelumnya soal kenapa ini penting).
 *
 * Kalau yang dihapus ADALAH template aktif, rencana hari ini otomatis ikut
 * berubah: pindah ke template lain yang masih ada (yang paling baru
 * dibuat), atau ikut kosong kalau memang tidak ada template tersisa —
 * sesuai yang diminta pengguna.
 *
 * BATASAN yang perlu diketahui: `active_template_id` hanya berubah lewat
 * "Terapkan Template" (lihat `handleApplyTemplate` di `templates.jsx`) dan
 * fungsi ini. Kalau pengguna mengedit rencana hari ini secara manual
 * (tambah/hapus satu gerakan lewat layar lain) SETELAH menerapkan template,
 * `active_template_id` tetap menganggap template itu aktif — jadi
 * menghapus template itu nanti akan MENIMPA edit manual tadi dengan isi
 * template pengganti. Ini belum ditangani; kalau jadi masalah nyata,
 * `active_template_id` perlu ikut dikosongkan begitu ada edit manual di
 * luar "Terapkan Template".
 */
export async function deleteTemplate(db, userId, templateId) {
  const timestamp = nowIso();

  const user = await db.getFirstAsync(
    `SELECT active_template_id FROM users WHERE id = ?`,
    [userId],
  );
  const wasActive = user?.active_template_id === templateId;

  await db.withTransactionAsync(async () => {
    // 1. Hapus dari workout_templates
    await db.runAsync(
      `UPDATE workout_templates SET deleted_at = ?, updated_at = ?, synced_at = NULL
       WHERE id = ? AND user_id = ?`,
      [timestamp, timestamp, templateId, userId],
    );

    // 2. Hapus dari workout_template_exercises
    await db.runAsync(
      `UPDATE workout_template_exercises SET deleted_at = ?, updated_at = ?, synced_at = NULL
       WHERE template_id = ?`,
      [timestamp, timestamp, templateId],
    );
  });

  if (!wasActive) return { changed: false };

  // Template yang dihapus tadi ada template aktif -> rencana hari ini ikut
  // menyesuaikan. `listTemplates` sudah menyaring deleted_at IS NULL dan
  // sudah ORDER BY created_at DESC, jadi baris pertama otomatis kandidat
  // pengganti yang paling baru dibuat.
  const remaining = await listTemplates(db, userId);
  const replacement = remaining[0];

  if (replacement) {
    const exercises = await getTemplateExercises(db, replacement.id);
    await replaceTodayPlanWithTemplate(db, userId, exercises);
    await updateUserRow(db, userId, { activeTemplateId: replacement.id });
    return { changed: true, activeTemplateId: replacement.id };
  } else {
    // Tidak ada template tersisa -> rencana hari ini ikut kosong.
    // `replaceTodayPlanWithTemplate` dengan daftar kosong tetap menjalankan
    // langkah "soft-delete semua rencana hari ini"-nya, jadi aman dipakai
    // ulang di sini tanpa menduplikasi query.
    await replaceTodayPlanWithTemplate(db, userId, []);
    await updateUserRow(db, userId, { activeTemplateId: null });
    return { changed: true, activeTemplateId: null };
  }
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
