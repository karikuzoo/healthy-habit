/**
 * Mengunduh peraga gerakan dari free-exercise-db.
 *
 *   node scripts/fetch-exercise-media.mjs
 *
 * Sumber: https://github.com/yuhonas/free-exercise-db (Unlicense / domain publik)
 *
 * Repo itu menyediakan DUA FOTO JPG per gerakan — posisi awal dan posisi
 * akhir — bukan animasi. Dua frame itu justru lebih hemat daripada rencana
 * GIF semula: 19 gerakan menghasilkan 38 berkas berukuran total 2,2 MB,
 * dibandingkan ~35 MB kalau memakai GIF.
 *
 * Berkas diunduh, bukan ditautkan ke raw.githubusercontent.com, karena dua
 * alasan: prinsip §1.1 PRD menuntut aplikasi jalan tanpa internet (dan di gym
 * sinyalnya justru paling buruk), dan menumpang CDN GitHub untuk aplikasi
 * produksi bukan hal yang pantas.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets/exercises');
const DB = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main';

/**
 * Peta id gerakan kita -> nama gerakan di free-exercise-db.
 *
 * DIPETAKAN MANUAL, bukan dicocokkan otomatis. Pencocokan berbasis kemiripan
 * nama menghasilkan pilihan yang keliru: "Push-up" tertarik ke "Clock Push-Up"
 * dan "Calf raise" ke "Barbell Seated Calf Raise", padahal ada padanan yang
 * jauh lebih tepat. Nama di sini harus sama persis dengan `name` di dataset.
 *
 * Gerakan yang tidak punya padanan cukup dihilangkan dari peta ini —
 * komponennya jatuh ke ikon placeholder tanpa error.
 */
const MAPPING = {
  // ---- Kaki ----
  'bodyweight-squat': 'Bodyweight Squat',
  'walking-lunge': 'Bodyweight Walking Lunge',
  'glute-bridge': 'Butt Lift (Bridge)',
  'single-leg-glute-bridge': 'Single Leg Glute Bridge',
  'step-up': 'Step-up with Knee Raise',
  'glute-kickback': 'Glute Kickback',
  'jump-squat': 'Freehand Jump Squat',
  'goblet-squat': 'Goblet Squat',
  'barbell-squat': 'Barbell Squat',
  'leg-press': 'Leg Press',
  // Seluruh varian calf raise di dataset memakai mesin atau dumbbell;
  // gerakannya sama, hanya alatnya berbeda
  'calf-raise': 'Standing Calf Raises',

  // ---- Dada ----
  'push-up': 'Pushups',
  'incline-push-up': 'Incline Push-Up',
  'decline-push-up': 'Decline Push-Up',
  'wide-push-up': 'Push-Up Wide',
  'feet-elevated-push-up': 'Push-Ups With Feet Elevated',
  'push-up-side-plank': 'Push Up to Side Plank',
  'bench-press': 'Barbell Bench Press - Medium Grip',
  'chest-fly': 'Dumbbell Flyes',

  // ---- Punggung ----
  'pull-up': 'Pullups',
  'chin-up': 'Chin-Up',
  'inverted-row': 'Inverted Row',
  hyperextension: 'Hyperextensions With No Hyperextension Bench',
  'dumbbell-row': 'Bent Over Two-Dumbbell Row',
  'lat-pulldown': 'Wide-Grip Lat Pulldown',
  'seated-row': 'Seated Cable Rows',

  // ---- Inti ----
  plank: 'Plank',
  'side-plank': 'Side Bridge',
  crunch: 'Crunches',
  'sit-up': 'Sit-Up',
  'reverse-crunch': 'Reverse Crunch',
  'cross-body-crunch': 'Cross-Body Crunch',
  'oblique-crunch': 'Oblique Crunches',
  'dead-bug': 'Dead Bug',
  'bicycle-crunch': 'Air Bike',
  'leg-raise': 'Flat Bench Lying Leg Raise',
  'russian-twist': 'Russian Twist',

  // ---- Lengan ----
  'bench-dips': 'Bench Dips',
  'tricep-dips': 'Dips - Triceps Version',
  'body-tricep-press': 'Body Tricep Press',
  'towel-tricep-extension': 'Standing Towel Triceps Extension',
  'dumbbell-curl': 'Dumbbell Bicep Curl',
  'hammer-curl': 'Hammer Curls',

  // ---- Bahu ----
  'shoulder-press': 'Dumbbell Shoulder Press',
  'lateral-raise': 'Side Lateral Raise',
  'front-raise': 'Front Dumbbell Raise',
  'rear-delt-raise': 'Reverse Flyes',
  'face-pull': 'Face Pull',
};

