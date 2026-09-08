/**
 * Data nutrisi contoh.
 *
 * Total per waktu makan dan total harian sengaja TIDAK disimpan sebagai angka
 * tetap — semuanya diturunkan dari daftar item lewat `sumItems()` supaya
 * ringkasan tidak pernah lagi berbeda dari isinya.
 */

/**
 * Target harian per program.
 *
 * Angka ini disimpan eksplisit, bukan diturunkan dari BMR/TDEE: nilai pada
 * mockup (2.400 kkal, P150/C250/F80) tidak bisa dihasilkan rumus apa pun untuk
 * tubuh user contoh, jadi tabel ini menjaga tampilan tetap sesuai desain
 * sekaligus membuat target ikut berubah saat program diganti.
 */
export const programTargets = {
  bulking: { calories: 2400, protein: 150, carbs: 250, fat: 80 },
  maintenance: { calories: 2000, protein: 130, carbs: 200, fat: 67 },
  cutting: { calories: 1700, protein: 150, carbs: 140, fat: 50 },
};

export function targetsFor(program) {
  return programTargets[program] ?? programTargets.maintenance;
}

export const meals = [
  {
    id: 'sarapan',
    name: 'Sarapan',
    time: '07:15',
    items: [
      { id: 'oatmeal', name: 'Oatmeal & Pisang', calories: 320, protein: 12, carbs: 44, fat: 8 },
      { id: 'telur', name: 'Telur Rebus (2 butir)', calories: 130, protein: 11, carbs: 14, fat: 19 },
    ],
  },
  {
    id: 'siang',
    name: 'Makan Siang',
    time: '12:30',
    items: [
      { id: 'ayam-geprek', name: 'Ayam Geprek', calories: 520, protein: 42, carbs: 45, fat: 8 },
      { id: 'kentang-goreng', name: 'Kentang Goreng', calories: 130, protein: 2, carbs: 12, fat: 9 },
    ],
  },
  {
    id: 'malam',
    name: 'Makan Malam',
    time: '19:00',
    items: [
      { id: 'pecel-ayam', name: 'Pecel Ayam', calories: 620, protein: 42, carbs: 45, fat: 8 },
      { id: 'kentang-rebus', name: 'Kentang Rebus', calories: 130, protein: 2, carbs: 12, fat: 9 },
    ],
  },
];

/** Menjumlahkan kalori dan makro dari sekumpulan item makanan. */
export function sumItems(items) {
  return items.reduce(
    (total, item) => ({
      calories: total.calories + item.calories,
      protein: total.protein + item.protein,
      carbs: total.carbs + item.carbs,
      fat: total.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** Total seluruh waktu makan hari ini. */
export function sumMeals(mealList = meals) {
  return sumItems(mealList.flatMap((meal) => meal.items));
}

export const mealSlots = ['Sarapan', 'Siang', 'Malam', 'Cemilan'];

/** Makanan yang sedang dilihat di layar tambah/detail makanan. */
export const foodDetail = {
  id: 'ayam-panggang-nasi-merah',
  name: 'Ayam Panggang & Nasi Merah',
  portion: '1 mangkuk',
  weight: '420 g',
  calories: 520,
  protein: 38,
  carbs: 62,
  fat: 14,
  mealSlot: 'Makan Siang',
  time: '12:30',
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
