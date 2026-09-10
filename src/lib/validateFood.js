import { parseDecimal } from './parseNumber';

/** Kalori per 100 g tidak mungkin melebihi lemak murni (100 g x 9 kkal). */
export const MAX_CALORIES = 900;

/** Ambang peringatan selisih kalori terhadap hitungan makro. */
const DRIFT_WARNING = 0.25;

/**
 * Mengubah isian form (semuanya string) menjadi angka.
 * Memakai `parseDecimal` supaya desimal berkoma ala Indonesia terbaca benar.
 */
export function parseFoodForm(form) {
  return {
    name: form.name ?? '',
    category: form.category,
    calories: parseDecimal(form.calories),
    protein: parseDecimal(form.protein),
    carbs: parseDecimal(form.carbs),
    fat: parseDecimal(form.fat),
    fiber: parseDecimal(form.fiber),
    sugar: parseDecimal(form.sugar),
    sodium: parseDecimal(form.sodium),
    cholesterol: parseDecimal(form.cholesterol),
    servingGrams: parseDecimal(form.servingGrams),
  };
}

/**
 * Memeriksa nilai gizi per 100 gram.
 *
 * Dibedakan tegas antara dua hal, dan pembedaan itu disengaja:
 *
 * - `errors` MENGHALANGI penyimpanan — hanya untuk yang mustahil secara
 *   fisik: makro melebihi 100 g per 100 g, kalori di atas lemak murni,
 *   nilai negatif.
 * - `warning` hanya MEMBERI TAHU — kalori yang tampak tidak konsisten dengan
 *   makronya bisa saja memang begitu di label kemasan, karena faktor Atwater
 *   beragam per bahan. Memblokirnya akan menolak data yang benar.
 *
 * Dipakai bersama oleh layar makanan baru dan layar ubah makanan, supaya
 * aturannya tidak mungkin berbeda di antara keduanya.
 */
export function validateFood(parsed) {
  const errors = {};

  if (!parsed.name.trim()) errors.name = 'Nama makanan wajib diisi.';

  for (const key of ['calories', 'protein', 'carbs', 'fat']) {
    const value = parsed[key];
    if (value == null) errors[key] = 'Wajib diisi.';
    else if (value < 0) errors[key] = 'Tidak boleh negatif.';
  }

  for (const key of ['fiber', 'sugar', 'sodium', 'cholesterol']) {
    if (parsed[key] != null && parsed[key] < 0) errors[key] = 'Tidak boleh negatif.';
  }

  if (parsed.calories != null && parsed.calories > MAX_CALORIES) {
    errors.calories = `Maksimal ${MAX_CALORIES} kkal per 100 g.`;
  }

  const macroSum = (parsed.protein ?? 0) + (parsed.carbs ?? 0) + (parsed.fat ?? 0);
  if (macroSum > 100) {
    errors.macroSum =
      `Protein + karbo + lemak = ${macroSum.toFixed(1)} g, ` +
      'tidak mungkin lebih dari 100 g per 100 g.';
  }

  if (parsed.servingGrams != null && parsed.servingGrams <= 0) {
    errors.servingGrams = 'Berat porsi harus lebih dari nol.';
  }

  let warning = null;
  if (Object.keys(errors).length === 0 && parsed.calories > 0) {
    const computed = parsed.protein * 4 + parsed.carbs * 4 + parsed.fat * 9;
    const drift = Math.abs(computed - parsed.calories) / parsed.calories;

    if (drift > DRIFT_WARNING) {
      warning =
        `Dari makronya, kalorinya sekitar ${Math.round(computed)} kkal — selisih ` +
        `${Math.round(drift * 100)}% dari yang kamu isi. Periksa lagi kalau ini ` +
        'bukan dari label kemasan.';
    }
  }

  return { errors, warning, valid: Object.keys(errors).length === 0 };
}

export default validateFood;
