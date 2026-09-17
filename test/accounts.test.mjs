import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestDb } from './helpers/db.mjs';
import {
  ensureUser,
  hasRegisteredAccount,
  registerAccount,
  registeredEmailHints,
  resetPassword,
  updateUserRow,
  verifyCredentials,
} from '../src/db/users.js';
import { createSalt, hashPassword, verifyPassword } from '../src/lib/password.js';
import { addFoodLog, dailyTotals } from '../src/db/foodLogs.js';

/**
 * Akun lokal (AUTH-2, sementara sampai Supabase).
 *
 * Uji terpenting di berkas ini adalah yang pertama: satu perangkat harus bisa
 * menampung lebih dari satu akun. Sebelumnya tabel `users` hanya pernah
 * berisi satu baris, dan mendaftar MENIMPA baris itu — jadi mendaftar akun
 * kedua membuat akun pertama lenyap tanpa peringatan apa pun, dan pemiliknya
 * hanya melihat "email atau kata sandi salah" saat mencoba masuk lagi.
 */

const AKUN_A = {
  firstName: 'Achmad',
  lastName: 'Rahman',
  email: 'achmad@gmail.com',
  password: 'Test1234',
};

const AKUN_B = {
  firstName: 'Budi',
  lastName: '',
  email: 'budi@gmail.com',
  password: 'Test5678',
};

const masuk = (db, akun) =>
  verifyCredentials(db, { email: akun.email, password: akun.password });

test('mendaftar akun kedua TIDAK menghapus akun pertama', async (t) => {
  const { db, raw, close } = await createTestDb({ seedUser: false });
  t.after(close);

  // Persis langkah yang dilaporkan: daftar A, daftar B, lalu masuk A lagi.
  await registerAccount(db, AKUN_A);
  assert.equal((await masuk(db, AKUN_A)).ok, true, 'A bisa masuk setelah daftar');

  await registerAccount(db, AKUN_B);

  assert.equal((await masuk(db, AKUN_A)).ok, true, 'A HARUS tetap bisa masuk');
  assert.equal((await masuk(db, AKUN_B)).ok, true, 'B juga bisa masuk');

  const { n } = raw.prepare('SELECT COUNT(*) AS n FROM users').get();
  assert.equal(n, 2, 'satu baris per akun, bukan satu baris per perangkat');
});

test('tiap akun punya catatan sendiri', async (t) => {
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  const a = await registerAccount(db, AKUN_A);
  await addFoodLog(db, a.id, { slot: 'siang', name: 'Nasi', calories: 204 }, '2026-09-17');

  const b = await registerAccount(db, AKUN_B);

  // Karena tiap akun punya id sendiri, pemisahannya terjadi dengan
  // sendirinya — tidak ada data yang perlu disingkirkan saat berganti akun.
  assert.equal((await dailyTotals(db, b.id, '2026-09-17')).calories, 0);
  assert.equal((await dailyTotals(db, a.id, '2026-09-17')).calories, 204);
});

test('akun baru tidak mewarisi foto akun lain', async (t) => {
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  const a = await registerAccount(db, AKUN_A);
  await updateUserRow(db, a.id, { avatar: 'file:///dokumen/avatars/a.jpg' });

  const b = await registerAccount(db, AKUN_B);

  assert.equal(b.avatar, null, 'foto akun lain tidak boleh ikut');
});

test('email yang belum terdaftar TIDAK bisa masuk', async (t) => {
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  const kosong = await verifyCredentials(db, {
    email: 'orang-asing@example.com',
    password: 'apa saja',
  });
  assert.equal(kosong.reason, 'belum-terdaftar');

  await registerAccount(db, AKUN_A);

  // Sesudah ada akun, email tak dikenal dilaporkan sama seperti kata sandi
  // salah — supaya penebak tidak tahu email mana yang terdaftar.
  const asing = await verifyCredentials(db, {
    email: 'orang-asing@example.com',
    password: 'apa saja',
  });
  assert.equal(asing.reason, 'kredensial-salah');
});

