import { buildUpdate, newId, nowIso } from './helpers';

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
