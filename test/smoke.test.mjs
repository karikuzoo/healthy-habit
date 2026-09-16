import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from './helpers/db.mjs';

test('infrastruktur uji: schema termigrasi dan modul aplikasi bisa diimpor', async (t) => {
  const { db, close } = await createTestDb();
  t.after(close);

  // Nomor versinya TIDAK dipatok: mematoknya berarti setiap migrasi baru
  // memecahkan uji ini tanpa ada yang benar-benar rusak. Yang diperiksa
  // adalah migrasinya berjalan dan tabelnya terbentuk.
  const { user_version: version } = await db.getFirstAsync('PRAGMA user_version');
  assert.ok(version > 0, 'migrasi harus sudah berjalan');

  const tables = await db.getAllAsync(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );
  const names = tables.map((t) => t.name);

  for (const expected of [
    'users',
    'food_logs',
    'foods',
    'sleep_logs',
    'step_logs',
    'workout_logs',
    'workout_log_exercises',
    'workout_plan_exercises',
  ]) {
    assert.ok(names.includes(expected), `tabel ${expected} harus ada`);
  }

  // Modul yang mengimpor expo-crypto
  const { newId, todayLocal } = await import('../src/db/helpers.js');
  assert.match(newId(), /^[0-9a-f-]{36}$/);
  assert.match(todayLocal(), /^\d{4}-\d{2}-\d{2}$/);

  // Modul yang mengimpor JSON polos
  const { scaleNutrition } = await import('../src/db/foods.js');
  assert.equal(typeof scaleNutrition, 'function');
});
