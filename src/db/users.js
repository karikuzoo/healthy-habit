import { buildUpdate, newId, nowIso } from './helpers';
import { createSalt, hashPassword, verifyPassword } from '../lib/password';

const COLUMNS = [
  'first_name',
  'last_name',
  'email',
  'gender',
  'birth_date',
  'height_cm',
  'weight_kg',
  'activity_level',
  'program',
  'target_goal',
  'units',
  'avatar_uri',
];

/** Profil awal saat aplikasi pertama kali dibuka. */
const SEED = {
  first_name: 'Padlan',
  last_name: 'Prabowo',
  email: 'padlan@email.com',
  gender: 'Laki-Laki',
  birth_date: '1998-08-12',
  height_cm: 182,
  weight_kg: 78,
  activity_level: 'sedentary',
  program: 'bulking',
  target_goal: 'Lebih bugar dan tidur teratur',
  units: 'metric',
  avatar_uri: null,
};

/** Baris DB (snake_case) -> bentuk yang dipakai UI (camelCase). */
function toUser(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    gender: row.gender,
    birthDate: row.birth_date,
    height: row.height_cm,
    weight: row.weight_kg,
    activityLevel: row.activity_level,
    program: row.program,
    targetGoal: row.target_goal,
    units: row.units,
    avatar: row.avatar_uri,
  };
}

/** Bentuk UI (camelCase) -> nama kolom DB. */
function toColumns(patch) {
  const map = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    gender: 'gender',
    birthDate: 'birth_date',
    height: 'height_cm',
    weight: 'weight_kg',
    activityLevel: 'activity_level',
    program: 'program',
    targetGoal: 'target_goal',
    units: 'units',
    avatar: 'avatar_uri',
  };

  const out = {};
  for (const [key, value] of Object.entries(patch)) {
    if (map[key]) out[map[key]] = value;
  }
  return out;
}

/**
 * Mengambil profil aktif, membuatnya lebih dulu kalau database masih kosong.
 *
 * Ini penampung sementara sampai autentikasi asli terpasang — nanti baris
 * user datang dari server saat login, bukan di-seed di perangkat.
 */
