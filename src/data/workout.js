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
 * Rencana latihan BAWAAN — hanya id beserta resepnya.
 *
 * Ini benih, bukan rencana yang ditampilkan. Rencana sebenarnya tinggal di
 * tabel `workout_plan_exercises` (lihat `src/db/workoutPlan.js`): daftar ini
 * disalin ke sana sekali di hari pertama pengguna membuka tab Workout, lalu
 * pengguna bebas menambah, menghapus, dan mengubah set/repetisinya.
 *
 * `durationMinutes` dan `estimatedCalories` berlaku untuk rencana seukuran
 * ini; untuk rencana yang sudah disunting, pakai `planEstimate(planSize)`
 * yang menskalakan keduanya per gerakan.
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

/**
 * Menggabungkan baris rencana dari database dengan definisi gerakannya.
 *
 * Baris rencana hanya menyimpan `exerciseId` beserta resepnya; nama, kategori,
 * dan alat tetap tinggal di katalog. Gerakan yang tidak ada lagi di katalog
 * dibuang di sini, supaya katalog boleh dirapikan tanpa merusak rencana yang
 * sudah tersimpan.
 */
export function resolvePlan(items) {
  return items
    .map((item) => {
      const exercise = resolveExercise(item.exerciseId, {
        sets: item.sets,
        reps: item.reps,
      });
      return exercise ? { ...exercise, planId: item.planId } : null;
    })
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
 * Satuan resep yang bisa dipilih pengguna saat menyetel gerakan.
 *
 * `reps` disimpan sebagai satu teks ("12 repetisi" / "30 detik") karena
 * itulah bentuk yang sudah dipakai kolom `reps` di database dan seluruh
 * label di layar. `parseReps` membongkarnya kembali menjadi angka + satuan
 * supaya layar penyetelan bisa menaik-turunkannya.
 */
export const repUnits = [
  { value: 'repetisi', label: 'Repetisi' },
  { value: 'detik', label: 'Detik' },
];

const DEFAULT_REPS = { amount: 12, unit: 'repetisi' };

/** "30 detik" -> { amount: 30, unit: 'detik' } */
export function parseReps(reps) {
  const match = /([0-9]+)[ ]*([a-zA-Z]+)/.exec(String(reps ?? ''));
  if (!match) return { ...DEFAULT_REPS };

  const unit = match[2].toLowerCase().startsWith('detik') ? 'detik' : 'repetisi';
  return { amount: Number(match[1]), unit };
}

/** Kebalikan `parseReps`. */
export function formatReps(amount, unit) {
  return `${amount} ${unit === 'detik' ? 'detik' : 'repetisi'}`;
}

/**
 * Estimasi durasi dan kalori untuk rencana sepanjang `planSize` gerakan.
 *
 * Angka di `todayWorkout` hanya berlaku untuk rencana bawaan. Begitu
 * pengguna menambah atau menghapus gerakan, keduanya harus ikut bergerak —
 * kalau tidak, rencana berisi 12 gerakan tetap mengaku 28 menit.
 */
export function planEstimate(planSize) {
  const baseline = todayWorkout.plan.length || 1;
  const share = planSize / baseline;

  return {
    calories: Math.round(todayWorkout.estimatedCalories * share),
    durationMinutes: Math.round(todayWorkout.durationMinutes * share),
  };
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
export function estimateCalories({
  exercise,
  completedSets = 0,
  elapsedSeconds = 0,
  planSize = todayWorkout.plan.length,
}) {
  const exerciseCount = planSize || 1;
  const shareOfPlan = planEstimate(exerciseCount).calories / exerciseCount;

  const fromSets = exercise.sets
    ? shareOfPlan * Math.min(completedSets / exercise.sets, 1)
    : 0;

  const caloriesPerSecond =
    todayWorkout.estimatedCalories / (todayWorkout.durationMinutes * 60);
  const fromTime = elapsedSeconds * caloriesPerSecond;

  return Math.round(Math.max(fromSets, fromTime));
}
