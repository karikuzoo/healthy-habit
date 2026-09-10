import { newId, nowIso } from './helpers';
import catalog from '../data/foodCatalog.json';
import { servingsForCategory } from '../data/foodServings';

/**
 * Akses katalog makanan.
 *
 * Katalog bawaan (`user_id IS NULL`) dan makanan buatan pengguna
 * (`user_id` terisi) hidup di tabel yang sama, karena keduanya berperilaku
 * identik saat dicari maupun dicatat. Satu tabel berarti satu jalur kode;
 * perbedaannya hanya soal sinkronisasi.
 */

/** Nama untuk kolom `name_search`: huruf kecil, spasi dirapikan. */
export function normalizeName(name) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function toFood(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    calories: row.calories,
    protein: row.protein_g,
    carbs: row.carbs_g,
    fat: row.fat_g,
    fiber: row.fiber_g,
    sugar: row.sugar_g,
    sodium: row.sodium_mg,
    cholesterol: row.cholesterol_mg,
    source: row.source,
    isCustom: row.user_id != null,
  };
}

function toServing(row) {
  return {
    id: row.id,
    label: row.label,
    grams: row.grams,
    isDefault: row.is_default === 1,
  };
}

/**
 * Mencari makanan berdasarkan potongan nama.
 *
 * Makanan buatan pengguna diurutkan lebih dulu: kalau seseorang sudah repot
 * membuat entri sendiri, itu yang paling sering dipakai. Nama yang lebih
 * pendek didahulukan karena biasanya lebih umum ("Nasi Putih" sebelum
 * "Nasi Putih Kukus Pandan").
 */
export async function searchFoods(db, userId, query, limit = 30) {
  const term = normalizeName(query ?? '');
  if (!term) return [];

  const rows = await db.getAllAsync(
    `SELECT * FROM foods
      WHERE deleted_at IS NULL
        AND (user_id IS NULL OR user_id = ?)
        AND name_search LIKE '%' || ? || '%'
      ORDER BY (user_id IS NOT NULL) DESC, length(name) ASC, name ASC
      LIMIT ?`,
    [userId, term, limit],
  );

  return rows.map(toFood);
}

/** Ukuran saji satu makanan; yang default diurutkan lebih dulu. */
export async function listServings(db, foodId) {
  const rows = await db.getAllAsync(
    `SELECT * FROM food_servings
      WHERE food_id = ? AND deleted_at IS NULL
      ORDER BY is_default DESC, grams ASC`,
    [foodId],
  );
  return rows.map(toServing);
}

/** Satu makanan beserta ukuran sajinya, atau null kalau tidak ada. */
export async function getFoodWithServings(db, foodId) {
  const row = await db.getFirstAsync(
    'SELECT * FROM foods WHERE id = ? AND deleted_at IS NULL',
    [foodId],
  );
  if (!row) return null;

  return { ...toFood(row), servings: await listServings(db, foodId) };
}

/**
 * Menyimpan satu makanan beserta ukuran sajinya dalam satu transaksi,
 * supaya tidak pernah ada makanan tanpa ukuran saji.
 *
 * `userId` null berarti entri katalog bawaan.
 */