test('profil bawaan yang belum didaftarkan bukan akun', async (t) => {
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  // `ensureUser` menyemai profil contoh lengkap dengan email. Keberadaan
  // baris itu TIDAK boleh dianggap akun terdaftar.
  const seeded = await ensureUser(db);
  assert.ok(seeded.email);
  assert.equal(await hasRegisteredAccount(db), false);

  const hasil = await verifyCredentials(db, {
    email: seeded.email,
    password: 'apa saja',
  });
  assert.equal(hasil.reason, 'belum-terdaftar');
});

test('pendaftaran pertama mengklaim baris draf, bukan membuat baris kedua', async (t) => {
  const { db, raw, close } = await createTestDb({ seedUser: false });
  t.after(close);

  await ensureUser(db);
  await registerAccount(db, AKUN_A);

  // Kalau draf ditinggalkan, perangkat punya baris yatim selamanya — dan
  // data contoh yang disemai ke sana tidak akan pernah terlihat.
  const { n } = raw.prepare('SELECT COUNT(*) AS n FROM users').get();
  assert.equal(n, 1);
  assert.equal((await masuk(db, AKUN_A)).ok, true);
});

test('kata sandi salah ditolak', async (t) => {
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  await registerAccount(db, AKUN_A);

  const hasil = await verifyCredentials(db, {
    email: AKUN_A.email,
    password: 'Salah999',
  });
  assert.equal(hasil.ok, false);
  assert.equal(hasil.reason, 'kredensial-salah');
});

test('email tidak peka huruf besar-kecil maupun spasi', async (t) => {
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  await registerAccount(db, { ...AKUN_A, email: 'Achmad@Gmail.COM' });

  const hasil = await verifyCredentials(db, {
    email: '  achmad@gmail.com  ',
    password: AKUN_A.password,
  });
  assert.equal(hasil.ok, true);
});

test('mendaftar ulang dengan email SAMA mengambil alih akun, catatan tetap utuh', async (t) => {
  const { db, raw, close } = await createTestDb({ seedUser: false });
  t.after(close);

  const a = await registerAccount(db, AKUN_A);
  await addFoodLog(db, a.id, { slot: 'siang', name: 'Nasi', calories: 204 }, '2026-09-17');

  // Ini jalur "lupa kata sandi lalu daftar ulang" — orangnya sama.
  const lagi = await registerAccount(db, { ...AKUN_A, password: 'Baru1234' });

  assert.equal(lagi.id, a.id, 'baris yang sama, bukan akun baru');
  assert.equal((await dailyTotals(db, a.id, '2026-09-17')).calories, 204);

  const { n } = raw.prepare('SELECT COUNT(*) AS n FROM users').get();
  assert.equal(n, 1);

  assert.equal(
    (await verifyCredentials(db, { email: AKUN_A.email, password: 'Baru1234' })).ok,
    true,
  );
});

test('kata sandi tidak tersimpan sebagai teks polos', async (t) => {
  const { db, raw, close } = await createTestDb({ seedUser: false });
  t.after(close);

  const a = await registerAccount(db, AKUN_A);
  const row = raw
    .prepare('SELECT password_hash, password_salt FROM users WHERE id = ?')
    .get(a.id);

  assert.ok(row.password_salt);
  assert.ok(row.password_hash);
  assert.equal(JSON.stringify(row).includes(AKUN_A.password), false);
});

test('dua akun dengan kata sandi sama menghasilkan hash berbeda', async () => {
  const saltA = await createSalt();
  const saltB = await createSalt();

  assert.notEqual(saltA, saltB);
  assert.notEqual(
    await hashPassword('Test1234', saltA),
    await hashPassword('Test1234', saltB),
  );
});

test('verifyPassword menolak hash atau salt yang hilang', async () => {
  const salt = await createSalt();
  const hash = await hashPassword('Test1234', salt);

  assert.equal(await verifyPassword('Test1234', salt, hash), true);
  assert.equal(await verifyPassword('Test1234', null, hash), false);
  assert.equal(await verifyPassword('Test1234', salt, null), false);
});

