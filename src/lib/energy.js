/**
 * Kebutuhan energi harian: BMR dan TDEE.
 *
 * Dipisah dari `UserContext` karena sekarang dipakai DUA tempat: konteks
 * menghitungnya dari profil tersimpan, sedangkan layar pendaftaran perlu
 * menghitungnya dari angka yang baru saja diketik — sebelum apa pun disimpan.
 * Menyalin rumusnya ke layar berarti dua rumus yang bisa menyimpang diam-diam.
 */

/** Pengali TDEE dari BMR menurut tingkat aktivitas. */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

/**
 * Mifflin-St Jeor.
 *
 * Mengembalikan null kalau ada angka yang belum terisi, bukan NaN. NaN
 * menular: sekali muncul ia mengalir ke TDEE, target kalori, dan seluruh
 * makro, lalu tampil di layar sebagai "NaN kkal" tanpa petunjuk asalnya.
 */
export function hitungBmr({ beratKg, tinggiCm, umur, gender }) {
  if (!Number.isFinite(beratKg) || beratKg <= 0) return null;
  if (!Number.isFinite(tinggiCm) || tinggiCm <= 0) return null;

  // Umur boleh kosong (tanggal lahir belum diisi); dianggap nol seperti
  // perhitungan sebelumnya, supaya angkanya tetap muncul dan bisa dikoreksi.
  const dasar = 10 * beratKg + 6.25 * tinggiCm - 5 * (umur ?? 0);

  return Math.round(gender === 'Laki-Laki' ? dasar + 5 : dasar - 161);
}

/** TDEE = BMR x pengali aktivitas. Bawaan 'moderate' kalau tingkatnya tak dikenal. */
export function hitungTdee(bmr, activityLevel) {
  if (!Number.isFinite(bmr)) return null;

  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? ACTIVITY_MULTIPLIERS.moderate));
}
