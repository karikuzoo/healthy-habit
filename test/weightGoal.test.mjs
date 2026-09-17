import test from 'node:test';
import assert from 'node:assert/strict';

import {
  KKAL_PER_KG,
  MAKS_NAIK_KG_PER_MINGGU,
  proyeksiBerat,
  rencanaLengkap,
  rencanaTarget,
} from '../src/lib/weightGoal.js';

/**
 * Target berat badan yang menyetir target kalori.
 *
 * Angka di sini menentukan berapa kalori yang disarankan aplikasi setiap
 * hari, jadi yang diuji bukan cuma "tidak error" melainkan bahwa batas
 * amannya benar-benar mengikat.
 */

const DASAR = { beratKg: 80, tdee: 2400, bmr: 1700 };

test('target yang wajar menghasilkan defisit yang sesuai hitungan mundurnya', () => {
  // 4 kg dalam 8 minggu = 0,5 kg/minggu = 3850 kkal/minggu = 550 kkal/hari.
  const r = rencanaTarget({ ...DASAR, targetKg: 76, hari: 56 });

  assert.equal(r.arah, 'turun');
  assert.equal(r.dibatasiOleh, null);
  assert.equal(Math.round(r.lajuKgPerMinggu * 100) / 100, 0.5);
  assert.equal(r.deltaKaloriHarian, -550);
  assert.equal(r.kaloriTarget, 2400 - 550);
  assert.equal(r.hariRealistis, 56, 'waktu yang diminta memang sanggup dipenuhi');
});

test('waktu yang terlalu ambisius dibatasi ke laju aman, bukan ditolak', () => {
  // 10 kg dalam 4 minggu = 2,5 kg/minggu. Batasnya 1% dari 80 kg = 0,8.
  // BMR sengaja rendah supaya yang mengikat di sini benar-benar batas laju.
  const r = rencanaTarget({ beratKg: 80, tdee: 2400, bmr: 1500, targetKg: 70, hari: 28 });

  assert.equal(r.dibatasiOleh, 'laju');
  assert.equal(Math.round(r.lajuKgPerMinggu * 100) / 100, 0.8);
  assert.ok(
    r.hariRealistis > 28,
    'layar perlu tahu bahwa waktunya mundur, bukan sekadar bahwa targetnya dipotong',
  );
});

test('batas turun ikut berat badan, bukan angka tetap', () => {
  const ringan = rencanaTarget({ beratKg: 50, tdee: 2200, bmr: 1400, targetKg: 40, hari: 28 });
  const berat = rencanaTarget({ beratKg: 120, tdee: 3200, bmr: 2000, targetKg: 110, hari: 28 });

  assert.equal(Math.round(ringan.lajuKgPerMinggu * 100) / 100, 0.5, '1% dari 50 kg');
  assert.equal(berat.lajuKgPerMinggu, 1, 'langit-langit 1 kg menahan 1% dari 120 kg');
});

test('lantai BMR menang atas batas laju, bukan sebaliknya', () => {
  // Batas laju sendiri sudah memotong 2,5 menjadi 0,8 kg/minggu, tapi 0,8
  // masih menuntut 880 kkal defisit dan itu menembus BMR. Yang dilaporkan
  // harus batas yang benar-benar mengikat.
  const r = rencanaTarget({ beratKg: 80, tdee: 2400, bmr: 1700, targetKg: 70, hari: 28 });

  assert.equal(r.dibatasiOleh, 'bmr');
  assert.equal(r.kaloriTarget, 1700);
  assert.ok(r.lajuKgPerMinggu < 0.8, 'lajunya ikut turun, tidak berhenti di batas laju');
});

test('kalori tidak pernah disarankan di bawah BMR', () => {
  // TDEE nyaris sama dengan BMR: defisit apa pun akan menembus lantainya.
  const r = rencanaTarget({ beratKg: 80, tdee: 1800, bmr: 1700, targetKg: 70, hari: 28 });

  assert.equal(r.dibatasiOleh, 'bmr');
  assert.equal(r.kaloriTarget, 1700);
  assert.equal(
    r.lajuKgPerMinggu,
    ((1800 - 1700) * 7) / KKAL_PER_KG,
    'laju dihitung ULANG dari kalori yang benar-benar dipakai',
  );
});

test('target naik berat dibatasi lebih ketat daripada target turun', () => {
  const r = rencanaTarget({ ...DASAR, targetKg: 90, hari: 28 });

  assert.equal(r.arah, 'naik');
  assert.equal(r.lajuKgPerMinggu, -MAKS_NAIK_KG_PER_MINGGU);
  assert.ok(r.deltaKaloriHarian > 0, 'naik berat berarti surplus');
});

test('target yang sama dengan berat sekarang berarti menjaga, bukan defisit nol yang aneh', () => {
  const r = rencanaTarget({ ...DASAR, targetKg: 80, hari: 56 });

  assert.equal(r.arah, 'jaga');
  assert.equal(r.deltaKaloriHarian, 0);
  assert.equal(r.kaloriTarget, 2400);
});

test('masukan yang belum lengkap tidak menghasilkan NaN', () => {
  for (const patch of [
    { targetKg: null, hari: 56 },
    { targetKg: 70, hari: 0 },
    { targetKg: 0, hari: 56 },
  ]) {
    const r = rencanaTarget({ ...DASAR, ...patch });
    assert.equal(r.kaloriTarget, 2400);
    assert.ok(Number.isFinite(r.deltaKaloriHarian));
  }
});

test('proyeksi berhenti di target, tidak menembusnya', () => {
  const titik = proyeksiBerat({ beratKg: 80, targetKg: 76, lajuKgPerMinggu: 0.5 });

  assert.deepEqual(titik.map((t) => t.beratKg), [78, 76, 76]);
  assert.deepEqual(titik.map((t) => t.tercapai), [false, true, true]);
});

test('proyeksi naik berat juga berhenti di target', () => {
  const titik = proyeksiBerat({ beratKg: 60, targetKg: 63, lajuKgPerMinggu: -0.5 });

  assert.deepEqual(titik.map((t) => t.beratKg), [62, 63, 63]);
});

test('TDEE yang belum terhitung menghasilkan kaloriTarget null, bukan nol', () => {
  const r = rencanaTarget({ beratKg: 80, targetKg: 70, hari: 56, tdee: null, bmr: null });

  assert.equal(r.kaloriTarget, null, '"0 kkal" akan terbaca sebagai angka sungguhan di layar');
});

test('rencanaLengkap merangkai BMR, TDEE, rencana, dan proyeksi dalam satu jalur', () => {
  const hasil = rencanaLengkap({
    beratKg: 80,
    tinggiCm: 180,
    umur: 28,
    gender: 'Laki-Laki',
    activityLevel: 'sedentary',
    targetKg: 76,
    hari: 56,
  });

  assert.equal(hasil.bmr, 1790);
  assert.equal(hasil.tdee, Math.round(1790 * 1.2));
  assert.equal(hasil.rencana.arah, 'turun');
  assert.equal(hasil.proyeksi.length, 3);
});

test('rencanaLengkap dengan data tubuh belum lengkap tidak meledak', () => {
  const hasil = rencanaLengkap({
    beratKg: null,
    tinggiCm: 180,
    umur: null,
    gender: 'Perempuan',
    activityLevel: 'sedentary',
    targetKg: 60,
    hari: 90,
  });

  assert.equal(hasil.bmr, null);
  assert.equal(hasil.tdee, null);
  assert.equal(hasil.rencana.kaloriTarget, null);
  assert.deepEqual(hasil.proyeksi, []);
});
