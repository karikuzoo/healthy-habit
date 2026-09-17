import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestDb } from './helpers/db.mjs';
import { migrate } from '../src/db/schema.js';
import { listTemplates, saveTemplate } from '../src/db/workoutTemplates.js';
import {
  addPlanExercise,
  listPlan,
  replaceTodayPlanWithTemplate,
} from '../src/db/workoutPlan.js';

const HARI = '2026-09-17';
const BENCH = { exerciseId: 'bench-press', sets: 3, reps: '12 repetisi' };

/**
 * V10 — penambal tabrakan nomor V4.
 *
 * V4 pernah berarti dua hal berbeda di dua branch: `workout_templates` di
 * sini, ALTER kolom kata sandi di sana. Perangkat yang menjalankan versi
 * yang kedua berhenti di `user_version = 4` lalu lompat ke V5, sehingga
 * tabel template tidak pernah dibuat — dan baru ketahuan berbulan kemudian
 * sebagai "no such table: workout_templates" saat menyimpan latihan.
 *
 * Perangkat itu tidak bisa dibikin ulang dari nol lewat `migrate()` (dari nol
 * V4 selalu ikut jalan), jadi keadaannya ditiru dari sisi hasil: database
 * lengkap yang tabel templatenya tidak ada, dengan `user_version` sudah di
 * angka sebelum penambal.
 */

async function jadikanPerangkatTanpaTabelTemplate(db) {
  await db.execAsync(`
    DROP TABLE IF EXISTS workout_template_exercises;
    DROP TABLE IF EXISTS workout_templates;
    PRAGMA user_version = 9;
  `);
}

test('perangkat yang tidak pernah kebagian tabel template dipulihkan V10', async () => {
  const { db, userId, close } = await createTestDb();
  await jadikanPerangkatTanpaTabelTemplate(db);

  await assert.rejects(
    () => listTemplates(db, userId),
    /no such table: workout_templates/,
    'prasyarat: tanpa penambal, query template memang gagal',
  );

  await migrate(db);

  const id = await saveTemplate(db, userId, 'Dada', [
    { exerciseId: 'bench-press', sets: 3, reps: '12 repetisi' },
  ]);
  const daftar = await listTemplates(db, userId);

  assert.equal(daftar.length, 1);
  assert.equal(daftar[0].id, id);

  close();
});

test('V10 tidak menyentuh template yang sudah ada di perangkat sehat', async () => {
  const { db, userId, close } = await createTestDb();

  const id = await saveTemplate(db, userId, 'Punggung', [
    { exerciseId: 'pull-up', sets: 4, reps: '8 repetisi' },
  ]);

  // Memaksa migrate() menjalankan V10 sekali lagi di database yang lengkap.
  await db.execAsync('PRAGMA user_version = 9');
  await migrate(db);

  const daftar = await listTemplates(db, userId);
  assert.equal(daftar.length, 1, 'template lama tidak hilang');
  assert.equal(daftar[0].id, id);

  close();
});

/**
 * Angka 11 sengaja ditulis lugas, bukan diimpor dari schema.
 *
 * Menambah migrasi berarti uji ini ikut diubah — dan itu memang yang
 * diinginkan. Repo ini sudah dua kali kena nomor migrasi yang bentrok;
 * satu langkah yang memaksa penulisnya menyebut nomor barunya secara sadar
 * lebih berguna daripada uji yang ikut setuju dengan apa pun isinya.
 */
test('migrasi dari nol berhenti di versi yang diumumkan, dan berhenti di situ', async () => {
  const { db, close } = await createTestDb();

  assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 12);

  // Dijalankan lagi tidak boleh melakukan apa-apa: peluncuran kedua dan
  // seterusnya memanggil migrate() dengan database yang sudah lengkap.
  await migrate(db);
  assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 12);

  close();
});

/**
 * V11 — indeks unik rencana yang tidak ikut terbuang di sebagian perangkat.
 *
 * Ditemukan dari perangkat sungguhan, bukan dari membaca kode: sebuah HP yang
 * sudah di versi 10 masih menolak INSERT dengan "UNIQUE constraint failed"
 * pada (user_id, planned_on, exercise_id). Artinya V5 tidak jalan di sana.
 */

async function jadikanPerangkatDenganIndeksUnik(db) {
  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_plan_unique
      ON workout_plan_exercises(user_id, planned_on, exercise_id);
    PRAGMA user_version = 10;
  `);
}

test('perangkat yang masih memegang indeks unik dibebaskan V11', async () => {
  const { db, userId, close } = await createTestDb();
  await jadikanPerangkatDenganIndeksUnik(db);

  await addPlanExercise(db, userId, BENCH, HARI);
  await assert.rejects(
    () => addPlanExercise(db, userId, BENCH, HARI),
    /UNIQUE constraint failed/,
    'prasyarat: tanpa penambal, gerakan kedua memang ditolak',
  );

  await migrate(db);

  await addPlanExercise(db, userId, BENCH, HARI);
  assert.equal((await listPlan(db, userId, HARI)).length, 2);

  close();
});

test('Simpan latihan dua kali untuk gerakan yang sama tidak lagi gagal', async () => {
  const { db, userId, close } = await createTestDb();
  await jadikanPerangkatDenganIndeksUnik(db);
  await migrate(db);

  // Persis alur yang gagal di HP: Mulai latihan -> ... -> Simpan latihan,
  // dijalankan dua kali untuk gerakan yang sama pada hari yang sama.
  const isi = [{ exerciseId: 'bench-press', sets: 3, reps: '12 repetisi' }];
  await replaceTodayPlanWithTemplate(db, userId, isi, HARI);
  await replaceTodayPlanWithTemplate(db, userId, isi, HARI);

  const plan = await listPlan(db, userId, HARI);
  assert.equal(plan.length, 1, 'rencana lama diganti, bukan ditumpuk');
  assert.equal(plan[0].exerciseId, 'bench-press');

  close();
});

/**
 * V12 — kolom berat target dan tenggatnya.
 *
 * Yang diuji bukan cuma "kolomnya ada", melainkan bahwa langkahnya aman
 * diulang. ADD COLUMN tidak punya IF NOT EXISTS di SQLite, jadi kalau
 * pemeriksaannya salah, peluncuran kedua akan menggagalkan seluruh migrasi.
 */

test('V12 menambah kolom target dan aman dijalankan dua kali', async () => {
  const { db, userId, close } = await createTestDb();

  const kolom = await db.getAllAsync('PRAGMA table_info(users)');
  const nama = kolom.map((k) => k.name);
  assert.ok(nama.includes('target_weight_kg'));
  assert.ok(nama.includes('target_date'));

  await db.runAsync(
    'UPDATE users SET target_weight_kg = ?, target_date = ? WHERE id = ?',
    [72.5, '2026-12-31', userId],
  );

  // Dipaksa mengulang langkahnya di database yang kolomnya sudah ada.
  await db.execAsync('PRAGMA user_version = 11');
  await migrate(db);

  const row = await db.getFirstAsync(
    'SELECT target_weight_kg, target_date FROM users WHERE id = ?',
    [userId],
  );
  assert.equal(row.target_weight_kg, 72.5, 'nilai yang sudah ada tidak tersapu');
  assert.equal(row.target_date, '2026-12-31');

  close();
});
