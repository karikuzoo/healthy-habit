import { router } from 'expo-router';

/**
 * Masuk ke aplikasi setelah login atau pendaftaran berhasil.
 *
 * `router.replace('/(tabs)')` saja tidak cukup: replace hanya MENUKAR layar
 * teratas. Layar Welcome yang mengantar ke sini tetap tertinggal di dasar
 * stack (begitu juga layar Daftar pada alur pendaftaran), sehingga tombol
 * back fisik Android dari dalam aplikasi memulangkan pengguna ke halaman
 * Welcome — seolah-olah ter-logout.
 *
 * Jadi riwayat auth dikosongkan dulu, baru layar terakhirnya ditukar dengan
 * tab. Hasilnya stack berisi satu entri: back dari tab keluar aplikasi,
 * bukan mundur ke layar masuk.
 *
 * `canDismiss()` menjaga kasus stack berisi satu layar saja (mis. masuk lewat
 * deep link langsung ke /login) — POP_TO_TOP di sana tidak tertangani
 * navigator dan hanya memunculkan galat di mode pengembangan.
 */
export function enterApp() {
  if (router.canDismiss()) {
    router.dismissAll();
  }
  router.replace('/(tabs)');
}

export default enterApp;
