import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestDb } from './helpers/db.mjs';
import {
  DEFAULT_STEP_TARGET,
  addSteps,
  getStepsForDay,
  setStepsForDay,
} from '../src/db/stepLogs.js';

/**
 * Langkah harian (HOME-3).
 *
 * Dua cara menulis, dan perbedaannya berasal dari batas sensor — bukan
 * selera. Uji ini mengunci perbedaan itu, karena menukar keduanya akan
 * menghapus langkah tanpa gejala yang terlihat di layar.
 */

const HARI = '2026-09-12';

test('hari tanpa baris dianggap nol, bukan null', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  const kosong = await getStepsForDay(db, userId, HARI);

  assert.equal(kosong.steps, 0);
  assert.equal(kosong.target, DEFAULT_STEP_TARGET, 'target bawaan tetap terisi');
});

test('addSteps MENGAKUMULASI antar sesi (jalur Android)', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  // Android hanya melaporkan pertambahan sejak aplikasi berlangganan. Kalau
  // ini menimpa, membuka aplikasi kedua kalinya akan menghapus langkah pagi.
  await addSteps(db, userId, 120, HARI);
  await addSteps(db, userId, 340, HARI);
  await addSteps(db, userId, 55, HARI);

  assert.equal((await getStepsForDay(db, userId, HARI)).steps, 515);
});

test('setStepsForDay MENIMPA (jalur iOS dan input manual)', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  // iOS tahu total harian sebenarnya, dan pengguna yang mengetik manual juga
  // memasukkan TOTAL — bukan tambahan. Menambahkan di sini akan menggandakan.
  await setStepsForDay(db, userId, 6248, HARI);
  await setStepsForDay(db, userId, 7000, HARI);

  assert.equal((await getStepsForDay(db, userId, HARI)).steps, 7000);
});

test('angka manual jadi dasar, lalu sensor menambah di atasnya', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  await setStepsForDay(db, userId, 6000, HARI);
  await addSteps(db, userId, 120, HARI);

  assert.equal((await getStepsForDay(db, userId, HARI)).steps, 6120);
});

test('menambah langkah tidak mengembalikan target yang sudah diubah', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  await addSteps(db, userId, 100, HARI);
  await db.runAsync('UPDATE step_logs SET target = ? WHERE user_id = ?', [12000, userId]);
  await addSteps(db, userId, 10, HARI);

  const row = await getStepsForDay(db, userId, HARI);
  assert.equal(row.target, 12000, 'target kustom harus bertahan');
  assert.equal(row.steps, 110);
});

test('baris yang pernah dihapus hidup lagi saat ditulis ulang', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  await addSteps(db, userId, 500, HARI);
  await db.runAsync('UPDATE step_logs SET deleted_at = ? WHERE user_id = ?', ['x', userId]);

  // Baris terhapus tidak terbaca...
  assert.equal((await getStepsForDay(db, userId, HARI)).steps, 0);

  // ...tapi menulis lagi menghidupkannya, bukan gagal karena unique index
  await addSteps(db, userId, 7, HARI);
  assert.equal((await getStepsForDay(db, userId, HARI)).steps, 507);
});

test('tetap satu baris per hari, dan hari lain tidak tercampur', async (t) => {
  const { db, userId, raw, close } = await createTestDb();
  t.after(close);

  await addSteps(db, userId, 100, HARI);
  await addSteps(db, userId, 200, HARI);
  await setStepsForDay(db, userId, 900, HARI);
  await addSteps(db, userId, 50, '2026-09-13');

  const { n } = raw.prepare('SELECT COUNT(*) AS n FROM step_logs').get();
  assert.equal(n, 2, 'satu baris per tanggal');

  assert.equal((await getStepsForDay(db, userId, HARI)).steps, 900);
  assert.equal((await getStepsForDay(db, userId, '2026-09-13')).steps, 50);
});
