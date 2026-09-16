import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestDb } from './helpers/db.mjs';
import {
  ensureUser,
  hasRegisteredAccount,
  registerAccount,
  resetPassword,
  verifyCredentials,
} from '../src/db/users.js';
import { createSalt, hashPassword, verifyPassword } from '../src/lib/password.js';
import { addFoodLog, dailyTotals } from '../src/db/foodLogs.js';

/**
 * Gerbang akun lokal (AUTH-2, sementara sampai Supabase).
 *
 * Uji yang paling penting di berkas ini adalah yang pertama: sebelum ada
 * gerbang ini, email yang belum pernah didaftarkan pun bisa masuk.
 */

const AKUN = {
  firstName: 'Ihsan',
  lastName: 'Rahman',
  email: 'ihsan@example.com',
  password: 'rahasia123',
};

/** Database dengan baris pengguna bawaan, belum ada yang mendaftar. */
async function dbBaru() {
  const ctx = await createTestDb();
  // Baris users uji dibuat tanpa registered_at, sama seperti profil bawaan
  // yang disemai `ensureUser` pada peluncuran pertama.
  return ctx;
}

test('email yang belum terdaftar TIDAK bisa masuk', async (t) => {
  const { db, close } = await dbBaru();
  t.after(close);

  const hasil = await verifyCredentials(db, {
    email: 'orang-asing@example.com',
    password: 'apa saja',
  });

  assert.equal(hasil.ok, false);
  assert.equal(hasil.reason, 'belum-terdaftar');
});

test('profil bawaan yang belum didaftarkan bukan akun', async (t) => {
  // Tanpa baris pengguna, supaya `ensureUser` benar-benar menyemai profil
  // bawaannya — persis seperti peluncuran pertama di perangkat.
  const { db, close } = await createTestDb({ seedUser: false });
  t.after(close);

  // `ensureUser` menyemai profil contoh lengkap dengan email. Keberadaan
  // baris itu TIDAK boleh dianggap sebagai akun terdaftar — kalau iya,
  // siapa pun bisa masuk memakai email contoh itu.
  const seeded = await ensureUser(db);
  assert.ok(seeded.email, 'profil bawaan memang punya email');

  assert.equal(await hasRegisteredAccount(db), false);

  const hasil = await verifyCredentials(db, {
    email: seeded.email,
    password: 'apa saja',
  });
  assert.equal(hasil.reason, 'belum-terdaftar');
});

test('setelah mendaftar, kredensial yang benar bisa masuk', async (t) => {
  const { db, userId, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);
  assert.equal(await hasRegisteredAccount(db), true);

  const hasil = await verifyCredentials(db, {
    email: AKUN.email,
    password: AKUN.password,
  });

  assert.equal(hasil.ok, true);
  assert.equal(hasil.user.firstName, 'Ihsan');
});

test('kata sandi salah ditolak', async (t) => {
  const { db, userId, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);

  const hasil = await verifyCredentials(db, {
    email: AKUN.email,
    password: 'rahasia124',
  });

  assert.equal(hasil.ok, false);
  assert.equal(hasil.reason, 'kredensial-salah');
});

test('email lain ditolak dengan alasan yang SAMA seperti kata sandi salah', async (t) => {
  const { db, userId, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);

  const emailSalah = await verifyCredentials(db, {
    email: 'lain@example.com',
    password: AKUN.password,
  });
  const sandiSalah = await verifyCredentials(db, {
    email: AKUN.email,
    password: 'salah sekali',
  });

  // Membedakan keduanya akan memberi tahu penebak bahwa sebuah email
  // terdaftar di perangkat itu.
  assert.equal(emailSalah.reason, sandiSalah.reason);
  assert.equal(emailSalah.reason, 'kredensial-salah');
});

test('email tidak peka huruf besar-kecil maupun spasi', async (t) => {
  const { db, userId, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, { ...AKUN, email: 'Ihsan@Example.COM' });

  const hasil = await verifyCredentials(db, {
    email: '  ihsan@example.com  ',
    password: AKUN.password,
  });

  assert.equal(hasil.ok, true, 'alamat yang sama harus dikenali sama');
});

test('kata sandi tidak tersimpan sebagai teks polos', async (t) => {
  const { db, userId, raw, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);

  const row = raw
    .prepare('SELECT password_hash, password_salt FROM users WHERE id = ?')
    .get(userId);

  assert.ok(row.password_salt, 'salt harus ada');
  assert.ok(row.password_hash, 'hash harus ada');

  // Yang tersimpan tidak boleh berisi kata sandinya, dalam bentuk apa pun.
  const seluruhBaris = JSON.stringify(row);
  assert.equal(
    seluruhBaris.includes(AKUN.password),
    false,
    'kata sandi tidak boleh muncul di baris database',
  );
});

