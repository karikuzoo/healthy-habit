import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  validateLogin,
  validateRegister,
} from '../src/lib/validateAuth.js';

/**
 * Validasi form masuk dan daftar (AUTH-2, AUTH-5).
 *
 * Aturan di sini adalah keputusan produk, bukan detail teknis — PRD sempat
 * menandainya sebagai pertanyaan terbuka. Uji ini yang membuatnya tidak
 * bergeser diam-diam.
 */

const DAFTAR_SAH = {
  firstName: 'Ihsan',
  lastName: 'Rahman',
  email: 'ihsan@example.com',
  password: 'rahasia123',
  confirmPassword: 'rahasia123',
  agreed: true,
};

test('isValidEmail menolak yang jelas keliru, menerima yang tidak biasa tapi sah', () => {
  assert.equal(isValidEmail('ihsan@example.com'), true);

  // Bentuk sah yang sering ditolak regex terlalu ketat — tanda plus dan
  // subdomain keduanya dipakai orang sungguhan.
  assert.equal(isValidEmail('ihsan+tag@mail.example.co.id'), true);

  assert.equal(isValidEmail('ihsan'), false, 'tanpa @');
  assert.equal(isValidEmail('ihsan@example'), false, 'domain tanpa titik');
  assert.equal(isValidEmail('ihsan @example.com'), false, 'mengandung spasi');
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail(null), false);
});

test('masuk menolak kolom kosong', () => {
  // Inti perbaikannya: sebelum ini, tombol Masuk berhasil dengan kedua
  // kolom kosong.
  const kosong = validateLogin({ email: '', password: '' });

  assert.equal(kosong.valid, false);
  assert.ok(kosong.errors.email);
  assert.ok(kosong.errors.password);

  assert.equal(validateLogin({ email: 'a@b.co', password: 'x' }).valid, true);
});

test('masuk TIDAK menuntut panjang minimum kata sandi', () => {
  // Akun lama bisa dibuat dengan aturan berbeda. Menolaknya saat masuk akan
  // mengunci pemiliknya sendiri — yang berhak menolak adalah server.
  const pendek = validateLogin({ email: 'a@b.co', password: 'abc' });

  assert.equal(pendek.valid, true);
  assert.equal(pendek.errors.password, undefined);
});

test('daftar yang lengkap dan benar lolos', () => {
  assert.equal(validateRegister(DAFTAR_SAH).valid, true);
});

test('daftar menuntut kata sandi minimal 8 karakter', () => {
  const pendek = validateRegister({
    ...DAFTAR_SAH,
    password: 'abc123',
    confirmPassword: 'abc123',
  });

  assert.equal(pendek.valid, false);
  assert.match(pendek.errors.password, new RegExp(String(MIN_PASSWORD_LENGTH)));

  // Frasa panjang tanpa angka maupun simbol harus DITERIMA: panjang yang
  // menentukan kekuatannya, bukan ragam karakternya.
  const frasa = validateRegister({
    ...DAFTAR_SAH,
    password: 'kucing oren lompat pagar',
    confirmPassword: 'kucing oren lompat pagar',
  });
  assert.equal(frasa.valid, true);
});

test('konfirmasi kata sandi harus sama', () => {
  const beda = validateRegister({ ...DAFTAR_SAH, confirmPassword: 'rahasia124' });

  assert.equal(beda.valid, false);
  assert.ok(beda.errors.confirmPassword);
});

test('kata sandi terlalu pendek tidak ikut memunculkan galat konfirmasi', () => {
  // Satu kesalahan harus menghasilkan satu pesan. Kalau keduanya muncul,
  // pengguna mengira ada dua hal yang salah padahal cuma satu.
  const pendek = validateRegister({
    ...DAFTAR_SAH,
    password: 'abc',
    confirmPassword: 'abc',
  });

  assert.ok(pendek.errors.password);
  assert.equal(pendek.errors.confirmPassword, undefined);
});

test('persetujuan syarat layanan wajib dicentang (AUTH-5)', () => {
  const belumCentang = validateRegister({ ...DAFTAR_SAH, agreed: false });

  assert.equal(belumCentang.valid, false, 'tanpa centang tidak boleh lanjut');
  assert.ok(belumCentang.errors.agreed);
});

test('nama depan wajib, nama belakang tidak', () => {
  const tanpaDepan = validateRegister({ ...DAFTAR_SAH, firstName: '   ' });
  assert.equal(tanpaDepan.valid, false);
  assert.ok(tanpaDepan.errors.firstName);

  // Banyak orang Indonesia hanya punya satu nama; mewajibkan nama belakang
  // akan menolak pengguna yang sah.
  const tanpaBelakang = validateRegister({ ...DAFTAR_SAH, lastName: '' });
  assert.equal(tanpaBelakang.valid, true);
});

test('semua kesalahan dilaporkan sekaligus, bukan satu per satu', () => {
  // Kalau hanya kesalahan pertama yang ditampilkan, pengguna harus menekan
  // tombol berkali-kali untuk menemukan sisanya.
  const berantakan = validateRegister({
    firstName: '',
    lastName: '',
    email: 'bukan-email',
    password: 'abc',
    confirmPassword: '',
    agreed: false,
  });

  assert.deepEqual(
    Object.keys(berantakan.errors).sort(),
    ['agreed', 'email', 'firstName', 'password'],
  );
});

test('atur ulang memakai aturan kata sandi yang SAMA dengan daftar', async () => {
  const { validateResetPassword } = await import('../src/lib/validateAuth.js');

  // Kalau keduanya menyimpang, kata sandi yang ditolak saat mendaftar bisa
  // lolos lewat jalur reset — atau sebaliknya, pengguna terjebak.
  const pendek = validateResetPassword({
    email: 'a@b.co',
    password: 'abc123',
    confirmPassword: 'abc123',
  });
  assert.equal(pendek.valid, false);
  assert.match(pendek.errors.password, new RegExp(String(MIN_PASSWORD_LENGTH)));

  const beda = validateResetPassword({
    email: 'a@b.co',
    password: 'rahasia123',
    confirmPassword: 'rahasia124',
  });
  assert.equal(beda.valid, false);
  assert.ok(beda.errors.confirmPassword);

  const benar = validateResetPassword({
    email: 'a@b.co',
    password: 'rahasia123',
    confirmPassword: 'rahasia123',
  });
  assert.equal(benar.valid, true);
});

test('atur ulang tetap menuntut email berbentuk sah', async () => {
  const { validateResetPassword } = await import('../src/lib/validateAuth.js');

  const hasil = validateResetPassword({
    email: 'bukan-email',
    password: 'rahasia123',
    confirmPassword: 'rahasia123',
  });

  assert.equal(hasil.valid, false);
  assert.ok(hasil.errors.email);
});