test('atur ulang kata sandi hanya menyentuh akun yang emailnya cocok', async (t) => {
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  await registerAccount(db, AKUN_A);
  await registerAccount(db, AKUN_B);

  const hasil = await resetPassword(db, {
    email: AKUN_A.email,
    password: 'Baru1234',
  });
  assert.equal(hasil.ok, true);

  assert.equal((await masuk(db, AKUN_A)).ok, false, 'kata sandi lama A mati');
  assert.equal(
    (await verifyCredentials(db, { email: AKUN_A.email, password: 'Baru1234' })).ok,
    true,
  );

  // Akun lain tidak boleh ikut terpengaruh
  assert.equal((await masuk(db, AKUN_B)).ok, true, 'B tidak tersentuh');
});

test('atur ulang menolak email yang tidak cocok, tanpa mengubah apa pun', async (t) => {
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  await registerAccount(db, AKUN_A);

  const hasil = await resetPassword(db, {
    email: 'orang-lain@example.com',
    password: 'Baru1234',
  });
  assert.equal(hasil.reason, 'email-tidak-cocok');
  assert.equal((await masuk(db, AKUN_A)).ok, true);
});

test('atur ulang tidak bisa dipakai sebelum ada akun terdaftar', async (t) => {
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  const hasil = await resetPassword(db, {
    email: 'siapa-saja@example.com',
    password: 'Baru1234',
  });
  assert.equal(hasil.reason, 'belum-terdaftar');
});

test('atur ulang memakai salt baru, bukan salt lama', async (t) => {
  const { db, raw, close } = await createTestDb({ seedUser: false });
  t.after(close);

  const a = await registerAccount(db, AKUN_A);
  const sebelum = raw
    .prepare('SELECT password_salt, password_hash FROM users WHERE id = ?')
    .get(a.id);

  // Kata sandi yang SAMA disetel ulang. Hash yang tidak berubah akan
  // membocorkan bahwa kata sandinya juga tidak berubah.
  await resetPassword(db, { email: AKUN_A.email, password: AKUN_A.password });

  const sesudah = raw
    .prepare('SELECT password_salt, password_hash FROM users WHERE id = ?')
    .get(a.id);

  assert.notEqual(sesudah.password_salt, sebelum.password_salt);
  assert.notEqual(sesudah.password_hash, sebelum.password_hash);
});

test('email disimpan sudah ternormalkan saat diubah lewat Edit profil', async (t) => {
  const { db, raw, close } = await createTestDb({ seedUser: false });
  t.after(close);

  const a = await registerAccount(db, AKUN_A);
  await updateUserRow(db, a.id, { email: '  Achmad.Baru@Gmail.COM ' });

  // Yang diperiksa NILAI TERSIMPANNYA — masuk akan berhasil apa pun
  // bentuknya, karena `verifyCredentials` menormalkan saat membaca.
  const row = raw.prepare('SELECT email FROM users WHERE id = ?').get(a.id);
  assert.equal(row.email, 'achmad.baru@gmail.com');
});

test('petunjuk email menyamarkan bagian lokal, menampilkan semua akun', async (t) => {
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  assert.deepEqual(await registeredEmailHints(db), [], 'belum ada akun');

  await registerAccount(db, AKUN_A);
  await registerAccount(db, AKUN_B);

  const hints = await registeredEmailHints(db);

  assert.equal(hints.length, 2, 'kedua akun disebutkan');
  assert.ok(hints.includes('a••••d@gmail.com'), JSON.stringify(hints));
  assert.ok(hints.every((h) => h.endsWith('@gmail.com')), 'domain dibiarkan utuh');
});

test('bagian lokal yang pendek disamarkan seluruhnya', async (t) => {
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  // Menampilkan 1 dari 2 huruf hampir sama saja dengan menampilkan semuanya.
  await registerAccount(db, { ...AKUN_A, email: 'ab@mail.com' });

  assert.deepEqual(await registeredEmailHints(db), ['••@mail.com']);
});
