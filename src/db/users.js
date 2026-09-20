import { buildUpdate, newId, nowIso } from "./helpers";
import { createSalt, hashPassword, verifyPassword } from "../lib/password";

const COLUMNS = [
  "first_name",
  "last_name",
  "email",
  "gender",
  "birth_date",
  "height_cm",
  "weight_kg",
  "activity_level",
  "program",
  "target_goal",
  "target_weight_kg",
  "target_date",
  "units",
  "avatar_uri",
  "active_template_id",
];

/** Profil awal saat aplikasi pertama kali dibuka. */
const SEED = {
  first_name: "Padlan",
  last_name: "Prabowo",
  email: "padlan@email.com",
  gender: "Laki-Laki",
  birth_date: "1998-08-12",
  height_cm: 182,
  weight_kg: 78,
  activity_level: "sedentary",
  program: "bulking",
  target_goal: "Lebih bugar dan tidur teratur",
  // Target berat sengaja kosong, bukan ditebak: angka yang tidak pernah
  // disebut pengguna akan langsung menyetir target kalorinya.
  target_weight_kg: null,
  target_date: null,
  units: "metric",
  avatar_uri: null,
  // Rencana hari ini masih bawaan aplikasi (bukan hasil template), jadi
  // belum ada template aktif sama sekali di awal.
  active_template_id: null,
};

/**
 * Email dinormalkan sebelum dibandingkan.
 *
 * Alamat email tidak peka huruf besar-kecil pada bagian domainnya, dan dalam
 * praktik hampir semua penyedia juga tidak peka pada bagian lokalnya. Orang
 * yang mendaftar "Ihsan@Mail.com" lalu masuk dengan "ihsan@mail.com" sedang
 * memakai alamat yang sama, dan menolaknya hanya akan membingungkan.
 */
function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

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
    targetWeight: row.target_weight_kg,
    targetDate: row.target_date,
    units: row.units,
    avatar: row.avatar_uri,
    activeTemplateId: row.active_template_id,
  };
}

