import { DatabaseSync } from 'node:sqlite';
import { migrate } from '../../src/db/schema.js';

/**
 * Database uji: SQLite sungguhan di memori, dengan schema dari `migrate()`
 * yang sama persis dipakai aplikasi.
 *
 * Skemanya SENGAJA tidak disalin ke berkas uji. Schema yang diketik ulang
 * akan berhenti mencerminkan aslinya pada migrasi berikutnya, dan uji yang
 * lulus di atas schema usang lebih berbahaya daripada tidak ada uji —
 * ia meyakinkan tanpa menjamin.
 *
 * `node:sqlite` bersifat sinkron, sementara `expo-sqlite` asinkron. Pembungkus
 * di bawah menyamakan permukaannya supaya modul di `src/db/` bisa dipanggil
 * apa adanya, tanpa cabang khusus uji di kode produksi.
 */

function wrap(raw) {
  const db = {
    _raw: raw,

    async execAsync(sql) {
      raw.exec(sql);
    },

    async runAsync(sql, params = []) {
      return raw.prepare(sql).run(...params);
    },

    async getFirstAsync(sql, params = []) {
      return raw.prepare(sql).get(...params) ?? null;
    },

    async getAllAsync(sql, params = []) {
      return raw.prepare(sql).all(...params);
    },

    async withTransactionAsync(task) {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },

    /**
     * `expo-sqlite` membuka koneksi terpisah untuk ini; di uji cukup memakai
     * koneksi yang sama. Yang diuji perilaku SQL-nya, bukan isolasi koneksi.
     */
    async withExclusiveTransactionAsync(task) {
      return db.withTransactionAsync(() => task(db));
    },
  };

  return db;
}

/** Database kosong yang sudah dimigrasi, plus satu pengguna siap pakai. */
export async function createTestDb({ userId = 'user-uji' } = {}) {
  const raw = new DatabaseSync(':memory:');
  const db = wrap(raw);

  await migrate(db);

  await db.runAsync(
    'INSERT INTO users (id, first_name, updated_at) VALUES (?, ?, ?)',
    [userId, 'Uji', new Date().toISOString()],
  );

  return { db, raw, userId, close: () => raw.close() };
}
