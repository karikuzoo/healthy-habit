import { randomUUID as nodeRandomUUID } from 'node:crypto';

/**
 * Pengganti `expo-crypto` selama uji.
 *
 * Hanya `randomUUID` yang dipakai aplikasi (lihat `src/db/helpers.js`), dan
 * Node punya implementasi yang setara. Bentuk id-nya sama persis, jadi uji
 * tetap melewati jalur kode yang sama dengan aplikasi sungguhan.
 */
export function randomUUID() {
  return nodeRandomUUID();
}
