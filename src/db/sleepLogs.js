import { format, parseISO, subDays } from 'date-fns';
import { newId, nowIso, todayLocal } from './helpers';
import { minutesBetween } from '../data/sleep';

/** Label sumbu grafik, diindeks `Date.getDay()` (0 = Minggu). */
const DAY_LABELS = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];

function toSleep(row) {
  return {
    id: row.id,
    loggedOn: row.logged_on,
    bedtime: row.bedtime,
    wakeTime: row.wake_time,
    durationMinutes: row.duration_minutes,
    quality: row.quality,
    notes: row.notes ?? '',
  };
}

/** Catatan tidur untuk satu tanggal, atau null kalau belum ada. */
export async function getSleepForDay(db, userId, loggedOn = todayLocal()) {
  const row = await db.getFirstAsync(
    `SELECT * FROM sleep_logs
      WHERE user_id = ? AND logged_on = ? AND deleted_at IS NULL`,
    [userId, loggedOn],
  );
  return row ? toSleep(row) : null;
}

/**
 * Menyimpan catatan tidur satu malam.
 *
 * `duration_minutes` sengaja dihitung DI SINI dari `bedtime` dan `wakeTime`,
 * dan tidak boleh dikirim oleh pemanggil. Kolom itu tetap disimpan supaya
 * query tren mingguan tidak perlu mengurai jam per baris — tapi dengan satu
 * jalur perhitungan, nilainya tidak mungkin berbeda dari sumbernya.
 *
 * Memakai UPSERT karena ada unique index pada (user_id, logged_on):
 * satu malam hanya boleh punya satu catatan.
 */
export async function upsertSleepLog(db, userId, entry, loggedOn = todayLocal()) {
  const durationMinutes = minutesBetween(entry.bedtime, entry.wakeTime);
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO sleep_logs
       (id, user_id, logged_on, bedtime, wake_time, duration_minutes, quality, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, logged_on) DO UPDATE SET
       bedtime          = excluded.bedtime,
       wake_time        = excluded.wake_time,
       duration_minutes = excluded.duration_minutes,
       quality          = excluded.quality,
       notes            = excluded.notes,
       updated_at       = excluded.updated_at,
       synced_at        = NULL,
       deleted_at       = NULL`,
    [
      newId(),
      userId,
      loggedOn,
      entry.bedtime,
      entry.wakeTime,
      durationMinutes,
      entry.quality ?? null,
      entry.notes ?? null,
      timestamp,
    ],
  );

  return durationMinutes;
}

/**
 * Durasi tidur 7 hari terakhir sampai `endDate`.
 *
 * Tanggal dibangkitkan di JS agar hari tanpa catatan tetap muncul sebagai
 * batang kosong — kalau hanya mengandalkan hasil query, grafiknya akan
 * melompati hari yang terlewat dan menyesatkan.
 */
export async function weeklyTrend(db, userId, endDate = todayLocal()) {
  const end = parseISO(endDate);
  const start = subDays(end, 6);
  const startDate = format(start, 'yyyy-MM-dd');

  const rows = await db.getAllAsync(
    `SELECT logged_on, duration_minutes FROM sleep_logs
      WHERE user_id = ? AND logged_on BETWEEN ? AND ? AND deleted_at IS NULL`,
    [userId, startDate, endDate],
  );

  const byDate = new Map(rows.map((row) => [row.logged_on, row.duration_minutes]));

  return Array.from({ length: 7 }, (_, offset) => {
    const date = subDays(end, 6 - offset);
    const key = format(date, 'yyyy-MM-dd');

    return {
      date: key,
      day: DAY_LABELS[date.getDay()],
      minutes: byDate.get(key) ?? 0,
      active: key === endDate,
    };
  });
}

/**
 * Mengisi riwayat tidur seminggu dengan contoh, hanya kalau pengguna belum
 * punya catatan sama sekali.
 *
 * Sementara, supaya grafik tren tidak kosong sebelum ada data asli. Hapus
 * fungsi ini beserta pemanggilnya setelah aplikasi dipakai beberapa hari.
 */
export async function seedDemoWeekIfEmpty(db, userId) {
  const { total } = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM sleep_logs WHERE user_id = ?',
    [userId],
  );
  if (total > 0) return;

  const demo = [
    { bedtime: '23:40', wakeTime: '06:00', quality: 'biasa' },
    { bedtime: '22:55', wakeTime: '06:00', quality: 'nyenyak' },
    { bedtime: '23:20', wakeTime: '06:00', quality: 'biasa' },
    { bedtime: '22:30', wakeTime: '06:20', quality: 'nyenyak' },
    { bedtime: '22:50', wakeTime: '06:10', quality: 'nyenyak' },
    { bedtime: '23:05', wakeTime: '06:00', quality: 'biasa' },
    { bedtime: '22:45', wakeTime: '06:20', quality: 'nyenyak' },
  ];

  const today = parseISO(todayLocal());

  await db.withTransactionAsync(async () => {
    for (let offset = 0; offset < demo.length; offset += 1) {
      const date = format(subDays(today, 6 - offset), 'yyyy-MM-dd');
      await upsertSleepLog(db, userId, demo[offset], date);
    }
  });
}
