/**
 * Katalog gerakan dan rencana latihan.
 *
 * Dipisah tegas, dan pemisahan ini disengaja:
 *
 * - `exercises`    definisi gerakan — nama, alat, kategori. Satu entri per
 *                  gerakan, tidak ada duplikasi.
 * - `todayWorkout` rencana hari ini — hanya `id` beserta `sets` dan `reps`.
 *
 * `sets` dan `reps` TIDAK disimpan di katalog karena itu keputusan program
 * latihan, bukan sifat gerakannya: plank 30 detik di rencana pemula dan 40
 * detik di katalog adalah gerakan yang sama dengan resep berbeda. Sebelumnya
 * keduanya ditulis sebagai dua entri (`plank-hold` dan `plank`), sehingga satu
 * gerakan tercatat sebagai dua di riwayat latihan.
 *
 * Fokus katalog ini adalah gerakan TANPA ALAT. Bahu dan bisep tidak punya
 * gerakan kekuatan tanpa alat di sumber datanya, jadi keduanya memakai
 * dumbbell — ditandai lewat field `equipment` supaya pengguna yang tidak
 * punya bisa melewatinya.
 */

/** Label alat untuk ditampilkan; null berarti tanpa alat. */
export const equipmentLabels = {
  bodyweight: null,
  bar: 'Perlu palang',
  dumbbell: 'Perlu dumbbell',
  kettlebell: 'Perlu kettlebell',
  barbell: 'Perlu barbel',
  machine: 'Perlu alat gym',
  cable: 'Perlu alat gym',
};

export const exerciseCategories = [
  { id: 'kaki', name: 'Kaki' },
  { id: 'dada', name: 'Dada' },
  { id: 'punggung', name: 'Punggung' },
  { id: 'inti', name: 'Inti' },
  { id: 'lengan', name: 'Lengan' },
  { id: 'bahu', name: 'Bahu' },
];

/**
 * Definisi gerakan, dikunci `id`.
 *
 * `id` TIDAK BOLEH diubah: itu kunci ke berkas aset peraga
 * (`assets/exercises/<id>-0.jpg`), ke registry di `exerciseMedia.generated.js`,
 * dan ke kolom `exercise_id` pada tabel `workout_log_exercises`. Mengubahnya
 * memutus riwayat latihan yang sudah tercatat.
 */