test('dua akun dengan kata sandi sama menghasilkan hash berbeda', async (t) => {
  // Itu gunanya salt acak per akun: tabel pelangi umum jadi tidak berguna.
  const saltA = await createSalt();
  const saltB = await createSalt();

  assert.notEqual(saltA, saltB);
  assert.notEqual(
    await hashPassword('rahasia123', saltA),
    await hashPassword('rahasia123', saltB),
  );
});

test('verifyPassword menolak hash atau salt yang hilang', async () => {
  const salt = await createSalt();
  const hash = await hashPassword('rahasia123', salt);

  assert.equal(await verifyPassword('rahasia123', salt, hash), true);
  assert.equal(await verifyPassword('rahasia123', null, hash), false);
  assert.equal(await verifyPassword('rahasia123', salt, null), false);
});

test('mendaftar ulang menimpa akun sebelumnya', async (t) => {
  const { db, userId, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);
  await registerAccount(db, userId, {
    firstName: 'Budi',
    lastName: '',
    email: 'budi@example.com',
    password: 'sandibaru123',
  });

  // Akun lama tidak boleh bisa masuk lagi
  const lama = await verifyCredentials(db, {
    email: AKUN.email,
    password: AKUN.password,
  });
  assert.equal(lama.ok, false);

  const baru = await verifyCredentials(db, {
    email: 'budi@example.com',
    password: 'sandibaru123',
  });
  assert.equal(baru.ok, true);
  assert.equal(baru.user.firstName, 'Budi');
});

test('atur ulang kata sandi: email cocok -> kata sandi lama mati, yang baru hidup', async (t) => {
  const { db, userId, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);

  const hasil = await resetPassword(db, {
    email: AKUN.email,
    password: 'sandibaru123',
  });
  assert.equal(hasil.ok, true);

  const lama = await verifyCredentials(db, {
    email: AKUN.email,
    password: AKUN.password,
  });
  assert.equal(lama.ok, false, 'kata sandi lama harus berhenti berlaku');

  const baru = await verifyCredentials(db, {
    email: AKUN.email,
    password: 'sandibaru123',
  });
  assert.equal(baru.ok, true);
});

test('atur ulang menolak email yang tidak cocok, dan tidak mengubah apa pun', async (t) => {
  const { db, userId, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);

  const hasil = await resetPassword(db, {
    email: 'orang-lain@example.com',
    password: 'sandibaru123',
  });

  assert.equal(hasil.ok, false);
  assert.equal(hasil.reason, 'email-tidak-cocok');

  // Kata sandi lama HARUS tetap berlaku — percobaan yang gagal tidak boleh
  // menyentuh akun sama sekali.
  const lama = await verifyCredentials(db, {
    email: AKUN.email,
    password: AKUN.password,
  });
  assert.equal(lama.ok, true, 'akun tidak boleh tersentuh oleh reset yang gagal');
});

test('atur ulang tidak bisa dipakai sebelum ada akun terdaftar', async (t) => {
  const { db, close } = await dbBaru();
  t.after(close);

  const hasil = await resetPassword(db, {
    email: 'siapa-saja@example.com',
    password: 'sandibaru123',
  });

  assert.equal(hasil.ok, false);
  assert.equal(hasil.reason, 'belum-terdaftar');
});

test('atur ulang memakai salt baru, bukan salt lama', async (t) => {
  const { db, userId, raw, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);
  const sebelum = raw
    .prepare('SELECT password_salt, password_hash FROM users WHERE id = ?')
    .get(userId);

  // Kata sandi yang SAMA disetel ulang. Kalau saltnya dipakai lagi, hashnya
  // akan identik — dan hash yang tidak pernah berubah membocorkan bahwa
  // kata sandinya juga tidak berubah.
  await resetPassword(db, { email: AKUN.email, password: AKUN.password });

  const sesudah = raw
    .prepare('SELECT password_salt, password_hash FROM users WHERE id = ?')
    .get(userId);

  assert.notEqual(sesudah.password_salt, sebelum.password_salt);
  assert.notEqual(sesudah.password_hash, sebelum.password_hash);
});