export async function ensureUser(db) {
  const existing = await db.getFirstAsync(
    'SELECT * FROM users WHERE deleted_at IS NULL LIMIT 1',
  );
  if (existing) return toUser(existing);

  const id = newId();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO users (id, ${COLUMNS.join(', ')}, updated_at)
     VALUES (?, ${COLUMNS.map(() => '?').join(', ')}, ?)`,
    [id, ...COLUMNS.map((column) => SEED[column]), timestamp],
  );

  const created = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [id]);
  return toUser(created);
}

/**
 * Email dinormalkan sebelum dibandingkan.
 *
 * Alamat email tidak peka huruf besar-kecil pada bagian domainnya, dan dalam
 * praktik hampir semua penyedia juga tidak peka pada bagian lokalnya. Orang
 * yang mendaftar "Ihsan@Mail.com" lalu masuk dengan "ihsan@mail.com" sedang
 * memakai alamat yang sama, dan menolaknya hanya akan membingungkan.
 */
function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

/**
 * Apakah sudah ada akun yang BENAR-BENAR didaftarkan di perangkat ini.
 *
 * Bukan sekadar "apakah ada baris users" — barisnya selalu ada sejak
 * peluncuran pertama karena `ensureUser` menyemainya. `registered_at` yang
 * membedakan profil bawaan dari akun sungguhan.
 */
export async function hasRegisteredAccount(db) {
  const row = await db.getFirstAsync(
    `SELECT 1 AS ada FROM users
      WHERE registered_at IS NOT NULL AND deleted_at IS NULL LIMIT 1`,
  );
  return Boolean(row);
}

/**
 * Mendaftarkan akun: menyimpan identitas beserta hash kata sandinya.
 *
 * Menulis ke baris pengguna yang sudah ada, bukan membuat baris baru —
 * perangkat ini memang hanya mengenal satu profil sampai autentikasi
 * sungguhan terpasang. Mendaftar ulang menimpa akun sebelumnya.
 */
/**
 * Profil yang dikembalikan ke keadaan awal saat akun BERGANTI pemilik.
 *
 * Tinggi dan berat diberi angka wajar, bukan dikosongkan: perhitungan BMR
 * di `UserContext` mengalikannya langsung, dan nilai null akan membuat
 * seluruh target kalori menjadi NaN. Keduanya toh langsung ditimpa di
 * tahap 2 pendaftaran.
 */
const PROFILE_RESET = {
  gender: 'Laki-Laki',
  birth_date: null,
  height_cm: 170,
  weight_kg: 65,
  activity_level: 'sedentary',
  program: 'maintenance',
  target_goal: '',
  units: 'metric',
  avatar_uri: null,
};

/** Tabel yang isinya milik satu pengguna, ditautkan lewat `user_id`. */
const OWNED_TABLES = [
  'food_logs',
  'sleep_logs',
  'step_logs',
  'workout_logs',
  'workout_plan_exercises',
];

/**
 * Menyingkirkan jejak akun sebelumnya saat perangkat berpindah pemilik.
 *
 * Memakai SOFT DELETE, bukan menghapus barisnya. Sama seperti seluruh
 * penghapusan lain di aplikasi ini: barisnya tetap ada supaya penghapusannya
 * bisa disinkronkan nanti — dan kalau ternyata ini salah orang yang
 * mendaftar, datanya masih bisa diselamatkan dari database.
 *
 * `workout_log_exercises` ikut lewat induknya, dan `food_servings` lewat
 * makanan buatan pengguna. Katalog makanan bawaan (`user_id` NULL) TIDAK
 * disentuh — itu data referensi, bukan milik siapa pun.
 */
async function discardPreviousAccountData(db, userId, timestamp) {
  for (const table of OWNED_TABLES) {
    await db.runAsync(
      `UPDATE ${table}
          SET deleted_at = ?, updated_at = ?, synced_at = NULL
        WHERE user_id = ? AND deleted_at IS NULL`,
      [timestamp, timestamp, userId],
    );
  }

  await db.runAsync(
    `UPDATE workout_log_exercises
        SET deleted_at = ?, updated_at = ?, synced_at = NULL
      WHERE deleted_at IS NULL
        AND workout_log_id IN (SELECT id FROM workout_logs WHERE user_id = ?)`,
    [timestamp, timestamp, userId],
  );

  await db.runAsync(
    `UPDATE food_servings
        SET deleted_at = ?, updated_at = ?, synced_at = NULL
      WHERE deleted_at IS NULL
        AND food_id IN (SELECT id FROM foods WHERE user_id = ?)`,
    [timestamp, timestamp, userId],
  );

  await db.runAsync(
    `UPDATE foods
        SET deleted_at = ?, updated_at = ?, synced_at = NULL
      WHERE user_id = ? AND deleted_at IS NULL`,
    [timestamp, timestamp, userId],
  );
}

/**
 * Mendaftarkan akun: menyimpan identitas beserta hash kata sandinya.
 *
 * Email yang dipakai menentukan apakah ini orang yang SAMA atau bukan:
 *
 * - **email sama** — pemiliknya mengambil alih akunnya sendiri, misalnya
 *   karena lupa kata sandi. Profil dan seluruh catatannya dipertahankan.
 * - **email berbeda** — perangkat berpindah pemilik. Profil dikembalikan ke
 *   awal dan catatan pemilik lama disingkirkan.
 *
 * Tanpa pembedaan ini, akun baru mewarisi SELURUH isi akun sebelumnya —
 * foto, tinggi, berat, program, sampai riwayat makanan dan latihannya.
 * Barisnya memang cuma satu dan `user.id` tidak berubah, jadi semua yang
 * menautkan diri ke id itu ikut terbawa.
 *
 * Mengembalikan `discardedAvatar` supaya pemanggil bisa menghapus berkas
 * fotonya. Penghapusan berkas sengaja TIDAK dilakukan di sini: lapisan
 * database tidak seharusnya tahu-menahu soal sistem berkas.
 */
export async function registerAccount(db, id, { email, password, firstName, lastName }) {
  const salt = await createSalt();
  const hash = await hashPassword(password, salt);
  const timestamp = nowIso();
  const nextEmail = normalizeEmail(email);

  const current = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [id]);

  const switchingOwner =
    Boolean(current?.registered_at) && normalizeEmail(current.email) !== nextEmail;

  const discardedAvatar = switchingOwner ? current.avatar_uri : null;

  await db.withTransactionAsync(async () => {
    if (switchingOwner) {
      const columns = Object.keys(PROFILE_RESET);
      await db.runAsync(
        `UPDATE users SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
        [...columns.map((c) => PROFILE_RESET[c]), id],
      );

      await discardPreviousAccountData(db, id, timestamp);
    }

    await db.runAsync(
      `UPDATE users
          SET first_name    = ?,
              last_name     = ?,
              email         = ?,
              password_salt = ?,
              password_hash = ?,
              registered_at = ?,
              updated_at    = ?,
              synced_at     = NULL
        WHERE id = ?`,
      [
        String(firstName ?? '').trim(),
        String(lastName ?? '').trim(),
        nextEmail,
        salt,
        hash,
        timestamp,
        timestamp,
        id,
      ],
    );
  });

  const updated = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [id]);
  return { user: toUser(updated), discardedAvatar };
}

