import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestDb } from './helpers/db.mjs';
import { getSleepForDay, upsertSleepLog, weeklyTrend } from '../src/db/sleepLogs.js';

/**
 * Catatan tidur (SLEEP-8).
 *
 * Satu catatan per malam, dijamin unique index — bukan oleh kode pemanggil.
 */

const HARI = '2026-09-12';

test('durasi dihitung di lapisan database, bukan dikirim pemanggil', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  // `duration_minutes` disimpan supaya query tren tidak perlu mengurai jam
  // per baris. Satu-satunya jalan menghitungnya ada di sini, jadi nilainya
  // tidak mungkin berbeda dari bedtime/wakeTime yang jadi sumbernya.
  const durasi = await upsertSleepLog(
    db,
    userId,
    { bedtime: '22:45', wakeTime: '06:20', quality: 'nyenyak' },
    HARI,
  );

  assert.equal(durasi, 455, 'melewati tengah malam harus terhitung benar');

  const row = await getSleepForDay(db, userId, HARI);
  assert.equal(row.durationMinutes, 455);
  assert.equal(row.quality, 'nyenyak');
});

test('mencatat ulang malam yang sama MENGUBAH, bukan menggandakan', async (t) => {
  const { db, userId, raw, close } = await createTestDb();
  t.after(close);

  await upsertSleepLog(db, userId, { bedtime: '23:00', wakeTime: '06:00' }, HARI);
  await upsertSleepLog(db, userId, { bedtime: '22:00', wakeTime: '06:00' }, HARI);

  const { n } = raw.prepare('SELECT COUNT(*) AS n FROM sleep_logs').get();
  assert.equal(n, 1, 'unique index yang menjaganya, bukan kode pemanggil');

  assert.equal((await getSleepForDay(db, userId, HARI)).durationMinutes, 480);
});

test('malam tanpa catatan mengembalikan null, bukan baris kosong', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  assert.equal(await getSleepForDay(db, userId, HARI), null);
});

test('weeklyTrend selalu 7 hari, hari terlewat jadi nol', async (t) => {
  const { db, userId, close } = await createTestDb();
  t.after(close);

  await upsertSleepLog(db, userId, { bedtime: '23:00', wakeTime: '06:00' }, '2026-09-12');
  await upsertSleepLog(db, userId, { bedtime: '22:00', wakeTime: '06:00' }, '2026-09-10');

  const trend = await weeklyTrend(db, userId, '2026-09-12');

  // Tanggal dibangkitkan di JS, bukan diambil dari hasil query — kalau hanya
  // mengandalkan query, grafiknya akan melompati hari yang terlewat dan
  // memberi kesan tidurnya lebih rapat dari kenyataan.
  assert.equal(trend.length, 7);
  assert.equal(trend.at(-1).date, '2026-09-12');
  assert.equal(trend.at(-1).minutes, 420);
  assert.equal(trend.at(-1).active, true, 'hari terakhir ditandai aktif');

  const terlewat = trend.find((d) => d.date === '2026-09-11');
  assert.equal(terlewat.minutes, 0, 'hari tanpa catatan tetap muncul sebagai nol');

  assert.ok(trend.every((d) => d.day.length === 2), 'label sumbu dua huruf');
});
