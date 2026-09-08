import * as Crypto from 'expo-crypto';
import { format } from 'date-fns';

/**
 * UUID untuk primary key. Wajib dibuat di sisi client (bukan AUTOINCREMENT)
 * supaya baris yang dibuat offline di beberapa device tidak bertabrakan
 * id-nya saat disinkronkan.
 */
export function newId() {
  return Crypto.randomUUID();
}

/** Timestamp ISO 8601 UTC — format yang diterima langsung oleh Postgres. */
export function nowIso() {
  return new Date().toISOString();
}

/**
 * Tanggal lokal 'YYYY-MM-DD' untuk kolom `logged_on`.
 * Sengaja memakai zona waktu perangkat: "makan siang hari ini" ditentukan
 * kalender user, bukan UTC.
 */
export function todayLocal(date = new Date()) {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Menyusun klausa `SET` dari objek patch berisi nama kolom.
 * `updated_at` selalu diperbarui, dan `synced_at` dikosongkan agar baris
 * ini ikut terangkut pada sinkronisasi berikutnya.
 */
export function buildUpdate(columns, patch) {
  const entries = Object.entries(patch).filter(([key]) => columns.includes(key));

  const assignments = entries.map(([key]) => `${key} = ?`);
  const values = entries.map(([, value]) => value);

  assignments.push('updated_at = ?', 'synced_at = NULL');
  values.push(nowIso());

  return { clause: assignments.join(', '), values };
}