const dataset = await (await fetch(`${DB}/dist/exercises.json`)).json();
const byName = new Map(dataset.map((e) => [e.name, e]));

fs.mkdirSync(OUT_DIR, { recursive: true });

const registry = {};
let downloaded = 0;
let bytes = 0;
const missing = [];

for (const [id, name] of Object.entries(MAPPING)) {
  const exercise = byName.get(name);

  if (!exercise) {
    missing.push(`${id} -> "${name}" tidak ada di dataset`);
    continue;
  }
  if (!exercise.images?.length) {
    missing.push(`${id} -> "${name}" tidak punya gambar`);
    continue;
  }

  const frames = [];

  // Maksimal dua frame: posisi awal dan akhir. Sisanya tidak menambah
  // informasi untuk peraga bentuk gerakan.
  for (const [index, imagePath] of exercise.images.slice(0, 2).entries()) {
    const response = await fetch(`${DB}/exercises/${imagePath}`);
    if (!response.ok) {
      missing.push(`${id} frame ${index}: HTTP ${response.status}`);
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `${id}-${index}.jpg`;
    fs.writeFileSync(path.join(OUT_DIR, fileName), buffer);

    frames.push(fileName);
    downloaded += 1;
    bytes += buffer.length;
  }

  if (frames.length > 0) registry[id] = frames;
  console.log(`${id.padEnd(18)} <- ${name}  (${frames.length} frame)`);
}

/**
 * Registry ditulis sebagai MODUL JS, bukan JSON, karena Metro hanya bisa
 * memaketkan aset lewat `require()` dengan path harfiah — path yang disusun
 * saat runtime tidak akan ditemukan bundler.
 *
 * Berkas terpisah supaya `exerciseMedia.js` tetap bisa dibaca dan disunting
 * manusia tanpa ikut tertimpa setiap kali skrip ini dijalankan.
 */
const entries = Object.entries(registry).map(([id, frames]) => {
  const requires = frames
    .map((file) => `    require('../../assets/exercises/${file}'),`)
    .join('\n');
  return `  '${id}': [\n${requires}\n  ],`;
});

const header = [
  '// BERKAS INI DIBUAT OTOMATIS oleh scripts/fetch-exercise-media.mjs',
  '// Jangan disunting manual — jalankan ulang skripnya.',
  '//',
  '// Sumber: https://github.com/yuhonas/free-exercise-db (Unlicense)',
  '// Dua frame per gerakan: posisi awal dan posisi akhir.',
  '',
].join('\n');

const registryPath = path.join(ROOT, 'src/data/exerciseMedia.generated.js');
fs.writeFileSync(
  registryPath,
  `${header}\nexport const generatedMedia = {\n${entries.join('\n')}\n};\n\nexport default generatedMedia;\n`,
);

console.log('\n---');
console.log(`gerakan dengan peraga : ${Object.keys(registry).length} / ${Object.keys(MAPPING).length}`);
console.log(`berkas diunduh        : ${downloaded} (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
console.log(`registry -> ${path.relative(ROOT, registryPath)}`);

if (missing.length > 0) {
  console.log('\nTidak terunduh:');
  for (const item of missing) console.log(`  ${item}`);
}
