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

export function slotLabel(value) {
  return mealSlots.find((slot) => slot.value === value)?.label ?? value;
}
