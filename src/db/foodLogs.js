import { newId, nowIso, todayLocal } from './helpers';
import { mealSlots, slotLabel } from '../data/nutrition';
import { findCatalogFoodByName, scaleNutrition } from './foods';

const SLOT_ORDER = mealSlots.map((slot) => slot.value);

/**
 * Total kalori & makro satu hari, dijumlahkan oleh SQLite.
 *
 * Sengaja diagregasi di SQL, bukan dengan memuat semua baris lalu
 * menjumlahkannya di JS — biar tetap murah setelah data bertahun-tahun.
 */
export async function dailyTotals(db, userId, loggedOn = todayLocal()) {
  const row = await db.getFirstAsync(
    `SELECT COALESCE(SUM(calories), 0)  AS calories,
            COALESCE(SUM(protein_g), 0) AS protein,
            COALESCE(SUM(carbs_g), 0)   AS carbs,
            COALESCE(SUM(fat_g), 0)     AS fat
       FROM food_logs
      WHERE user_id = ? AND logged_on = ? AND deleted_at IS NULL`,
    [userId, loggedOn],
  );

  return {
    calories: Math.round(row.calories),
    protein: Math.round(row.protein),
    carbs: Math.round(row.carbs),
    fat: Math.round(row.fat),
  };
}

/** Baris DB -> bentuk item makanan yang dipakai UI. */
function toItem(row) {
  return {
    id: row.id,
    foodId: row.food_id,
    name: row.name,
    portion: row.portion,
    calories: row.calories,
    protein: row.protein_g,
    carbs: row.carbs_g,
    fat: row.fat_g,
  };
}

/**
 * Catatan makanan satu hari, dikelompokkan per waktu makan.
 *
 * Satu query lalu dikelompokkan di JS — lebih murah daripada satu query
 * per waktu makan. Waktu makan yang belum ada isinya tidak dikembalikan.
 */