/** Membuat jejak pemakaian untuk akun yang sedang aktif. */
async function isiJejak(db, userId) {
  await addFoodLog(
    db,
    userId,
    { slot: 'siang', name: 'Nasi Putih', calories: 204 },
    '2026-09-16',
  );
  await db.runAsync(
    'UPDATE users SET avatar_uri = ?, height_cm = ?, weight_kg = ? WHERE id = ?',
    ['file:///dokumen/avatars/lama.jpg', 182, 78, userId],
  );
}

test('akun baru TIDAK mewarisi foto dan profil pemilik sebelumnya', async (t) => {
  const { db, userId, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);
  await isiJejak(db, userId);

  const { user, discardedAvatar } = await registerAccount(db, userId, {
    firstName: 'Budi',
    lastName: '',
    email: 'budi@example.com',
    password: 'sandibaru123',
  });

  // Inilah gejala yang terlihat pengguna: foto akun lama masih terpasang
  // di akun yang baru saja dibuat.
  assert.equal(user.avatar, null, 'foto pemilik lama tidak boleh ikut');
  assert.equal(
    discardedAvatar,
    'file:///dokumen/avatars/lama.jpg',
    'berkas fotonya dikembalikan supaya pemanggil bisa menghapusnya',
  );

  // Dan yang tidak terlihat tapi sama salahnya
  assert.equal(user.height, 170, 'tinggi kembali ke awal');
  assert.equal(user.weight, 65, 'berat kembali ke awal');
});

test('akun baru TIDAK mewarisi catatan pemilik sebelumnya', async (t) => {
  const { db, userId, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);
  await isiJejak(db, userId);

  assert.equal((await dailyTotals(db, userId, '2026-09-16')).calories, 204);

  await registerAccount(db, userId, {
    firstName: 'Budi',
    lastName: '',
    email: 'budi@example.com',
    password: 'sandibaru123',
  });

  // `user.id` tidak berubah, jadi tanpa penyingkiran eksplisit seluruh
  // riwayat pemilik lama ikut terbawa ke akun baru.
  assert.equal(
    (await dailyTotals(db, userId, '2026-09-16')).calories,
    0,
    'riwayat pemilik lama tidak boleh muncul di akun baru',
  );
});

test('catatan disingkirkan dengan SOFT delete, bukan dihapus permanen', async (t) => {
  const { db, userId, raw, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);
  await isiJejak(db, userId);

  await registerAccount(db, userId, {
    firstName: 'Budi',
    lastName: '',
    email: 'budi@example.com',
    password: 'sandibaru123',
  });

  // Barisnya harus tetap ada: penghapusan perlu bisa disinkronkan, dan
  // kalau ternyata salah orang yang mendaftar, datanya masih terselamatkan.
  const { n } = raw.prepare('SELECT COUNT(*) AS n FROM food_logs').get();
  assert.equal(n, 1, 'barisnya tetap ada');

  const row = raw.prepare('SELECT deleted_at FROM food_logs LIMIT 1').get();
  assert.ok(row.deleted_at, 'hanya ditandai terhapus');
});

test('mendaftar ulang dengan email SAMA mempertahankan foto dan catatan', async (t) => {
  const { db, userId, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);
  await isiJejak(db, userId);

  // Ini jalur "lupa kata sandi lalu daftar ulang" — orangnya sama, jadi
  // tidak boleh kehilangan apa pun.
  const { user, discardedAvatar } = await registerAccount(db, userId, {
    ...AKUN,
    password: 'sandibaru123',
  });

  assert.equal(discardedAvatar, null, 'tidak ada foto yang perlu dibuang');
  assert.equal(user.avatar, 'file:///dokumen/avatars/lama.jpg');
  assert.equal(user.height, 182, 'profil tidak boleh direset');
  assert.equal((await dailyTotals(db, userId, '2026-09-16')).calories, 204);

  // Kata sandi barunya tetap berlaku
  const masuk = await verifyCredentials(db, {
    email: AKUN.email,
    password: 'sandibaru123',
  });
  assert.equal(masuk.ok, true);
});

test('email sama dengan beda huruf besar tetap dianggap orang yang sama', async (t) => {
  const { db, userId, close } = await dbBaru();
  t.after(close);

  await registerAccount(db, userId, AKUN);
  await isiJejak(db, userId);

  const { user } = await registerAccount(db, userId, {
    ...AKUN,
    email: 'IHSAN@Example.com',
    password: 'sandibaru123',
  });

  assert.equal(user.avatar, 'file:///dokumen/avatars/lama.jpg');
  assert.equal((await dailyTotals(db, userId, '2026-09-16')).calories, 204);
});
