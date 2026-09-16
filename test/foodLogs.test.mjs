import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestDb } from './helpers/db.mjs';
import {
  addFoodLog,
  dailyHistory,
  dailyTotals,
  getFoodLog,
  listMealsForDay,
  rescaleFoodLog,
  softDeleteFoodLog,
  updateFoodLog,
} from '../src/db/foodLogs.js';

/**
 * Catatan makanan (NUT-7 s.d. NUT-10).
 *
 * Query dijalankan terhadap SQLite sungguhan lewat `node:sqlite`, memakai
 * schema dari `migrate()` yang sama dipakai aplikasi — bukan SQL yang disalin
 * ulang ke berkas uji.
 */

const NASI = {
  slot: 'siang',
  name: 'Nasi Putih',
  portion: 'porsi',
  servingLabel: 'porsi',
  servingGrams: 100,
  quantity: 1,
  weightG: 100,
  calories: 204,
  protein: 4,
  carbs: 44,
  fat: 0,
};

test('rescaleFoodLog menskalakan angka TERSIMPAN, bukan menghitung ulang dari katalog', () => {
  const entry = { weightG: 100, calories: 204, protein: 4, carbs: 44, fat: 0 };

  // Katalog yang sudah DIKOREKSI naik sejak catatan dibuat. Kalau porsi
  // dihitung ulang dari sini, catatan kemarin ikut berubah padahal pengguna
  // hanya mengubah jumlahnya. Itu persis yang tidak boleh terjadi — alasan
  // kolom gizi disalin ke baris log sejak awal.
  const katalogDikoreksi = { calories: 300, protein: 9, carbs: 60, fat: 1 };

  const dua = rescaleFoodLog(entry, { servingGrams: 100, quantity: 2 }, katalogDikoreksi);

  assert.equal(dua.calories, 408, 'harus 2x angka catatan (204), bukan 2x katalog (300)');
  assert.equal(dua.weightG, 200);
  assert.equal(dua.basis, 'catatan');

  const separuh = rescaleFoodLog(entry, { servingGrams: 50, quantity: 1 });
  assert.equal(separuh.calories, 102);
});

test('rescaleFoodLog jatuh ke katalog hanya kalau catatan tak punya berat', () => {
  const tanpaBerat = { weightG: null, calories: 150, protein: 5, carbs: 20, fat: 3 };
  const katalog = { calories: 300, protein: 9, carbs: 60, fat: 1 };

  const dariKatalog = rescaleFoodLog(tanpaBerat, { servingGrams: 100, quantity: 1 }, katalog);
  assert.equal(dariKatalog.basis, 'katalog');
  assert.equal(dariKatalog.calories, 300);

  // Tanpa berat DAN tanpa katalog, porsinya memang tidak bisa diskalakan.
  // null adalah jawaban yang benar — layar memakainya untuk mengunci porsi.
  assert.equal(rescaleFoodLog(tanpaBerat, { servingGrams: 100, quantity: 1 }, null), null);
});

test('mengubah porsi berkali-kali tidak menghanyutkan angkanya', () => {
  // Pembulatan terjadi di setiap penyimpanan. Kalau bolak-balik 1 <-> 3 porsi
  // membuat angkanya merayap, riwayat pengguna pelan-pelan jadi salah.
  let current = { weightG: 100, calories: 204, protein: 4, carbs: 44, fat: 0 };

  for (let i = 0; i < 10; i += 1) {
    current = { ...current, ...rescaleFoodLog(current, { servingGrams: 100, quantity: 3 }) };
    current = { ...current, ...rescaleFoodLog(current, { servingGrams: 100, quantity: 1 }) };
  }

  assert.equal(current.calories, 204);
});

test('dailyTotals menjumlahkan hari yang benar dan melewati baris terhapus', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  await addFoodLog(db, userId, NASI, '2026-09-12');
  await addFoodLog(db, userId, { ...NASI, name: 'Telur', calories: 93 }, '2026-09-12');
  await addFoodLog(db, userId, { ...NASI, name: 'Hari lain', calories: 500 }, '2026-09-11');

  const totals = await dailyTotals(db, userId, '2026-09-12');
  assert.equal(totals.calories, 297, 'hari lain tidak boleh ikut terhitung');

  const [first] = (await listMealsForDay(db, userId, '2026-09-12'))[0].items;
  await softDeleteFoodLog(db, first.id);

  const setelahHapus = await dailyTotals(db, userId, '2026-09-12');
  assert.equal(setelahHapus.calories, 93, 'baris terhapus tidak boleh ikut');
});

test('listMealsForDay mengelompokkan per waktu makan dan melewati slot kosong', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  await addFoodLog(db, userId, { ...NASI, slot: 'sarapan', name: 'Telur' }, '2026-09-12');
  await addFoodLog(db, userId, { ...NASI, slot: 'siang' }, '2026-09-12');

  const meals = await listMealsForDay(db, userId, '2026-09-12');

  assert.deepEqual(
    meals.map((m) => m.slot),
    ['sarapan', 'siang'],
    'urutannya mengikuti urutan waktu makan, bukan urutan pencatatan',
  );
  assert.equal(meals.length, 2, 'malam dan cemilan yang kosong tidak boleh muncul');
  assert.equal(meals[1].totals.calories, 204, 'total per slot dihitung dari itemnya');
});

test('updateFoodLog mengubah porsi dan waktu makan tanpa memindahkan tanggalnya', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  await addFoodLog(db, userId, NASI, '2026-09-12');
  const [item] = (await listMealsForDay(db, userId, '2026-09-12'))[0].items;

  const before = await getFoodLog(db, item.id);
  const scaled = rescaleFoodLog(before, { servingGrams: 100, quantity: 2 });

  await updateFoodLog(db, item.id, {
    slot: 'malam',
    portion: '2 × porsi',
    servingLabel: 'porsi',
    servingGrams: 100,
    quantity: 2,
    ...scaled,
  });

  const after = await getFoodLog(db, item.id);
  assert.equal(after.mealSlot, 'malam');
  assert.equal(after.quantity, 2);
  assert.equal(after.calories, 408);
  assert.equal(after.loggedOn, '2026-09-12', 'tanggal TIDAK boleh ikut berubah');
});

test('dailyHistory meringkas per tanggal, terbaru dulu', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  await addFoodLog(db, userId, NASI, '2026-09-10');
  await addFoodLog(db, userId, { ...NASI, name: 'Telur', calories: 93 }, '2026-09-10');
  await addFoodLog(db, userId, { ...NASI, name: 'Pisang', calories: 92 }, '2026-09-11');

  const history = await dailyHistory(db, userId);

  assert.deepEqual(
    history.map((d) => d.loggedOn),
    ['2026-09-11', '2026-09-10'],
  );
  assert.equal(history[1].calories, 297);
  assert.equal(history[1].items, 2);
});
