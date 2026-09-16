import * as Crypto from 'expo-crypto';

/**
 * Penyimpanan kata sandi untuk GERBANG LOKAL (AUTH-2, sementara).
 *
 * **Ini bukan keamanan, dan tidak boleh dianggap begitu.**
 *
 * SHA-256 adalah digest CEPAT — itu justru sifat yang salah untuk kata sandi.
 * Siapa pun yang memegang berkas SQLite perangkat bisa mencoba jutaan
 * tebakan per detik terhadap hash di dalamnya. Yang benar untuk kata sandi
 * adalah KDF lambat ber-parameter biaya (bcrypt, scrypt, argon2), dan
 * `expo-crypto` tidak menyediakannya — yang ada hanya `digestStringAsync`
 * dan `getRandomBytesAsync`.
 *
 * Jadi yang dicapai di sini terbatas dan disebut apa adanya:
 *
 * - kata sandi tidak tergeletak sebagai teks polos di database
 * - salt acak per akun membuat tabel pelangi umum tidak berguna
 * - alur daftar -> masuk jadi masuk akal saat aplikasi dicoba orang
 *
 * Yang TIDAK dicapai: perlindungan terhadap orang yang sudah memegang
 * perangkat atau berkas databasenya.
 *
 * Seluruh berkas ini dibuang begitu autentikasi Supabase masuk — di sana
 * kata sandi tidak pernah menyentuh perangkat sama sekali.
 */

/** Panjang salt dalam byte. 16 byte sudah jauh melebihi kebutuhan. */
const SALT_BYTES = 16;

function toHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Salt acak baru, satu per akun. */
export async function createSalt() {
  return toHex(await Crypto.getRandomBytesAsync(SALT_BYTES));
}

/** Hash kata sandi dengan salt-nya. Bentuknya hex, siap disimpan apa adanya. */
export async function hashPassword(password, salt) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
}

/**
 * Perbandingan yang waktunya tidak bergantung pada isi.
 *
 * Membandingkan dengan `===` membocorkan berapa banyak karakter awal yang
 * cocok lewat selisih waktu. Di gerbang lokal kebocoran itu nyaris tidak
 * berguna bagi penyerang, tapi menulisnya benar sejak awal lebih murah
 * daripada mengingat untuk memperbaikinya nanti.
 */
function equalsConstantTime(a, b) {
  const left = String(a ?? '');
  const right = String(b ?? '');
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

/** Apakah `password` cocok dengan hash tersimpan. */
export async function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;

  const actual = await hashPassword(password, salt);
  return equalsConstantTime(actual, expectedHash);
}