/**
 * Memeriksa email dan kata sandi terhadap akun terdaftar.
 *
 * Mengembalikan alasan kegagalan, bukan hanya null — layar masuk perlu
 * membedakan "belum ada akun di perangkat ini" dari "kredensial salah",
 * karena yang pertama membutuhkan pendaftaran, bukan percobaan ulang.
 *
 * Email yang tidak cocok dan kata sandi yang salah sengaja dilaporkan dengan
 * alasan yang SAMA (`kredensial-salah`). Membedakannya akan memberi tahu
 * penebak bahwa sebuah email terdaftar di perangkat itu.
 */
export async function verifyCredentials(db, { email, password }) {
  const row = await db.getFirstAsync(
    `SELECT * FROM users
      WHERE registered_at IS NOT NULL AND deleted_at IS NULL LIMIT 1`,
  );

  if (!row) return { ok: false, reason: 'belum-terdaftar' };

  if (normalizeEmail(email) !== normalizeEmail(row.email)) {
    return { ok: false, reason: 'kredensial-salah' };
  }

  const cocok = await verifyPassword(password, row.password_salt, row.password_hash);
  if (!cocok) return { ok: false, reason: 'kredensial-salah' };

  return { ok: true, user: toUser(row) };
}

/**
 * Mengganti kata sandi akun terdaftar tanpa mengetahui kata sandi lama (AUTH-7).
 *
 * **Verifikasinya hanya "tahu email yang terdaftar".** Tanpa server, tidak ada
 * yang bisa mengirim tautan atau kode — jadi tidak ada cara membuktikan siapa
 * yang meminta. Ini disebut apa adanya, bukan dibungkus seolah aman.
 *
 * Yang membuatnya tetap masuk akal: jalan masuk tanpa verifikasi SUDAH ada
 * sebelum ini. Mendaftar ulang menimpa kredensial di baris pengguna yang sama
 * tanpa menanyakan apa pun, dan seluruh catatan tetap utuh. Fungsi ini tidak
 * membuka apa pun yang belum terbuka — ia hanya membuat jalannya jelas dan
 * tidak merusak profil.
 *
 * Berbeda dari `verifyCredentials`, email yang tidak cocok DILAPORKAN apa
 * adanya. Di sana menyamarkan alasan mencegah penebak tahu sebuah email
 * terdaftar; di sini penyamaran itu tidak melindungi apa pun — perangkat ini
 * hanya mengenal satu akun, dan orang yang memegangnya bisa mengambilnya lewat
 * daftar ulang — sementara pengguna yang salah ketik akan terjebak menebak.
 */
export async function resetPassword(db, { email, password }) {
  const row = await db.getFirstAsync(
    `SELECT * FROM users
      WHERE registered_at IS NOT NULL AND deleted_at IS NULL LIMIT 1`,
  );

  if (!row) return { ok: false, reason: 'belum-terdaftar' };

  if (normalizeEmail(email) !== normalizeEmail(row.email)) {
    return { ok: false, reason: 'email-tidak-cocok' };
  }

  const salt = await createSalt();
  const hash = await hashPassword(password, salt);
  const timestamp = nowIso();

  await db.runAsync(
    `UPDATE users
        SET password_salt = ?,
            password_hash = ?,
            updated_at    = ?,
            synced_at     = NULL
      WHERE id = ?`,
    [salt, hash, timestamp, row.id],
  );

  return { ok: true };
}

/** Memperbarui sebagian field profil, lalu mengembalikan baris terbaru. */
export async function updateUserRow(db, id, patch) {
  const columnPatch = toColumns(patch);
  if (Object.keys(columnPatch).length === 0) {
    const unchanged = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [id]);
    return toUser(unchanged);
  }

  const { clause, values } = buildUpdate(COLUMNS, columnPatch);
  await db.runAsync(`UPDATE users SET ${clause} WHERE id = ?`, [...values, id]);

  const updated = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [id]);
  return toUser(updated);
}
