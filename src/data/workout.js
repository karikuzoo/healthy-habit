/**
 * Rencana latihan hari ini. Ringkasan di atas layar (jumlah gerakan, estimasi
 * kalori) diturunkan dari daftar ini, bukan ditulis terpisah.
 */
export const todayWorkout = {
  level: 'Pemula',
  durationMinutes: 32,
  intensity: 'Intensitas sedang',
  restSeconds: 45,
  estimatedCalories: 210,
  exercises: [
    { id: 'goblet-squat', name: 'Goblet squat', sets: 3, reps: '12 repetisi' },
    { id: 'incline-push-up', name: 'Incline push-up', sets: 3, reps: '10 repetisi' },
    { id: 'dead-bug', name: 'Dead bug', sets: 3, reps: '12 repetisi' },
    { id: 'dumbbell-row', name: 'Dumbbell row', sets: 3, reps: '10 repetisi' },
    { id: 'glute-bridge', name: 'Glute bridge', sets: 3, reps: '15 repetisi' },
    { id: 'plank-hold', name: 'Plank hold', sets: 3, reps: '30 detik' },
    { id: 'bird-dog', name: 'Bird dog', sets: 3, reps: '12 repetisi' },
    { id: 'calf-raise', name: 'Calf raise', sets: 3, reps: '15 repetisi' },
  ],
};

/** Label set/repetisi, mis. "3 set × 12 repetisi". */
export function formatSets(exercise) {
  return `${exercise.sets} set × ${exercise.reps}`;
}

/** Katalog gerakan per kategori untuk layar "Tambahkan gerakan". */
export const exerciseCategories = [
  { id: 'kaki', name: 'Kaki' },
  { id: 'dada', name: 'Dada' },
  { id: 'punggung', name: 'Punggung' },
  { id: 'inti', name: 'Inti' },
];

export const exercisesByCategory = {
  kaki: [
    { id: 'barbell-squat', name: 'Barbell squat', sets: 3, reps: '10 repetisi' },
    { id: 'lunges', name: 'Lunges', sets: 3, reps: '12 repetisi' },
    { id: 'leg-press', name: 'Leg press', sets: 3, reps: '10 repetisi' },
  ],
  dada: [
    { id: 'bench-press', name: 'Bench press', sets: 3, reps: '10 repetisi' },
    { id: 'chest-fly', name: 'Chest fly', sets: 3, reps: '12 repetisi' },
    { id: 'push-up', name: 'Push-up', sets: 3, reps: '15 repetisi' },
  ],
  punggung: [
    { id: 'lat-pulldown', name: 'Lat pulldown', sets: 3, reps: '10 repetisi' },
    { id: 'seated-row', name: 'Seated row', sets: 3, reps: '12 repetisi' },
    { id: 'face-pull', name: 'Face pull', sets: 3, reps: '15 repetisi' },
  ],
  inti: [
    { id: 'plank', name: 'Plank', sets: 3, reps: '40 detik' },
    { id: 'russian-twist', name: 'Russian twist', sets: 3, reps: '20 repetisi' },
    { id: 'leg-raise', name: 'Leg raise', sets: 3, reps: '15 repetisi' },
  ],
};