/** Bentuk UI (camelCase) -> nama kolom DB. */
function toColumns(patch) {
  const map = {
    firstName: "first_name",
    lastName: "last_name",
    email: "email",
    gender: "gender",
    birthDate: "birth_date",
    height: "height_cm",
    weight: "weight_kg",
    activityLevel: "activity_level",
    program: "program",
    targetGoal: "target_goal",
    targetWeight: "target_weight_kg",
    targetDate: "target_date",
    units: "units",
    avatar: "avatar_uri",
    activeTemplateId: "active_template_id",
  };

  const out = {};
  for (const [key, value] of Object.entries(patch)) {
    // Email selalu dinormalkan di sini, bukan di layar pemanggil. Ia adalah
    // identitas masuk, dan satu jalur tulis yang melewatkannya sudah cukup
    // untuk membuat pemiliknya tidak bisa masuk lagi.
    if (map[key])
      out[map[key]] = key === "email" ? normalizeEmail(value) : value;
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
    "SELECT * FROM users WHERE deleted_at IS NULL LIMIT 1",
  );
  if (existing) return toUser(existing);

  const id = newId();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO users (id, ${COLUMNS.join(", ")}, updated_at)
     VALUES (?, ${COLUMNS.map(() => "?").join(", ")}, ?)`,
    [id, ...COLUMNS.map((column) => SEED[column]), timestamp],
  );

  const created = await db.getFirstAsync("SELECT * FROM users WHERE id = ?", [
    id,
  ]);
  return toUser(created);
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
 * Profil bawaan untuk akun yang benar-benar baru.
 *
 * Tinggi dan berat diberi angka wajar, bukan dikosongkan: perhitungan BMR di
 * `UserContext` mengalikannya langsung, dan nilai null akan membuat seluruh
 * target kalori menjadi NaN. Keduanya langsung ditimpa di tahap 2 pendaftaran.
 */
const PROFIL_BARU = {
  gender: "Laki-Laki",
  birth_date: null,
  height_cm: 170,
  weight_kg: 65,
  activity_level: "sedentary",
  program: "maintenance",
  target_goal: "",
  target_weight_kg: null,
  target_date: null,
  units: "metric",
  avatar_uri: null,
};

/**
 * Mendaftarkan akun, lalu mengembalikannya sebagai profil aktif.
 *
 * SATU BARIS PER AKUN. Email yang dipakai menentukan barisnya:
 *
 * - **email sudah terdaftar** — pemiliknya mengambil alih akunnya sendiri
 *   (mis. lupa kata sandi). Barisnya diperbarui, seluruh catatannya utuh.
 * - **email baru, dan masih ada baris draf** — baris bawaan yang disemai
 *   `ensureUser` pada peluncuran pertama diklaim menjadi akun ini.
 * - **email baru, tanpa draf** — baris BARU dibuat.
 *
 * Yang ketiga itulah perbaikan intinya. Sebelumnya setiap pendaftaran menimpa
 * satu-satunya baris yang ada, jadi akun kedua menghapus akun pertama tanpa
 * peringatan — dan pemiliknya hanya melihat "email atau kata sandi salah".
 *
 * Karena tiap akun punya `id` sendiri, catatan makanan, tidur, latihan, dan
 * langkahnya ikut terpisah dengan sendirinya. Tidak ada lagi data yang perlu
 * disingkirkan saat berganti akun.
 */
export async function registerAccount(
  db,
  { email, password, firstName, lastName },
) {
  const salt = await createSalt();
  const hash = await hashPassword(password, salt);
  const timestamp = nowIso();
  const nextEmail = normalizeEmail(email);

  const existing = await db.getFirstAsync(
    `SELECT id FROM users
      WHERE email = ? AND registered_at IS NOT NULL AND deleted_at IS NULL`,
    [nextEmail],
  );

  const draft = existing
    ? null
    : await db.getFirstAsync(
        `SELECT id FROM users
          WHERE registered_at IS NULL AND deleted_at IS NULL LIMIT 1`,
      );

  const id = existing?.id ?? draft?.id ?? newId();

  if (existing || draft) {
    await db.runAsync(
      `UPDATE users
          SET first_name    = ?,
              last_name     = ?,
              email         = ?,
              password_salt = ?,
              password_hash = ?,
              registered_at = COALESCE(registered_at, ?),
              updated_at    = ?,
              synced_at     = NULL
        WHERE id = ?`,
      [
        String(firstName ?? "").trim(),
        String(lastName ?? "").trim(),
        nextEmail,
        salt,
        hash,
        timestamp,
        timestamp,
        id,
      ],
    );
  } else {
    const columns = Object.keys(PROFIL_BARU);
    await db.runAsync(
      `INSERT INTO users
         (id, first_name, last_name, email, ${columns.join(", ")},
          password_salt, password_hash, registered_at, updated_at)
       VALUES (?, ?, ?, ?, ${columns.map(() => "?").join(", ")}, ?, ?, ?, ?)`,
      [
        id,
        String(firstName ?? "").trim(),
        String(lastName ?? "").trim(),
        nextEmail,
        ...columns.map((c) => PROFIL_BARU[c]),
        salt,
        hash,
        timestamp,
        timestamp,
      ],
    );
  }

  const updated = await db.getFirstAsync("SELECT * FROM users WHERE id = ?", [
    id,
  ]);
  return toUser(updated);
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
  // Dicari berdasarkan emailnya. Mengambil "baris terdaftar pertama" akan
  // menolak setiap akun kecuali satu, dan itulah bug yang membuat akun lama
  // tidak bisa masuk lagi.
  const row = await db.getFirstAsync(
    `SELECT * FROM users
      WHERE email = ? AND registered_at IS NOT NULL AND deleted_at IS NULL`,
    [normalizeEmail(email)],
  );

  if (!row) {
    const ada = await hasRegisteredAccount(db);
    return { ok: false, reason: ada ? "kredensial-salah" : "belum-terdaftar" };
  }

  const cocok = await verifyPassword(
    password,
    row.password_salt,
    row.password_hash,
  );

  if (!cocok) return { ok: false, reason: "kredensial-salah" };

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
      WHERE email = ? AND registered_at IS NOT NULL AND deleted_at IS NULL`,
    [normalizeEmail(email)],
  );

  if (!row) {
    const ada = await hasRegisteredAccount(db);
    return { ok: false, reason: ada ? "email-tidak-cocok" : "belum-terdaftar" };
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

/**
 * Email akun terdaftar dalam bentuk tersamar, mis. "i•••n@gmail.com".
 *
 * Dipakai layar lupa kata sandi. Menyamarkannya bukan untuk melindungi
 * apa pun — perangkat ini hanya mengenal satu akun, dan pemegangnya bisa
 * mengambil alih lewat daftar ulang. Penyamarannya semata supaya alamat utuh
 * tidak terpampang di layar yang bisa dilihat orang lain dari balik bahu,
 * sementara pemiliknya tetap bisa mengenali alamatnya sendiri.
 *
 * Bagian domain dibiarkan utuh: itu yang paling membantu mengingat, dan
 * paling sedikit mengungkap.
 */
export async function registeredEmailHints(db) {
  const rows = await db.getAllAsync(
    `SELECT email FROM users
      WHERE registered_at IS NOT NULL AND deleted_at IS NULL
      ORDER BY registered_at DESC`,
  );

  return rows.map((row) => maskEmail(row.email)).filter(Boolean);
}

function maskEmail(value) {
  const email = normalizeEmail(value);
  if (!email.includes("@")) return null;

  const [local, domain] = email.split("@");

  // Bagian lokal yang pendek disamarkan seluruhnya — menampilkan 1 dari 2
  // huruf hampir sama saja dengan menampilkan semuanya.
  const masked =
    local.length <= 3
      ? "•".repeat(local.length)
      : `${local[0]}${"•".repeat(local.length - 2)}${local[local.length - 1]}`;

  return `${masked}@${domain}`;
}

/** Memperbarui sebagian field profil, lalu mengembalikan baris terbaru. */
export async function updateUserRow(db, id, patch) {
  const columnPatch = toColumns(patch);
  if (Object.keys(columnPatch).length === 0) {
    const unchanged = await db.getFirstAsync(
      "SELECT * FROM users WHERE id = ?",
      [id],
    );
    return toUser(unchanged);
  }

  const { clause, values } = buildUpdate(COLUMNS, columnPatch);
  await db.runAsync(`UPDATE users SET ${clause} WHERE id = ?`, [...values, id]);

  const updated = await db.getFirstAsync("SELECT * FROM users WHERE id = ?", [
    id,
  ]);
  return toUser(updated);
}
