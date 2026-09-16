/**
 * Validasi form masuk dan daftar (AUTH-2, AUTH-5).
 *
 * Fungsi murni tanpa akses database maupun React, sama seperti
 * `validateFood.js` — supaya bisa diuji terpisah dan aturannya tidak mungkin
 * berbeda antara satu layar dengan layar lain.
 *
 * **Aturan ditetapkan 16 Sep 2026**, menjawab pertanyaan terbuka di PRD:
 * kata sandi minimal 8 karakter, email harus punya bagian lokal dan domain
 * bertitik, nama depan wajib, konfirmasi harus sama persis.
 *
 * Sengaja TIDAK menuntut huruf besar, angka, atau simbol. Aturan komposisi
 * seperti itu menggeser orang ke kata sandi pendek yang mudah ditebak tapi
 * memenuhi syarat ("Passw0rd!") dan menjauhkan dari frasa panjang yang jauh
 * lebih kuat. Panjang yang menentukan, bukan ragam karakternya.
 *
 * **Batas yang harus disadari:** ini validasi BENTUK, bukan autentikasi.
 * Belum ada server yang memeriksa apakah akunnya benar-benar ada atau kata
 * sandinya cocok — itu AUTH-2 sisi backend, menunggu Supabase. Lolos di sini
 * hanya berarti isiannya masuk akal untuk dikirim, bukan bahwa penggunanya
 * sah.
 */

/** Panjang minimum kata sandi. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Pemeriksaan email yang sengaja longgar.
 *
 * Alamat email yang sah jauh lebih beragam daripada yang diduga kebanyakan
 * pola regex — kutip, tanda plus, dan unicode semuanya boleh. Yang ditolak di
 * sini hanya yang jelas keliru: tanpa `@`, tanpa domain, atau berisi spasi.
 * Penentu sebenarnya tetap email verifikasi, bukan regex.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_SHAPE.test(String(email ?? '').trim());
}

/**
 * Aturan kata sandi BARU, dipakai saat daftar maupun saat atur ulang.
 *
 * Dipisah supaya keduanya tidak mungkin menyimpang: kata sandi yang ditolak
 * saat mendaftar harus ditolak juga saat direset, dan sebaliknya.
 */
function passwordErrors(password, confirmPassword) {
  const errors = {};
  const pass = String(password ?? '');

  if (!pass) errors.password = 'Kata sandi wajib diisi.';
  else if (pass.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }

  // Konfirmasi hanya diperiksa kalau kata sandinya sendiri sudah sah — kalau
  // tidak, pengguna melihat dua pesan sekaligus untuk satu kesalahan.
  if (!errors.password) {
    if (!String(confirmPassword ?? '')) {
      errors.confirmPassword = 'Ulangi kata sandi.';
    } else if (String(confirmPassword) !== pass) {
      errors.confirmPassword = 'Kata sandi tidak sama.';
    }
  }

  return errors;
}

/** Form masuk: cukup email berbentuk sah dan kata sandi terisi. */
export function validateLogin({ email, password }) {
  const errors = {};

  const trimmedEmail = String(email ?? '').trim();
  if (!trimmedEmail) errors.email = 'Email wajib diisi.';
  else if (!isValidEmail(trimmedEmail)) errors.email = 'Format email belum benar.';

  // Panjang minimum TIDAK diperiksa saat masuk: akun lama bisa saja dibuat
  // dengan aturan berbeda, dan menolaknya di sini akan mengunci pemiliknya
  // sendiri. Yang berhak menolak kata sandi salah adalah server.
  if (!String(password ?? '')) errors.password = 'Kata sandi wajib diisi.';

  return { errors, valid: Object.keys(errors).length === 0 };
}

/** Form daftar tahap 1, termasuk persetujuan syarat layanan (AUTH-5). */
export function validateRegister({
  firstName,
  email,
  password,
  confirmPassword,
  agreed,
}) {
  const errors = {};

  if (!String(firstName ?? '').trim()) errors.firstName = 'Nama depan wajib diisi.';

  const trimmedEmail = String(email ?? '').trim();
  if (!trimmedEmail) errors.email = 'Email wajib diisi.';
  else if (!isValidEmail(trimmedEmail)) errors.email = 'Format email belum benar.';

  Object.assign(errors, passwordErrors(password, confirmPassword));

  // Nama belakang sengaja TIDAK diwajibkan: banyak orang Indonesia memang
  // hanya punya satu nama, dan memaksakannya akan menolak pengguna yang sah.
  if (!agreed) {
    errors.agreed = 'Centang persetujuan untuk melanjutkan.';
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}

/**
 * Form atur ulang kata sandi (AUTH-7).
 *
 * Emailnya diperiksa bentuknya di sini; apakah ia COCOK dengan akun terdaftar
 * diperiksa lapisan database, karena itu butuh membaca akunnya.
 */
export function validateResetPassword({ email, password, confirmPassword }) {
  const errors = {};

  const trimmedEmail = String(email ?? '').trim();
  if (!trimmedEmail) errors.email = 'Email wajib diisi.';
  else if (!isValidEmail(trimmedEmail)) errors.email = 'Format email belum benar.';

  Object.assign(errors, passwordErrors(password, confirmPassword));

  return { errors, valid: Object.keys(errors).length === 0 };
}
