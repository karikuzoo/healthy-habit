/**
 * Skor harian 0–100.
 *
 * Fungsi murni tanpa akses database, supaya bisa diuji terpisah dan dipakai
 * ulang di layar lain.
 *
 * Langkah kaki ikut dihitung sejak 12 Sep 2026, setelah pedometer perangkat
 * menjadi sumber datanya. Bobot ketiga komponen lama diturunkan untuk memberi
 * tempat — totalnya harus tetap 1.
 *
 * Bobot langkah sengaja yang TERKECIL. Di Android angkanya selalu lebih kecil
 * dari kenyataan (sensor hanya menghitung selagi aplikasi terbuka, lihat
 * `useStepCounter`), jadi komponen inilah yang paling sering menghukum
 * pengguna atas hal yang tidak mereka lakukan.
 */

export const SCORE_WEIGHTS = {
  sleep: 0.3,
  nutrition: 0.3,
  workout: 0.25,
  steps: 0.15,
};

/** Rentang penilaian tidur, dalam menit. */
const SLEEP_BAND = { zeroLow: 240, idealLow: 420, idealHigh: 540, zeroHigh: 720 };

/** Batas penilaian nutrisi, sebagai rasio terhadap target kalori. */
const CALORIE_IDEAL_HIGH = 1.1;
const CALORIE_ZERO_HIGH = 1.5;

/**
 * Skor pita 0..1: penuh di dalam rentang ideal, turun linear ke nol di
 * kedua arah.
 *
 * Dipakai untuk tidur karena tidur adalah peristiwa yang sudah SELESAI saat
 * dinilai — tidur 4 jam bukan "sedang menuju 8 jam", dan tidur 13 jam
 * sama-sama bukan pencapaian.
 */
function bandScore(value, { zeroLow, idealLow, idealHigh, zeroHigh }) {
  if (value <= zeroLow || value >= zeroHigh) return 0;
  if (value >= idealLow && value <= idealHigh) return 1;

  return value < idealLow
    ? (value - zeroLow) / (idealLow - zeroLow)
    : (zeroHigh - value) / (zeroHigh - idealHigh);
}

/**
 * Skor asupan 0..1.
 *
 * Berbeda dari tidur: kalori TERAKUMULASI sepanjang hari, jadi kekurangan
 * di siang hari bukan kegagalan — hanya belum selesai. Karena itu di bawah
 * target diberi kredit proporsional (sudah makan 43% target -> 0,43), bukan
 * nol seperti pita. Kelebihan tetap dihukum, karena melewati target memang
 * sudah terjadi dan tidak bisa dibatalkan.
 */
function intakeScore(ratio) {
  if (ratio <= 0) return 0;
  if (ratio <= CALORIE_IDEAL_HIGH) return Math.min(ratio, 1);

  return Math.max((CALORIE_ZERO_HIGH - ratio) / (CALORIE_ZERO_HIGH - CALORIE_IDEAL_HIGH), 0);
}

/** Skor linear 0..1 untuk besaran yang makin banyak makin bagus. */
function ratioScore(value, target) {
  if (!target) return 0;
  return Math.min(Math.max(value / target, 0), 1);
}

/**
 * Menghitung skor harian beserta rinciannya.
 *
 * Komponen yang datanya belum ada dinilai 0, bukan dikeluarkan dari
 * perhitungan — kalau dikeluarkan lalu bobotnya dinormalkan ulang, orang
 * yang baru mencatat tidur saja bisa mendapat 100 padahal harinya belum
 * berjalan. Skor ini mengukur kelengkapan hari.
 */
export function calculateDailyScore({
  sleepMinutes,
  caloriesConsumed,
  calorieTarget,
  exercisesDone,
  exercisesPlanned,
  steps = 0,
  stepTarget = 0,
}) {
  const calorieRatio = calorieTarget ? caloriesConsumed / calorieTarget : 0;

  const components = [
    {
      key: 'sleep',
      label: 'Tidur',
      weight: SCORE_WEIGHTS.sleep,
      logged: sleepMinutes != null && sleepMinutes > 0,
      score: sleepMinutes ? bandScore(sleepMinutes, SLEEP_BAND) : 0,
      direction: !sleepMinutes
        ? 'missing'
        : sleepMinutes < SLEEP_BAND.idealLow
          ? 'low'
          : sleepMinutes > SLEEP_BAND.idealHigh
            ? 'high'
            : 'ok',
    },
    {
      key: 'nutrition',
      label: 'Nutrisi',
      weight: SCORE_WEIGHTS.nutrition,
      logged: caloriesConsumed > 0,
      score: intakeScore(calorieRatio),
      direction:
        caloriesConsumed <= 0
          ? 'missing'
          : calorieRatio > CALORIE_IDEAL_HIGH
            ? 'high'
            : calorieRatio < 1
              ? 'low'
              : 'ok',
    },
    {
      key: 'workout',
      label: 'Latihan',
      weight: SCORE_WEIGHTS.workout,
      logged: exercisesDone > 0,
      score: ratioScore(exercisesDone, exercisesPlanned),
      direction: exercisesDone <= 0 ? 'missing' : exercisesDone < exercisesPlanned ? 'low' : 'ok',
    },
    {
      key: 'steps',
      label: 'Langkah',
      weight: SCORE_WEIGHTS.steps,
      logged: steps > 0,
      score: ratioScore(steps, stepTarget),
      direction: steps <= 0 ? 'missing' : steps < stepTarget ? 'low' : 'ok',
    },
  ];

  const total = Math.round(
    components.reduce((sum, item) => sum + item.score * item.weight, 0) * 100,
  );

  // Komponen dengan kehilangan poin terbesar — dasar kalimat sarannya
  const weakest = components.reduce((worst, item) =>
    (1 - item.score) * item.weight > (1 - worst.score) * worst.weight ? item : worst,
  );

  return {
    total,
    components,
    weakest,
    message: buildMessage(total, weakest),
  };
}

/** Saran mengikuti ARAH penyimpangan, bukan hanya komponennya. */
const NUDGE = {
  sleep: { missing: 'tidur belum dicatat', low: 'tidurmu masih kurang', high: 'tidurmu kelewat lama' },
  nutrition: {
    missing: 'belum ada asupan tercatat',
    low: 'asupan belum mencapai target',
    high: 'asupan sudah melewati target',
  },
  workout: { missing: 'latihan belum dimulai', low: 'latihan belum selesai', high: '' },
  steps: { missing: 'belum ada langkah tercatat', low: 'langkahmu belum mencapai target', high: '' },
};

function buildMessage(total, weakest) {
  if (total >= 85) return 'Kamu dalam ritme yang baik';
  if (total === 0) return 'Belum ada catatan hari ini';

  const nudge = NUDGE[weakest.key]?.[weakest.direction];
  if (!nudge) return 'Lanjutkan ritmemu';

  return total >= 60 ? `Sudah lumayan—${nudge}` : `Ayo mulai—${nudge}`;
}
