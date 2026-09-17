import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestDb } from './helpers/db.mjs';
import {
  addPlanExercise,
  clearTodayPlan,
  listPlan,
  removePlanExercise,
} from '../src/db/workoutPlan.js';

/**
 * Rencana latihan harian setelah migrasi V5 membuang indeks unik
 * (pengguna, tanggal, gerakan).
 *
 * Uji pertama adalah uji regresi: selama `addPlanExercise` masih memakai
 * `ON CONFLICT(user_id, planned_on, exercise_id)`, SQLite menolaknya di tahap
 * prepare begitu V5 jalan, dan "Tambahkan gerakan" mati total — bukan cuma
 * untuk gerakan yang duplikat.
 */

const HARI = '2026-09-17';
const RESEP = { exerciseId: 'push-up', sets: 3, reps: '12 repetisi' };

test('menambah gerakan berhasil meski indeks unik sudah dibuang V5', async () => {
  const { db, userId, close } = await createTestDb();

  await addPlanExercise(db, userId, RESEP, HARI);

  const plan = await listPlan(db, userId, HARI);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].exerciseId, 'push-up');
  assert.equal(plan[0].sets, 3);

  close();
});

test('gerakan yang sama boleh muncul dua kali, masing-masing baris sendiri', async () => {
  const { db, userId, close } = await createTestDb();

  await addPlanExercise(db, userId, RESEP, HARI);
  await addPlanExercise(db, userId, { ...RESEP, sets: 4 }, HARI);

  const plan = await listPlan(db, userId, HARI);
  assert.equal(plan.length, 2);
  assert.notEqual(plan[0].planId, plan[1].planId);
  assert.deepEqual(
    plan.map((item) => item.position),
    [0, 1],
    'salinan kedua masuk ke urutan paling bawah',
  );
  assert.deepEqual(plan.map((item) => item.sets), [3, 4]);

  close();
});

test('menghapus satu salinan tidak ikut menghapus salinan lainnya', async () => {
  const { db, userId, close } = await createTestDb();

  await addPlanExercise(db, userId, RESEP, HARI);
  await addPlanExercise(db, userId, { ...RESEP, sets: 4 }, HARI);

  const [pertama] = await listPlan(db, userId, HARI);
  await removePlanExercise(db, pertama.planId);

  const sisa = await listPlan(db, userId, HARI);
  assert.equal(sisa.length, 1);
  assert.equal(sisa[0].sets, 4, 'yang tersisa adalah salinan kedua');

  close();
});

test('gerakan yang dihapus lalu ditambahkan lagi jadi baris baru di urutan bawah', async () => {
  const { db, userId, close } = await createTestDb();

  await addPlanExercise(db, userId, { exerciseId: 'plank', sets: 3, reps: '30 detik' }, HARI);
  await addPlanExercise(db, userId, RESEP, HARI);

  const plan = await listPlan(db, userId, HARI);
  const plank = plan.find((item) => item.exerciseId === 'plank');
  await removePlanExercise(db, plank.planId);

  await addPlanExercise(db, userId, { exerciseId: 'plank', sets: 5, reps: '45 detik' }, HARI);

  const sesudah = await listPlan(db, userId, HARI);
  assert.deepEqual(
    sesudah.map((item) => item.exerciseId),
    ['push-up', 'plank'],
  );
  assert.notEqual(sesudah[1].planId, plank.planId, 'baris baru, bukan baris lama yang dihidupkan');

  close();
});

test('rencana hari lain tidak ikut terpengaruh', async () => {
  const { db, userId, close } = await createTestDb();

  await addPlanExercise(db, userId, RESEP, HARI);
  await addPlanExercise(db, userId, RESEP, '2026-09-18');

  await clearTodayPlan(db, userId, HARI);

  assert.equal((await listPlan(db, userId, HARI)).length, 0);
  assert.equal((await listPlan(db, userId, '2026-09-18')).length, 1);

  close();
});
