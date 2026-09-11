/**
 * Data referensi nutrisi.
 *
 * Catatan makanan sendiri hidup di tabel `food_logs` (lihat `src/db/foodLogs.js`);
 * berkas ini hanya menyimpan hal yang tidak berubah per pengguna.
 */

/**
 * Waktu makan.
 *
 * `value` yang disimpan ke kolom `meal_slot`, `chip` untuk filter pendek di
 * layar tambah makanan, dan `label` untuk judul bagian.
 */
export const mealSlots = [
  { value: 'sarapan', chip: 'Sarapan', label: 'Sarapan' },
  { value: 'siang', chip: 'Siang', label: 'Makan Siang' },
  { value: 'malam', chip: 'Malam', label: 'Makan Malam' },
  { value: 'cemilan', chip: 'Cemilan', label: 'Cemilan' },
];

/**
 * Label porsi yang disimpan ke kolom `portion`: "1 porsi" atau "2 × 1 porsi".
 *
 * Dipakai layar tambah maupun layar ubah. Aturannya harus sama di keduanya —
 * kalau tidak, mengubah jumlah pada catatan lama akan menulis ulang labelnya
 * dengan bentuk yang berbeda dari catatan di sebelahnya.
 */
export function portionLabel(servingLabel, quantity) {
  return quantity === 1 ? servingLabel : `${quantity} × ${servingLabel}`;
}

export function slotLabel(value) {
  return mealSlots.find((slot) => slot.value === value)?.label ?? value;
}
