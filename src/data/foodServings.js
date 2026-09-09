/**
 * Ukuran saji per kategori makanan.
 *
 * Berat per ukuran saji TIDAK ADA di data sumber — seluruhnya perkiraan.
 * Karena itu setiap makanan selalu mendapat "100 g" sebagai acuan pasti,
 * dan ukuran rumah tangga hanya sebagai kenyamanan.
 *
 * Disimpan di sini, bukan di dalam `foodCatalog.json`, karena ukuran saji
 * adalah turunan dari kategori. Menyimpannya per entri berarti menduplikasi
 * objek yang sama lebih dari seribu kali, dan mengubah satu berat porsi
 * menjadi pekerjaan regenerasi berkas alih-alih satu baris suntingan.
 */

const BY_CATEGORY = {
  'Makanan pokok': [
    { label: '1 porsi', grams: 150, isDefault: true },
    { label: '1 centong', grams: 75 },
  ],
  'Ayam & unggas': [
    { label: '1 potong', grams: 80, isDefault: true },
    { label: '1 porsi', grams: 150 },
  ],
  Daging: [
    { label: '1 potong', grams: 60, isDefault: true },
    { label: '1 porsi', grams: 120 },
  ],
  'Ikan & seafood': [
    { label: '1 ekor sedang', grams: 90, isDefault: true },
    { label: '1 porsi', grams: 120 },
  ],
  'Telur, tahu & tempe': [
    { label: '1 potong', grams: 50, isDefault: true },
    { label: '1 porsi', grams: 100 },
  ],
  Berkuah: [
    { label: '1 mangkuk', grams: 250, isDefault: true },
    { label: '1 porsi', grams: 200 },
  ],
  Sayur: [
    { label: '1 porsi', grams: 100, isDefault: true },
    { label: '1 mangkuk', grams: 150 },
  ],
  Buah: [
    { label: '1 buah sedang', grams: 100, isDefault: true },
    { label: '1 potong', grams: 50 },
  ],
  Minuman: [
    { label: '1 gelas', grams: 200, isDefault: true },
    { label: '1 sendok makan', grams: 15 },
  ],
  Camilan: [
    { label: '1 buah', grams: 40, isDefault: true },
    { label: '1 porsi', grams: 80 },
  ],
  Lainnya: [{ label: '1 porsi', grams: 100, isDefault: true }],
};

/**
 * Daftar ukuran saji untuk satu kategori, selalu memuat acuan 100 gram.
 *
 * Acuan "100 g" hanya ditambahkan kalau kategorinya belum punya ukuran
 * seberat itu. Beberapa kategori (sayur, buah, tahu) memang porsinya 100 g,
 * dan menambahkannya lagi membuat pemilih porsi berisi dua pilihan yang
 * sebenarnya sama.
 */
export function servingsForCategory(category) {
  const base = BY_CATEGORY[category] ?? BY_CATEGORY.Lainnya;
  const has100g = base.some((serving) => serving.grams === 100);

  return has100g ? [...base] : [...base, { label: '100 g', grams: 100 }];
}

export const foodCategories = Object.keys(BY_CATEGORY);

export default servingsForCategory;
