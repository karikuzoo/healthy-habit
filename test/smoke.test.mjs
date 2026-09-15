import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from './helpers/db.mjs';

test('infrastruktur uji: schema termigrasi dan modul aplikasi bisa diimpor', async (t) => {
  const { db, close } = await createTestDb();
  t.after(close);

  const { user_version: version } = await db.getFirstAsync('PRAGMA user_version');
  assert.equal(version, 3, 'schema harus di versi terbaru');

  // Modul yang mengimpor expo-crypto
  const { newId, todayLocal } = await import('../src/db/helpers.js');
  assert.match(newId(), /^[0-9a-f-]{36}$/);
  assert.match(todayLocal(), /^\d{4}-\d{2}-\d{2}$/);

  // Modul yang mengimpor JSON polos
  const { scaleNutrition } = await import('../src/db/foods.js');
  assert.equal(typeof scaleNutrition, 'function');
});