export const exercises = {
  // ---- Kaki ----
  'bodyweight-squat': { name: 'Squat', category: 'kaki', equipment: 'bodyweight' },
  'walking-lunge': { name: 'Walking lunge', category: 'kaki', equipment: 'bodyweight' },
  'glute-bridge': { name: 'Glute bridge', category: 'kaki', equipment: 'bodyweight' },
  'single-leg-glute-bridge': { name: 'Glute bridge satu kaki', category: 'kaki', equipment: 'bodyweight' },
  'step-up': { name: 'Step-up', category: 'kaki', equipment: 'bodyweight' },
  'glute-kickback': { name: 'Glute kickback', category: 'kaki', equipment: 'bodyweight' },
  'jump-squat': { name: 'Jump squat', category: 'kaki', equipment: 'bodyweight' },
  'goblet-squat': { name: 'Goblet squat', category: 'kaki', equipment: 'kettlebell' },
  'barbell-squat': { name: 'Barbell squat', category: 'kaki', equipment: 'barbell' },
  'leg-press': { name: 'Leg press', category: 'kaki', equipment: 'machine' },
  'calf-raise': { name: 'Calf raise', category: 'kaki', equipment: 'machine' },

  // ---- Dada ----
  'push-up': { name: 'Push-up', category: 'dada', equipment: 'bodyweight' },
  'incline-push-up': { name: 'Incline push-up', category: 'dada', equipment: 'bodyweight' },
  'decline-push-up': { name: 'Decline push-up', category: 'dada', equipment: 'bodyweight' },
  'wide-push-up': { name: 'Push-up lebar', category: 'dada', equipment: 'bodyweight' },
  'feet-elevated-push-up': { name: 'Push-up kaki naik', category: 'dada', equipment: 'bodyweight' },
  'push-up-side-plank': { name: 'Push-up ke side plank', category: 'dada', equipment: 'bodyweight' },
  'bench-press': { name: 'Bench press', category: 'dada', equipment: 'barbell' },
  'chest-fly': { name: 'Chest fly', category: 'dada', equipment: 'dumbbell' },

  // ---- Punggung ----
  'pull-up': { name: 'Pull-up', category: 'punggung', equipment: 'bar' },
  'chin-up': { name: 'Chin-up', category: 'punggung', equipment: 'bar' },
  'inverted-row': { name: 'Inverted row', category: 'punggung', equipment: 'bar' },
  hyperextension: { name: 'Hyperextension', category: 'punggung', equipment: 'bodyweight' },
  'dumbbell-row': { name: 'Dumbbell row', category: 'punggung', equipment: 'dumbbell' },
  'lat-pulldown': { name: 'Lat pulldown', category: 'punggung', equipment: 'cable' },
  'seated-row': { name: 'Seated row', category: 'punggung', equipment: 'cable' },

  // ---- Inti ----
  plank: { name: 'Plank', category: 'inti', equipment: 'bodyweight' },
  'side-plank': { name: 'Side plank', category: 'inti', equipment: 'bodyweight' },
  crunch: { name: 'Crunch', category: 'inti', equipment: 'bodyweight' },
  'sit-up': { name: 'Sit-up', category: 'inti', equipment: 'bodyweight' },
  'reverse-crunch': { name: 'Reverse crunch', category: 'inti', equipment: 'bodyweight' },
  'cross-body-crunch': { name: 'Cross-body crunch', category: 'inti', equipment: 'bodyweight' },
  'oblique-crunch': { name: 'Oblique crunch', category: 'inti', equipment: 'bodyweight' },
  'dead-bug': { name: 'Dead bug', category: 'inti', equipment: 'bodyweight' },
  'bicycle-crunch': { name: 'Bicycle crunch', category: 'inti', equipment: 'bodyweight' },
  'leg-raise': { name: 'Leg raise', category: 'inti', equipment: 'bodyweight' },
  'russian-twist': { name: 'Russian twist', category: 'inti', equipment: 'bodyweight' },

  // ---- Lengan ----
  'bench-dips': { name: 'Bench dips', category: 'lengan', equipment: 'bodyweight' },
  'tricep-dips': { name: 'Tricep dips', category: 'lengan', equipment: 'bodyweight' },
  'body-tricep-press': { name: 'Body tricep press', category: 'lengan', equipment: 'bodyweight' },
  'towel-tricep-extension': { name: 'Tricep extension handuk', category: 'lengan', equipment: 'bodyweight' },
  // Bisep tidak punya gerakan tanpa alat: melatihnya butuh tarikan berbeban
  'dumbbell-curl': { name: 'Dumbbell curl', category: 'lengan', equipment: 'dumbbell' },
  'hammer-curl': { name: 'Hammer curl', category: 'lengan', equipment: 'dumbbell' },

  // ---- Bahu ----
  // Seluruh kategori ini memakai dumbbell: sumber datanya tidak memuat satu pun
  // gerakan kekuatan bahu tanpa alat (yang ada hanya peregangan)
  'shoulder-press': { name: 'Shoulder press', category: 'bahu', equipment: 'dumbbell' },
  'lateral-raise': { name: 'Lateral raise', category: 'bahu', equipment: 'dumbbell' },
  'front-raise': { name: 'Front raise', category: 'bahu', equipment: 'dumbbell' },
  'rear-delt-raise': { name: 'Rear delt raise', category: 'bahu', equipment: 'dumbbell' },
  'face-pull': { name: 'Face pull', category: 'bahu', equipment: 'cable' },
};

