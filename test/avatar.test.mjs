import test from 'node:test';
import assert from 'node:assert/strict';

import {
  avatarFileName,
  deleteAvatar,
  extensionFromUri,
  saveAvatar,
} from '../src/lib/avatar.js';
import { fakeDisk, failures, resetDisk } from './helpers/stubs/expo-file-system.mjs';

/**
 * Penyimpanan foto profil (PROF-9).
 *
 * Yang diuji adalah dua hal yang mudah salah dan sunyi kalau salah: nama
 * berkas yang tidak sah, dan foto lama yang terhapus sebelum penggantinya
 * berhasil disalin.
 */

test('extensionFromUri tidak ikut terbawa query string', () => {
  // URI dari picker kadang berbentuk `...jpg?width=100`. Ekstensi yang
  // memuat tanda tanya menghasilkan nama berkas yang tidak sah.
  assert.equal(extensionFromUri('file:///cache/foto.jpg?width=100'), 'jpg');
  assert.equal(extensionFromUri('file:///cache/foto.PNG'), 'png');
  assert.equal(extensionFromUri('file:///cache/foto.heic'), 'heic');
});

test('extensionFromUri jatuh ke jpg kalau URI tidak memberi petunjuk', () => {
  assert.equal(extensionFromUri('file:///cache/tanpa-ekstensi'), 'jpg');
  assert.equal(extensionFromUri('file:///cache/berakhir.titik.'), 'jpg');
  assert.equal(extensionFromUri(''), 'jpg');
  assert.equal(extensionFromUri(null), 'jpg');

  // Bukan ekstensi yang masuk akal — jangan dipakai sebagai nama berkas
  assert.equal(extensionFromUri('file:///cache/a.terlalupanjangsekali'), 'jpg');
});

test('nama berkas memuat timestamp supaya gambar lama tidak tertahan di cache', () => {
  const satu = avatarFileName('user-1', 'foto.jpg', 1000);
  const dua = avatarFileName('user-1', 'foto.jpg', 2000);

  // Kalau namanya tetap, komponen gambar menampilkan foto LAMA dari
  // cache-nya sendiri meski isi berkasnya sudah diganti.
  assert.notEqual(satu, dua);
  assert.equal(satu, 'user-1-1000.jpg');
});

test('saveAvatar menyalin keluar dari cache ke direktori dokumen', async (t) => {
  resetDisk();
  t.after(resetDisk);

  fakeDisk.set('file:///cache/cropped123.jpg', 'foto-baru');

  const stored = await saveAvatar('file:///cache/cropped123.jpg', 'user-1');

  // Inti PROF-9: cache boleh dihapus sistem kapan saja, dokumen tidak.
  assert.ok(stored.startsWith('file:///dokumen/avatars/'), stored);
  assert.equal(fakeDisk.get(stored), 'foto-baru');
});

test('foto lama dihapus setelah yang baru tersimpan', async (t) => {
  resetDisk();
  t.after(resetDisk);

  fakeDisk.set('file:///dokumen/avatars/lama.jpg', 'foto-lama');
  fakeDisk.set('file:///cache/baru.jpg', 'foto-baru');

  const stored = await saveAvatar(
    'file:///cache/baru.jpg',
    'user-1',
    'file:///dokumen/avatars/lama.jpg',
  );

  assert.equal(fakeDisk.has('file:///dokumen/avatars/lama.jpg'), false);
  assert.equal(fakeDisk.get(stored), 'foto-baru');
});

test('penyalinan gagal TIDAK ikut menghapus foto lama', async (t) => {
  resetDisk();
  failures.copy = true;
  t.after(() => {
    failures.copy = false;
    resetDisk();
  });

  fakeDisk.set('file:///dokumen/avatars/lama.jpg', 'foto-lama');

  await assert.rejects(() =>
    saveAvatar('file:///cache/baru.jpg', 'user-1', 'file:///dokumen/avatars/lama.jpg'),
  );

  // Kalau urutannya dibalik, pengguna kehilangan foto lamanya tanpa
  // mendapat yang baru.
  assert.equal(
    fakeDisk.get('file:///dokumen/avatars/lama.jpg'),
    'foto-lama',
    'foto lama harus selamat saat penyalinan gagal',
  );
});

test('deleteAvatar aman dipanggil untuk berkas yang sudah tidak ada', async (t) => {
  resetDisk();
  t.after(resetDisk);

  // Berkas bisa lenyap di luar kendali aplikasi. Itu bukan alasan untuk
  // menggagalkan penyimpanan profil.
  await deleteAvatar('file:///dokumen/avatars/sudah-hilang.jpg');
  await deleteAvatar(null);
  await deleteAvatar(undefined);
});
