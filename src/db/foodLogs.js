import { newId, nowIso, todayLocal } from './helpers';
import { mealSlots, slotLabel } from '../data/nutrition';

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

/** Menyimpan satu makanan ke log hari ini. */
export async function addFoodLog(db, userId, entry, loggedOn = todayLocal()) {
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO food_logs
       (id, user_id, logged_on, logged_at, meal_slot, name, portion, weight_g,
        calories, protein_g, carbs_g, fat_g, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      timestamp,
    ],
  );
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
 * Mengisi log hari ini dengan contoh, hanya kalau pengguna belum pernah
 * punya catatan makanan sama sekali.
 *
 * Ini penampung sementara supaya aplikasi tidak terlihat kosong sebelum
 * pencarian makanan (NUT-6) tersedia. Hapus fungsi ini beserta
 * pemanggilnya begitu makanan sudah bisa dicari dan ditambahkan sendiri.
 */
export async function seedDemoDayIfEmpty(db, userId) {
  const { total } = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM food_logs WHERE user_id = ?',
    [userId],
  );
  if (total > 0) return;

  const demo = [
    { slot: 'sarapan', name: 'Oatmeal & Pisang', portion: '1 mangkuk', calories: 320, protein: 12, carbs: 44, fat: 8 },
    { slot: 'sarapan', name: 'Telur Rebus (2 butir)', portion: '2 butir', calories: 130, protein: 11, carbs: 14, fat: 19 },
    { slot: 'siang', name: 'Ayam Geprek', portion: '1 porsi', calories: 520, protein: 42, carbs: 45, fat: 8 },
    { slot: 'siang', name: 'Kentang Goreng', portion: '1 porsi', calories: 130, protein: 2, carbs: 12, fat: 9 },
    { slot: 'malam', name: 'Pecel Ayam', portion: '1 porsi', calories: 620, protein: 42, carbs: 45, fat: 8 },
    { slot: 'malam', name: 'Kentang Rebus', portion: '1 porsi', calories: 130, protein: 2, carbs: 12, fat: 9 },
  ];

  await db.withTransactionAsync(async () => {
    for (const entry of demo) {
      await addFoodLog(db, userId, entry);
    }
  });
}