/**
 * Rencana latihan hari ini — hanya id beserta resepnya.
 *
 * Ringkasan di atas layar (jumlah gerakan, estimasi kalori) diturunkan dari
 * daftar ini, bukan ditulis terpisah. Kalau jumlah gerakan berubah,
 * `durationMinutes` dan `estimatedCalories` perlu ikut disesuaikan karena
 * `estimateCalories` membagi estimasi itu dengan jumlah gerakan.
 */
export const todayWorkout = {
  level: 'Pemula',
  durationMinutes: 28,
  intensity: 'Intensitas sedang',
  restSeconds: 45,
  estimatedCalories: 184,
  plan: [
    { id: 'bodyweight-squat', sets: 3, reps: '12 repetisi' },
    { id: 'incline-push-up', sets: 3, reps: '10 repetisi' },
    { id: 'dead-bug', sets: 3, reps: '12 repetisi' },
    { id: 'glute-bridge', sets: 3, reps: '15 repetisi' },
    { id: 'plank', sets: 3, reps: '30 detik' },
    { id: 'bench-dips', sets: 3, reps: '10 repetisi' },
    { id: 'walking-lunge', sets: 3, reps: '12 repetisi' },
  ],
};

/** Resep bawaan untuk gerakan katalog yang belum masuk rencana. */
const DEFAULT_PRESCRIPTION = { sets: 3, reps: '12 repetisi' };

/**
 * Menggabungkan definisi gerakan dengan resepnya menjadi satu objek utuh.
 *
 * Semua layar memakai bentuk hasil gabungan ini, sehingga tidak perlu tahu
 * bahwa definisi dan resepnya tersimpan terpisah.
 */
export function resolveExercise(id, prescription = DEFAULT_PRESCRIPTION) {
  const definition = exercises[id];
  if (!definition) return null;

  return { id, ...definition, ...prescription };
}

/** Gerakan pada rencana hari ini, sudah tergabung dengan resepnya. */
export function planExercises() {
  return todayWorkout.plan
    .map((item) => resolveExercise(item.id, { sets: item.sets, reps: item.reps }))
    .filter(Boolean);
}

/** Gerakan katalog untuk satu kategori. */
export function exercisesInCategory(categoryId) {
  return Object.entries(exercises)
    .filter(([, definition]) => definition.category === categoryId)
    .map(([id]) => resolveExercise(id));
}

/** Jumlah gerakan per kategori, dipakai layar pemilih kategori. */
export function categoryCount(categoryId) {
  return Object.values(exercises).filter((e) => e.category === categoryId).length;
}

/** Label alat, atau null kalau gerakannya tanpa alat. */
export function equipmentLabel(exercise) {
  return equipmentLabels[exercise?.equipment] ?? null;
}

/** Label set/repetisi, mis. "3 set × 12 repetisi". */
export function formatSets(exercise) {
  return `${exercise.sets} set × ${exercise.reps}`;
}

/**
 * Estimasi kalori terbakar untuk satu gerakan.
 *
 * Diambil nilai TERBESAR antara dua sinyal, bukan hanya waktu:
 *
 * - set yang selesai — porsi gerakan ini terhadap estimasi rencana
 * - waktu berjalan   — durasi dikali laju kalori rencana
 *
 * Sebelumnya hanya waktu yang dipakai, dan itu menghasilkan 0 kkal untuk
 * orang yang menandai setnya tanpa menjalankan timer — padahal timernya
 * opsional dan setnya jelas kerja nyata.
 */
export function estimateCalories({ exercise, completedSets = 0, elapsedSeconds = 0 }) {
  const exerciseCount = todayWorkout.plan.length || 1;
  const shareOfPlan = todayWorkout.estimatedCalories / exerciseCount;

  const fromSets = exercise.sets
    ? shareOfPlan * Math.min(completedSets / exercise.sets, 1)
    : 0;

  const caloriesPerSecond =
    todayWorkout.estimatedCalories / (todayWorkout.durationMinutes * 60);
  const fromTime = elapsedSeconds * caloriesPerSecond;

  return Math.round(Math.max(fromSets, fromTime));
}
