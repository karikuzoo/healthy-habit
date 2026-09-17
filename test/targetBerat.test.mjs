import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestDb } from './helpers/db.mjs';
import { ensureUser, updateUserRow } from '../src/db/users.js';

/**
 * Berat target dan tenggatnya, dari layar sampai ke database dan kembali.
 *
 * Yang diuji di sini penyimpanannya, bukan hitungannya — perhitungan sudah
 * punya berkasnya sendiri di `weightGoal.test.mjs`. Yang gampang luput adalah
 * pemetaan camelCase/snake_case: kolom baru yang lupa didaftarkan akan gagal
 * diam-diam, tersimpan hari ini lalu hilang saat dibaca lagi.
 */

test('berat target dan tenggatnya bolak-balik lewat pemetaan kolom', async () => {
  const { db, close } = await createTestDb({ seedUser: false });

  const user = await ensureUser(db);
  assert.equal(user.targetWeight, null, 'akun baru belum punya target');
  assert.equal(user.targetDate, null);

  const setelah = await updateUserRow(db, user.id, {
    targetWeight: 72.5,
    targetDate: '2026-12-31',
  });

  assert.equal(setelah.targetWeight, 72.5);
  assert.equal(setelah.targetDate, '2026-12-31');

  close();
});

test('mengosongkan berat target mencabut targetnya, bukan menyisakan separuh', async () => {
  const { db, close } = await createTestDb({ seedUser: false });

  const user = await ensureUser(db);
  await updateUserRow(db, user.id, { targetWeight: 72.5, targetDate: '2026-12-31' });

  const dicabut = await updateUserRow(db, user.id, {
    targetWeight: null,
    targetDate: null,
  });

  assert.equal(dicabut.targetWeight, null);
  assert.equal(dicabut.targetDate, null);

  close();
});

test('mengubah profil lain tidak ikut menyapu target yang sudah ada', async () => {
  const { db, close } = await createTestDb({ seedUser: false });

  const user = await ensureUser(db);
  await updateUserRow(db, user.id, { targetWeight: 70, targetDate: '2027-01-15' });

  const setelah = await updateUserRow(db, user.id, { weight: 81 });

  assert.equal(setelah.weight, 81);
  assert.equal(setelah.targetWeight, 70, 'patch parsial hanya menyentuh kolom yang dikirim');
  assert.equal(setelah.targetDate, '2027-01-15');

  close();
});