export async function insertFood(db, food, servings, userId = null) {
  const foodId = food.id ?? newId();
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO foods
         (id, user_id, name, name_search, category,
          calories, protein_g, carbs_g, fat_g,
          fiber_g, sugar_g, sodium_mg, cholesterol_mg,
          source, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        foodId,
        userId,
        food.name,
        normalizeName(food.name),
        food.category ?? null,
        food.calories ?? 0,
        food.protein ?? 0,
        food.carbs ?? 0,
        food.fat ?? 0,
        food.fiber ?? null,
        food.sugar ?? null,
        food.sodium ?? null,
        food.cholesterol ?? null,
        food.source ?? (userId ? 'pengguna' : 'estimasi'),
        timestamp,
      ],
    );

    for (const serving of servings) {
      await db.runAsync(
        `INSERT INTO food_servings
           (id, food_id, label, grams, is_default, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newId(),
          foodId,
          serving.label,
          serving.grams,
          serving.isDefault ? 1 : 0,
          timestamp,
        ],
      );
    }
  });

  return foodId;
}

/**
 * Memperbarui nilai gizi satu makanan.
 *
 * Entri katalog bawaan (`user_id IS NULL`) diubah DI TEMPAT, tidak disalin
 * jadi milik pengguna. Alasannya: katalog itu data referensi yang disemai di
 * perangkat ini, dan menyalinnya akan membuat dua entri bernama sama muncul
 * di pencarian — yang asli (salah) dan salinannya (benar). Konsekuensinya,
 * koreksi bersifat lokal per perangkat; itu diterima karena baris berlabel
 * `user_id IS NULL` memang tidak ikut sinkronisasi.
 *
 * Sumbernya ditandai 'dikoreksi' supaya bisa dibedakan dari angka dataset
 * asli maupun dari makanan yang dibuat pengguna sejak awal.
 *
 * Ukuran saji dibuat ulang HANYA kalau kategorinya berubah atau berat porsi
 * diisi — ukuran saji mengikuti kategori, jadi mengubah kategori tanpa
 * memperbarui ukurannya akan meninggalkan porsi yang tidak masuk akal.
 */
export async function updateFood(db, foodId, food, options = {}) {
  const timestamp = nowIso();
  const existing = await db.getFirstAsync('SELECT * FROM foods WHERE id = ?', [foodId]);
  if (!existing) return null;

  const isCatalog = existing.user_id == null;
  const source = isCatalog ? 'dikoreksi' : (existing.source ?? 'pengguna');

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE foods
          SET name = ?, name_search = ?, category = ?,
              calories = ?, protein_g = ?, carbs_g = ?, fat_g = ?,
              fiber_g = ?, sugar_g = ?, sodium_mg = ?, cholesterol_mg = ?,
              source = ?, updated_at = ?, synced_at = NULL
        WHERE id = ?`,
      [
        food.name,
        normalizeName(food.name),
        food.category ?? existing.category,
        food.calories ?? 0,
        food.protein ?? 0,
        food.carbs ?? 0,
        food.fat ?? 0,
        food.fiber ?? null,
        food.sugar ?? null,
        food.sodium ?? null,
        food.cholesterol ?? null,
        source,
        timestamp,
        foodId,
      ],
    );

    if (options.servings) {
      // Soft delete, bukan DELETE: catatan lama menyimpan salinan angkanya
      // sendiri, tetapi penghapusan tetap harus bisa disinkronkan.
      await db.runAsync(
        `UPDATE food_servings
            SET deleted_at = ?, updated_at = ?, synced_at = NULL
          WHERE food_id = ? AND deleted_at IS NULL`,
        [timestamp, timestamp, foodId],
      );

      for (const serving of options.servings) {
        await db.runAsync(
          `INSERT INTO food_servings
             (id, food_id, label, grams, is_default, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [newId(), foodId, serving.label, serving.grams, serving.isDefault ? 1 : 0, timestamp],
        );
      }
    }
  });

  return getFoodWithServings(db, foodId);
}

/**
 * Mencari satu entri katalog bawaan berdasarkan nama persis, beserta ukuran
 * sajinya. Dipakai penyemai data contoh dan jalur peningkatan data.
 *
 * Memakai `name_search` yang sudah ternormalkan, sehingga beda huruf besar
 * atau spasi ganda tidak membuatnya gagal ketemu.
 */
export async function findCatalogFoodByName(db, name) {
  const row = await db.getFirstAsync(
    `SELECT * FROM foods
      WHERE user_id IS NULL AND deleted_at IS NULL
        AND (name_search = ? OR name_search LIKE ? || ' %')
      LIMIT 1`,
    [normalizeName(name), normalizeName(name)],
  );
  if (!row) return null;

  return { ...toFood(row), servings: await listServings(db, row.id) };
}

/** Jumlah entri katalog bawaan — dipakai untuk memutuskan perlu seed atau tidak. */
export async function countCatalogFoods(db) {
  const { total } = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM foods WHERE user_id IS NULL AND deleted_at IS NULL',
  );
  return total;
}

/**
 * Menyemai katalog bawaan pada peluncuran pertama.
 *
 * Memakai prepared statement di dalam satu transaksi: seribu lebih makanan
 * beserta ukuran sajinya berarti ribuan INSERT, dan menyiapkan pernyataannya
 * sekali jauh lebih cepat daripada mengurai SQL yang sama berulang kali.
 *
 * Label sumber diambil per entri dari katalog, bukan diseragamkan: mayoritas
 * berlabel 'dataset-eksternal' (asalnya belum terverifikasi, jadi menandainya
 * 'tkpi-2017' akan mengaku-aku asal yang tidak dapat dibuktikan), sementara
 * baris yang angkanya dikoreksi manual berlabel 'estimasi'.
 */
export async function seedCatalogIfEmpty(db) {
  if ((await countCatalogFoods(db)) > 0) return 0;

  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    const insertFoodStmt = await db.prepareAsync(
      `INSERT INTO foods
         (id, user_id, name, name_search, category,
          calories, protein_g, carbs_g, fat_g, source, updated_at)
       VALUES ($id, NULL, $name, $search, $category,
               $calories, $protein, $carbs, $fat, $source, $ts)`,
    );
    const insertServingStmt = await db.prepareAsync(
      `INSERT INTO food_servings (id, food_id, label, grams, is_default, updated_at)
       VALUES ($id, $foodId, $label, $grams, $isDefault, $ts)`,
    );

    try {
      for (const food of catalog) {
        const foodId = newId();

        await insertFoodStmt.executeAsync({
          $id: foodId,
          $name: food.name,
          $search: food.nameSearch,
          $category: food.category,
          $calories: food.calories,
          $protein: food.protein,
          $carbs: food.carbs,
          $fat: food.fat,
          $source: food.source ?? 'dataset-eksternal',
          $ts: timestamp,
        });

        for (const serving of servingsForCategory(food.category)) {
          await insertServingStmt.executeAsync({
            $id: newId(),
            $foodId: foodId,
            $label: serving.label,
            $grams: serving.grams,
            $isDefault: serving.isDefault ? 1 : 0,
            $ts: timestamp,
          });
        }
      }
    } finally {
      await insertFoodStmt.finalizeAsync();
      await insertServingStmt.finalizeAsync();
    }
  });

  return catalog.length;
}

/**
 * Menghitung gizi untuk sejumlah porsi tertentu.
 *
 * Gizi katalog tersimpan per 100 gram, jadi semuanya diskalakan oleh berat
 * total. Hasilnya dipakai sebagai salinan angka di baris `food_logs`, bukan
 * dihitung ulang setiap kali ditampilkan.
 */
export function scaleNutrition(food, servingGrams, quantity = 1) {
  const factor = (servingGrams * quantity) / 100;

  return {
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor),
    carbs: Math.round(food.carbs * factor),
    fat: Math.round(food.fat * factor),
    grams: servingGrams * quantity,
  };
}
