import { generatedMedia } from './exerciseMedia.generated';

/**
 * Peraga gerakan latihan.
 *
 * Isinya dua foto per gerakan — posisi awal dan posisi akhir — dari
 * free-exercise-db (Unlicense / domain publik), diunduh oleh
 * `scripts/fetch-exercise-media.mjs`.
 *
 * Sengaja BUKAN animasi. Dua frame statis ternyata lebih hemat sekaligus
 * cukup: rencana GIF semula menghabiskan sekitar 35 MB untuk 20 gerakan,
 * sementara 38 foto ini hanya 2,2 MB. Kesan gerak dihasilkan komponen
 * `ExerciseMedia` dengan menukar kedua frame itu bergantian.
 *
 * Berkas diunduh dan dibundel, bukan ditautkan ke CDN GitHub, karena prinsip
 * §1.1 PRD menuntut aplikasi jalan tanpa internet — dan di gym sinyalnya
 * justru paling buruk.
 */
export const exerciseMedia = {
  ...generatedMedia,

  /**
   * Tambahan atau penggantian manual ditulis di sini, bukan di berkas
   * generated — berkas itu ditimpa setiap kali skrip dijalankan.
   *
   * Menerima berkas lokal maupun URL; `expo-image` memperlakukan keduanya
   * sama, dan URL disimpan ke cache disk setelah sekali diunduh:
   *
   *   'burpee': [require('../../assets/exercises/burpee-0.jpg')],
   *   'mountain-climber': ['https://cdn.contoh.com/latihan/mountain-climber.webp'],
   */
};

/**
 * Frame peraga untuk satu gerakan, atau null kalau belum tersedia.
 *
 * Selalu mengembalikan array supaya pemanggil tidak perlu membedakan satu
 * frame dari dua.
 */
export function framesFor(exerciseId) {
  const frames = exerciseMedia[exerciseId];
  if (!frames) return null;

  return Array.isArray(frames) ? frames : [frames];
}

/** Jumlah gerakan yang sudah punya peraga — untuk memantau kelengkapan. */
export function mediaCount() {
  return Object.keys(exerciseMedia).length;
}

export default framesFor;