export async function listMealsForDay(db, userId, loggedOn = todayLocal()) {
  const rows = await db.getAllAsync(
    `SELECT * FROM food_logs
      WHERE user_id = ? AND logged_on = ? AND deleted_at IS NULL
      ORDER BY logged_at ASC`,
    [userId, loggedOn],
  );

  const bySlot = new Map();

  for (const row of rows) {
    if (!bySlot.has(row.meal_slot)) bySlot.set(row.meal_slot, []);
    bySlot.get(row.meal_slot).push(toItem(row));
  }

  return SLOT_ORDER.filter((slot) => bySlot.has(slot)).map((slot) => {
    const items = bySlot.get(slot);

    return {
      slot,
      label: slotLabel(slot),
      items,
      totals: items.reduce(
        (total, item) => ({
          calories: total.calories + item.calories,
          protein: total.protein + item.protein,
          carbs: total.carbs + item.carbs,
          fat: total.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    };
  });
}

/**
 * Satu baris catatan makanan beserta salinan angkanya.
 *
 * Yang dikembalikan adalah apa yang BENAR-BENAR tercatat — bukan nilai
 * katalog saat ini. Itu bedanya dengan `getFoodWithServings`, dan itulah yang
 * harus ditampilkan saat pengguna membuka catatannya sendiri.
 */
export async function getFoodLog(db, foodLogId) {
  const row = await db.getFirstAsync(
    'SELECT * FROM food_logs WHERE id = ? AND deleted_at IS NULL',
    [foodLogId],
  );
  if (!row) return null;

  return {
    id: row.id,
    foodId: row.food_id,
    name: row.name,
    portion: row.portion,
    servingLabel: row.serving_label,
    servingGrams: row.serving_grams,
    quantity: row.quantity,
    weightG: row.weight_g,
    calories: row.calories,
    protein: row.protein_g,
    carbs: row.carbs_g,
    fat: row.fat_g,
    mealSlot: row.meal_slot,
    loggedOn: row.logged_on,
  };
}

/**
 * Menyimpan satu makanan ke log hari ini.
 *
 * Nama dan angka gizinya disalin ke baris log, bukan hanya dirujuk lewat
 * `food_id`. Dengan begitu mengoreksi entri katalog tidak mengubah riwayat
 * yang sudah tercatat — dan catatan tetap utuh meski makanannya kelak
 * dihapus dari katalog.
 */
export async function addFoodLog(db, userId, entry, loggedOn = todayLocal()) {
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO food_logs
       (id, user_id, logged_on, logged_at, meal_slot, name, portion, weight_g,
        calories, protein_g, carbs_g, fat_g,
        food_id, serving_label, serving_grams, quantity, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId(),
      userId,
      loggedOn,
      timestamp,
      entry.slot,
      entry.name,
      entry.portion ?? null,
      entry.weightG ?? null,
      entry.calories ?? 0,
      entry.protein ?? 0,
      entry.carbs ?? 0,
      entry.fat ?? 0,
      entry.foodId ?? null,
      entry.servingLabel ?? null,
      entry.servingGrams ?? null,
      entry.quantity ?? null,
      timestamp,
    ],
  );
}

/**
 * Menyimpan beberapa makanan sekaligus dalam satu transaksi.
 *
 * Sepiring makan biasanya beberapa item, dan menyimpannya satu per satu
 * membuka kemungkinan separuh tercatat kalau ada yang gagal di tengah jalan.
 */
export async function addFoodLogs(db, userId, entries, loggedOn = todayLocal()) {
  if (entries.length === 0) return;

  await db.withTransactionAsync(async () => {
    for (const entry of entries) {
      await addFoodLog(db, userId, entry, loggedOn);
    }
  });
}

/**
 * Soft delete: baris tetap ada agar penghapusannya bisa disinkronkan.
 * `synced_at` dikosongkan supaya ikut terangkut sinkronisasi berikutnya.
 */
export async function softDeleteFoodLog(db, foodLogId) {
  const timestamp = nowIso();

  await db.runAsync(
    `UPDATE food_logs
        SET deleted_at = ?, updated_at = ?, synced_at = NULL
      WHERE id = ?`,
    [timestamp, timestamp, foodLogId],
  );
}

/**
 * Susunan makan sehari untuk data contoh.
 *
 * Hanya nama dan jumlah yang ditulis di sini — angka gizinya diambil dari
 * katalog, bukan ditulis ulang. Sebelumnya data contoh memakai makanan
 * karangan ("Ayam Geprek", "Pecel Ayam") yang tidak ada di katalog, sehingga
 * catatannya tidak punya `food_id` dan tidak bisa dibuka detailnya.
 */
const DEMO_DAY = [
  { slot: 'sarapan', name: 'Telur Ceplok', quantity: 1 },
  { slot: 'sarapan', name: 'Susu Sapi Segar', quantity: 1 },
  { slot: 'sarapan', name: 'Pisang Ambon', quantity: 1 },
  { slot: 'siang', name: 'Nasi Putih', quantity: 1 },
  { slot: 'siang', name: 'Ayam goreng paha', quantity: 1 },
  { slot: 'siang', name: 'Tahu goreng', quantity: 2 },
  { slot: 'malam', name: 'Nasi Putih', quantity: 1 },
  { slot: 'malam', name: 'Ikan Bandeng', quantity: 1 },
  { slot: 'malam', name: 'Tempe Goreng', quantity: 1 },
];

/**
 * Mengisi log hari ini dengan contoh, hanya kalau pengguna belum pernah
 * punya catatan makanan sama sekali.
 *
 * Penampung sementara supaya aplikasi tidak terlihat kosong pada peluncuran
 * pertama. Hapus fungsi ini beserta pemanggilnya begitu tidak diperlukan lagi.
 *
 * Makanan yang tidak ditemukan di katalog dilewati, bukan membuat penyemaian
 * gagal — regenerasi katalog bisa mengubah nama, dan itu tidak boleh membuat
 * aplikasi tidak bisa dibuka.
 */
export async function seedDemoDayIfEmpty(db, userId) {
  const { total } = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM food_logs WHERE user_id = ?',
    [userId],
  );
  if (total > 0) return;

  const entries = [];

  for (const item of DEMO_DAY) {
    const food = await findCatalogFoodByName(db, item.name);
    if (!food || food.servings.length === 0) continue;

    const serving = food.servings.find((s) => s.isDefault) ?? food.servings[0];
    const scaled = scaleNutrition(food, serving.grams, item.quantity);

    entries.push({
      foodId: food.id,
      slot: item.slot,
      name: food.name,
      portion: item.quantity === 1 ? serving.label : `${item.quantity} × ${serving.label}`,
      servingLabel: serving.label,
      servingGrams: serving.grams,
      quantity: item.quantity,
      weightG: scaled.grams,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
    });
  }

  await addFoodLogs(db, userId, entries);
}
