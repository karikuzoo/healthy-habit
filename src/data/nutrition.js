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

/**
 * Makanan yang sedang dilihat di layar tambah/detail makanan.
 *
 * Penampung sementara sampai pencarian makanan (NUT-6) tersedia — sumber
 * basis data makanan masih perlu diputuskan.
 */
export const foodDetail = {
  id: 'ayam-panggang-nasi-merah',
  name: 'Ayam Panggang & Nasi Merah',
  portion: '1 mangkuk',
  weight: '420 g',
  weightG: 420,
  calories: 520,
  protein: 38,
  carbs: 62,
  fat: 14,
  micros: [
    { label: 'Serat', value: '4.2 g' },
    { label: 'Gula', value: '8 g' },
    { label: 'Sodium', value: '580 mg' },
    { label: 'Kolesterol', value: '85 mg' },
    { label: 'Vitamin A', value: '12%' },
    { label: 'Vitamin C', value: '8%' },
    { label: 'Kalsium', value: '4%' },
    { label: 'Zat Besi', value: '15%' },
  ],
};
