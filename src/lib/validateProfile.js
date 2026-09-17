import { parseDecimal } from './parseNumber';
import { isValidEmail } from './validateAuth';

/**
 * Validasi layar Edit profil (PROF-2).
 *
 * Yang paling penting di sini adalah EMAIL. Ia bukan sekadar keterangan
 * kontak — ia identitas masuk (lihat `verifyCredentials`). Kolom ini
 * sebelumnya tersimpan apa adanya tanpa diperiksa sama sekali, jadi
 * mengosongkannya atau mengetik alamat ngawur akan mengunci pemiliknya dari
 * akunnya sendiri, tanpa peringatan apa pun.
 *
 * Batas tinggi dan berat di bawah adalah batas KEMUSTAHILAN, bukan rentang
 * "wajar" — tidak ada manusia setinggi 3 meter. Rentang wajarnya sendiri
 * masih pertanyaan terbuka di PRD, dan bukan tempat saya memutuskannya.
 * Aturan ini hanya mencegah angka yang jelas keliru ketik.
 */

/** Batas kemustahilan fisik, bukan batas kewajaran. */
export const MAX_HEIGHT_CM = 300;
export const MAX_WEIGHT_KG = 500;

/** Angka tubuh: wajib terisi, positif, dan tidak mustahil. */
function measurementError(raw, { label, max, unit }) {
  const value = parseDecimal(raw);

  if (value == null) return `${label} wajib diisi.`;
  if (value <= 0) return `${label} harus lebih dari nol.`;
  if (value > max) return `${label} tidak mungkin lebih dari ${max} ${unit}.`;

  return null;
}

export function validateProfileEdit({ name, email, height, weight }) {
  const errors = {};

  if (!String(name ?? '').trim()) errors.name = 'Nama wajib diisi.';

  const trimmedEmail = String(email ?? '').trim();
  if (!trimmedEmail) errors.email = 'Email wajib diisi.';
  else if (!isValidEmail(trimmedEmail)) errors.email = 'Format email belum benar.';

  const heightError = measurementError(height, {
    label: 'Tinggi',
    max: MAX_HEIGHT_CM,
    unit: 'cm',
  });
  if (heightError) errors.height = heightError;

  const weightError = measurementError(weight, {
    label: 'Berat',
    max: MAX_WEIGHT_KG,
    unit: 'kg',
  });
  if (weightError) errors.weight = weightError;

  return { errors, valid: Object.keys(errors).length === 0 };
}

/**
 * Apakah email yang diketik berbeda dari email akun saat ini.
 *
 * Dipakai untuk memperingatkan bahwa mengubahnya memindahkan identitas
 * masuk — pengguna hampir selalu mengira kolom ini sekadar keterangan
 * kontak.
 */
export function isChangingLoginEmail(nextEmail, currentEmail) {
  const next = String(nextEmail ?? '').trim().toLowerCase();
  const current = String(currentEmail ?? '').trim().toLowerCase();

  return Boolean(next) && Boolean(current) && next !== current;
}
