import test from 'node:test';
import assert from 'node:assert/strict';

import { ACTIVITY_MULTIPLIERS, hitungBmr, hitungTdee } from '../src/lib/energy.js';

test('BMR memakai Mifflin-St Jeor dan membedakan jenis kelamin', () => {
  const pria = hitungBmr({ beratKg: 80, tinggiCm: 180, umur: 28, gender: 'Laki-Laki' });
  const wanita = hitungBmr({ beratKg: 80, tinggiCm: 180, umur: 28, gender: 'Perempuan' });

  // 10*80 + 6.25*180 - 5*28 = 1785
  assert.equal(pria, 1785 + 5);
  assert.equal(wanita, 1785 - 161);
});

test('angka yang belum terisi mengembalikan null, bukan NaN', () => {
  assert.equal(hitungBmr({ beratKg: null, tinggiCm: 180, umur: 28, gender: 'Laki-Laki' }), null);
  assert.equal(hitungBmr({ beratKg: 80, tinggiCm: 0, umur: 28, gender: 'Laki-Laki' }), null);
  assert.equal(hitungTdee(null, 'sedentary'), null);
});

test('tanggal lahir kosong tidak membatalkan perhitungan', () => {
  const tanpaUmur = hitungBmr({ beratKg: 80, tinggiCm: 180, umur: null, gender: 'Laki-Laki' });
  assert.ok(Number.isFinite(tanpaUmur));
});

test('TDEE memakai pengali aktivitas, dan tingkat tak dikenal jatuh ke moderate', () => {
  assert.equal(hitungTdee(1790, 'sedentary'), Math.round(1790 * ACTIVITY_MULTIPLIERS.sedentary));
  assert.equal(hitungTdee(1790, 'entahapa'), Math.round(1790 * ACTIVITY_MULTIPLIERS.moderate));
});
