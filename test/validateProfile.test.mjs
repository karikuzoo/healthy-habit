import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_HEIGHT_CM,
  MAX_WEIGHT_KG,
  isChangingLoginEmail,
  validateProfileEdit,
} from '../src/lib/validateProfile.js';

/**
 * Validasi layar Edit profil (PROF-2).
 *
 * Yang paling berbahaya di layar itu adalah kolom email: ia identitas masuk,
 * dan sebelum ada uji ini ia tersimpan apa adanya tanpa diperiksa sama
 * sekali.
 */

const PROFIL_SAH = {
  name: 'Ihsan Rahman',
  email: 'ihsan@example.com',
  height: '170',
  weight: '65',
};

test('profil yang lengkap dan benar lolos', () => {
  assert.equal(validateProfileEdit(PROFIL_SAH).valid, true);
});

test('email kosong DITOLAK — itu identitas masuk, bukan keterangan kontak', () => {
  // Sebelum ini, mengosongkannya akan tersimpan sebagai string kosong dan
  // membuat pemiliknya tidak bisa masuk lagi dengan alamat apa pun.
  const kosong = validateProfileEdit({ ...PROFIL_SAH, email: '' });

  assert.equal(kosong.valid, false);
  assert.ok(kosong.errors.email);

  const ngawur = validateProfileEdit({ ...PROFIL_SAH, email: 'bukan-email' });
  assert.equal(ngawur.valid, false);
  assert.ok(ngawur.errors.email);
});

test('nama kosong ditolak', () => {
  const hasil = validateProfileEdit({ ...PROFIL_SAH, name: '   ' });

  assert.equal(hasil.valid, false);
  assert.ok(hasil.errors.name);
});

test('tinggi dan berat menolak yang kosong, nol, dan negatif', () => {
  for (const nilai of ['', '0', '-5', 'abc']) {
    const hasil = validateProfileEdit({ ...PROFIL_SAH, height: nilai });
    assert.equal(hasil.valid, false, `tinggi "${nilai}" harus ditolak`);
    assert.ok(hasil.errors.height);
  }

  for (const nilai of ['', '0', '-5', 'abc']) {
    const hasil = validateProfileEdit({ ...PROFIL_SAH, weight: nilai });
    assert.equal(hasil.valid, false, `berat "${nilai}" harus ditolak`);
    assert.ok(hasil.errors.weight);
  }
});

test('yang ditolak hanya yang MUSTAHIL, bukan yang tidak biasa', () => {
  // Rentang "wajar" masih pertanyaan terbuka di PRD. Angka yang tidak umum
  // tapi mungkin — orang sangat pendek atau sangat berat — harus lolos.
  assert.equal(validateProfileEdit({ ...PROFIL_SAH, height: '120' }).valid, true);
  assert.equal(validateProfileEdit({ ...PROFIL_SAH, weight: '200' }).valid, true);

  // Yang mustahil ditolak
  assert.equal(
    validateProfileEdit({ ...PROFIL_SAH, height: String(MAX_HEIGHT_CM + 1) }).valid,
    false,
  );
  assert.equal(
    validateProfileEdit({ ...PROFIL_SAH, weight: String(MAX_WEIGHT_KG + 1) }).valid,
    false,
  );
});

test('desimal berkoma ala Indonesia diterima', () => {
  // Kolomnya dibaca `parseDecimal`, jadi "65,5" harus terbaca 65,5 —
  // bukan 65 seperti hasil parseFloat.
  assert.equal(validateProfileEdit({ ...PROFIL_SAH, weight: '65,5' }).valid, true);
  assert.equal(validateProfileEdit({ ...PROFIL_SAH, height: '170,5' }).valid, true);
});

test('isChangingLoginEmail hanya menyala saat alamatnya benar-benar berbeda', () => {
  assert.equal(isChangingLoginEmail('ihsan@example.com', 'ihsan@example.com'), false);

  // Huruf besar dan spasi bukan perubahan alamat
  assert.equal(isChangingLoginEmail('  Ihsan@Example.COM ', 'ihsan@example.com'), false);

  assert.equal(isChangingLoginEmail('lain@example.com', 'ihsan@example.com'), true);

  // Belum ada yang diketik, atau belum ada akun — bukan saatnya memperingatkan
  assert.equal(isChangingLoginEmail('', 'ihsan@example.com'), false);
  assert.equal(isChangingLoginEmail('lain@example.com', ''), false);
});
