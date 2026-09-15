import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateDailyScore, SCORE_WEIGHTS } from '../src/lib/dailyScore.js';

/**
 * Skor harian (HOME-2).
 *
 * Berkas ini disentuh lebih dari satu orang, dan pergeseran di sini tidak
 * kelihatan di layar mana pun — angkanya tetap muncul, hanya jadi salah.
 * Uji ini yang menahannya.
 *
 * Yang dikunci adalah SIFAT kurvanya, bukan angka akhirnya. Bobot boleh
 * disetel ulang; yang tidak boleh adalah tidur 4 jam dinilai sama dengan
 * tidur 8 jam, atau makan berlebih dinilai sebaik makan pas target.
 */

/** Hari yang semua komponennya sempurna, dipakai sebagai titik acuan. */
const HARI_SEMPURNA = {
  sleepMinutes: 480,
  caloriesConsumed: 2000,
  calorieTarget: 2000,
  exercisesDone: 7,
  exercisesPlanned: 7,
  steps: 8000,
  stepTarget: 8000,
};

const skor = (patch) => calculateDailyScore({ ...HARI_SEMPURNA, ...patch }).total;

test('bobot seluruh komponen berjumlah tepat 1', () => {
  const total = Object.values(SCORE_WEIGHTS).reduce((sum, w) => sum + w, 0);

  // Kalau tidak 1, skor maksimum bukan 100 dan seluruh rumusnya meleset.
  assert.equal(total, 1);
});

test('hari sempurna bernilai 100, hari kosong bernilai 0', () => {
  assert.equal(skor({}), 100);

  assert.equal(
    skor({ sleepMinutes: 0, caloriesConsumed: 0, exercisesDone: 0, steps: 0 }),
    0,
  );
});

test('tidur dinilai dengan pita, bukan makin banyak makin baik', () => {
  const ideal = skor({ sleepMinutes: 480 });

  // Kurang tidur DAN kelebihan tidur sama-sama menurunkan skor. Ini yang
  // membedakan tidur dari kalori: tidur 13 jam bukan pencapaian.
  assert.ok(skor({ sleepMinutes: 300 }) < ideal, 'kurang tidur harus turun');
  assert.ok(skor({ sleepMinutes: 700 }) < ideal, 'kelewat lama juga harus turun');

  // Di luar pita sama sekali -> komponen tidur bernilai nol
  assert.equal(skor({ sleepMinutes: 240 }), skor({ sleepMinutes: 0 }));
  assert.equal(skor({ sleepMinutes: 720 }), skor({ sleepMinutes: 0 }));
});

test('asupan diberi kredit proporsional di bawah target, dihukum di atasnya', () => {
  // Kalori terakumulasi sepanjang hari, jadi setengah target di siang hari
  // bukan kegagalan — harus bernilai lebih dari nol.
  const setengah = skor({ caloriesConsumed: 1000 });
  const kosong = skor({ caloriesConsumed: 0 });
  const pas = skor({ caloriesConsumed: 2000 });

  assert.ok(setengah > kosong, 'asupan separuh target harus di atas nol');
  assert.ok(setengah < pas, 'tapi tetap di bawah target penuh');

  // Kelebihan dihukum karena sudah terjadi dan tidak bisa dibatalkan
  assert.ok(skor({ caloriesConsumed: 3000 }) < pas, 'melewati target harus turun');
  assert.equal(
    skor({ caloriesConsumed: 3000 }),
    kosong,
    '150% target bernilai nol, sama seperti tidak makan',
  );
});

test('komponen tanpa data dinilai nol, bukan dikeluarkan dari perhitungan', () => {
  // Kalau komponen kosong dikeluarkan lalu bobotnya dinormalkan ulang, orang
  // yang baru mencatat tidur saja bisa memperoleh 100 padahal harinya belum
  // berjalan. Skor ini mengukur KELENGKAPAN hari.
  const hanyaTidur = calculateDailyScore({
    ...HARI_SEMPURNA,
    caloriesConsumed: 0,
    exercisesDone: 0,
    steps: 0,
  });

  assert.ok(hanyaTidur.total < 100);
  assert.equal(hanyaTidur.total, Math.round(SCORE_WEIGHTS.sleep * 100));
});

test('target nol tidak menghasilkan NaN', () => {
  // Target langkah bernilai 0 selama database belum terbaca, dan pembagian
  // dengan nol di sana akan membuat SELURUH skor jadi NaN.
  const hasil = calculateDailyScore({
    ...HARI_SEMPURNA,
    steps: 0,
    stepTarget: 0,
    calorieTarget: 0,
    exercisesPlanned: 0,
  });

  assert.ok(Number.isFinite(hasil.total), 'skor harus tetap angka');
});

test('weakest menunjuk komponen dengan kehilangan poin terbesar', () => {
  const hasil = calculateDailyScore({ ...HARI_SEMPURNA, sleepMinutes: 0 });

  assert.equal(hasil.weakest.key, 'sleep');
  assert.equal(hasil.weakest.direction, 'missing');
  assert.ok(hasil.message.length > 0);
});

test('setiap komponen punya label dan arah yang terisi', () => {
  const hasil = calculateDailyScore({
    ...HARI_SEMPURNA,
    sleepMinutes: 0,
    caloriesConsumed: 0,
    exercisesDone: 0,
    steps: 0,
  });

  assert.equal(hasil.components.length, Object.keys(SCORE_WEIGHTS).length);

  for (const component of hasil.components) {
    assert.ok(component.label, `${component.key} harus punya label`);
    assert.equal(component.direction, 'missing');
    assert.ok(component.score >= 0 && component.score <= 1);
  }
});
