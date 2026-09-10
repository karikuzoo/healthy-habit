/**
 * Mengubah CSV gizi mentah menjadi katalog makanan aplikasi.
 *
 *   node scripts/build-food-catalog.mjs <nutrition.csv>
 *
 * Menghasilkan dua berkas:
 *   src/data/foodCatalog.json        entri yang lolos, dipakai aplikasi
 *   scripts/food-catalog-review.json entri bermasalah, untuk diperiksa manual
 *
 * Skrip ini disimpan di repo supaya konversinya dapat diulang dan diaudit —
 * bukan transformasi sekali jalan yang hasilnya tidak bisa dilacak asalnya.
 */
import fs from 'node:fs';
import path from 'node:path';

const CSV = process.argv[2];
if (!CSV) {
  console.error('Pemakaian: node scripts/build-food-catalog.mjs <nutrition.csv>');
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dirname, '..');

// ---------------------------------------------------------------------------
// Aturan validasi
// ---------------------------------------------------------------------------

/**
 * Batas selisih antara kalori tertulis dan kalori hasil hitung makro.
 *
 * Dipatok 25%, bukan lebih ketat, karena rumus 4/4/9 itu sendiri hanya
 * pendekatan: faktor Atwater sebenarnya beragam per bahan (protein kacang
 * sekitar 3,47 kkal/g), dan serat menyumbang massa karbohidrat tetapi hanya
 * sekitar 2 kkal/g. Ambang 15% menolak data yang sebetulnya benar — "Tahu"
 * dengan selisih 16% ikut terbuang. Pemeriksaan ini untuk menangkap kesalahan
 * kasar seperti titik desimal tergeser, bukan selisih halus.
 */
const TOLERANCE = 0.25;

/** Kalori per 100 g tidak mungkin melebihi lemak murni (100 g x 9 kkal). */
const MAX_CALORIES = 900;

/**
 * Bahan yang tidak dimakan sebagaimana adanya. Sengaja sempit: kata "segar"
 * dan "daun" tidak masuk, karena buah segar dan daun bawang memang makanan.
 */
const NOT_A_MEAL = /\b(mentah|tepung|ampas|bungkil|dedak|kulit ari)\b/i;

// ---------------------------------------------------------------------------
// Penamaan (langkah 2)
// ---------------------------------------------------------------------------

/**
 * Nama tampilan dan kata kunci pencarian untuk makanan yang namanya di data
 * bersifat teknis atau tidak sesuai kebiasaan orang mencari.
 *
 * `keywords` ditambahkan ke kolom `name_search`, sehingga entri tetap ketemu
 * lewat istilah lama maupun baru tanpa perlu tabel alias terpisah.
 */
const RENAMES = {
  'beras giling masak (nasi)': { name: 'Nasi Putih', keywords: ['beras giling'] },
  nasi: { name: 'Nasi Putih', keywords: ['beras'] },
  'nasi beras merah': { name: 'Nasi Merah', keywords: ['beras merah'] },
  'beras ketan putih kukus': { name: 'Ketan Putih', keywords: ['beras ketan'] },
  'beras ketan hitam kukus': { name: 'Ketan Hitam', keywords: ['beras ketan'] },
  ayam: { name: 'Daging Ayam', keywords: ['ayam mentah'] },
  'telur ayam': { name: 'Telur Ayam', keywords: ['telur rebus', 'telur utuh'] },
  'telur ayam ceplok': { name: 'Telur Ceplok', keywords: ['telur mata sapi'] },
  'telur ayam dadar': { name: 'Telur Dadar', keywords: ['omelet'] },
  'roti putih': { name: 'Roti Tawar Putih', keywords: ['roti tawar'] },
  'susu sapi': { name: 'Susu Sapi Segar', keywords: ['susu'] },
  'susu kental manis': { name: 'Susu Kental Manis', keywords: ['skm'] },
  'mi basah': { name: 'Mie Basah', keywords: ['mi'] },
  'mi kering': { name: 'Mie Kering', keywords: ['mi instan'] },
  'tempe kedelai murni goreng': { name: 'Tempe Goreng', keywords: ['tempe'] },
  'ikan mujair goreng': { name: 'Mujair Goreng', keywords: ['ikan mujair'] },
  'ikan lele goreng': { name: 'Lele Goreng', keywords: ['ikan lele'] },
  'ikan bandeng': { name: 'Ikan Bandeng', keywords: ['bandeng'] },
  'ikan mujair pepes': { name: 'Pepes Mujair', keywords: ['pepes ikan'] },
};

/**
 * Koreksi untuk baris yang angkanya jelas salah di data sumber.
 *
 * Pemeriksaan aritmetika 4/4/9 tidak bisa menangkap kasus seperti ini: baris
 * bisa konsisten secara internal (kalori cocok dengan makronya) sekaligus
 * salah secara gizi. Ketidakwajaran seperti itu hanya ketahuan dengan
 * membandingkan terhadap makanan sejenis.
 *
 * Setiap koreksi WAJIB menyertakan alasannya, dan hasilnya ditandai
 * `source: 'estimasi'` — bukan `'dataset-eksternal'` — karena angkanya
 * perkiraan, bukan berasal dari dataset.
 */
const CORRECTIONS = {
  'nasi uduk': {
    calories: 200,
    protein: 3.5,
    carbs: 30,
    fat: 7,
    reason:
      'Sumber menyebut lemak 21 g dan karbohidrat 11,7 g per 100 g. Setiap nasi ' +
      'lain di dataset yang sama berkarbohidrat 19-80 g dan berlemak 0,3-8,8 g, ' +
      'jadi angka itu tidak masuk akal untuk nasi bersantan.',
  },
};

/**
 * Entri yang namanya menyesatkan kalau muncul di pencarian.
 *
 * "Teh" di data adalah daun kering 132 kkal per 100 g, bukan teh seduh —
 * orang yang mencatatnya sebagai minuman akan mendapat angka ngawur.
 */
const MISLEADING = new Set(['teh', 'kopi bagian yang larut']);

/**
 * Kategori ditentukan dari kata pada nama; yang PERTAMA cocok dipakai.
 *
 * Urutannya penting dan harus dari yang paling spesifik. "Telur Ayam" wajib
 * jatuh ke telur, bukan ayam; "Susu Sapi" ke minuman, bukan daging. Salah
 * urutan bukan cuma label yang keliru — kategori menentukan ukuran saji,
 * sehingga susu bisa tersaji sebagai "1 potong 60 g".
 */
const CATEGORIES = [
  // Paling spesifik lebih dulu
  [/\b(susu|teh|kopi|jus|sirup|sirop|minuman|santan|air |es krim|yoghurt|yakult|soda)\b/i, 'Minuman'],
  [/\b(telur|tahu|tempe|oncom|kedelai|tofu)\b/i, 'Telur, tahu & tempe'],
  [/\b(soto|rawon|sop|sup|bakso|gulai|kari|opor|coto|pindang|asam pedas|tongseng)\b/i, 'Berkuah'],

  [/\b(nasi|beras|ketan|bubur|lontong|ketupat|ubi|singkong|kentang|jagung|sagu|talas|roti|mie|mi|bihun|kwetiau|makaroni|oatmeal|havermut|gaplek|tiwul)\b/i, 'Makanan pokok'],

  [/\b(ikan|udang|cumi|kerang|kepiting|rajungan|bandeng|lele|mujair|tongkol|teri|tuna|tenggiri|gurame|nila|patin|belut|bawal|kakap|sardencis|sarden|pindakas|rebon|ebi)\b/i, 'Ikan & seafood'],
  [/\b(ayam|bebek|itik|entok|angsa|burung|puyuh)\b/i, 'Ayam & unggas'],
  [/\b(sapi|kerbau|kambing|babi|daging|rendang|empal|dendeng|sate|abon|babat|paru|limpa|hati|usus|iga|burger|kornet|sosis|yakiniku)\b/i, 'Daging'],

  [/\b(sayur|kangkung|bayam|buncis|kacang panjang|gado|pecel|urap|capcay|tumis|terong|labu|jamur|kol|kubis|sawi|wortel|tomat|timun|ketimun|bawang|bengkuang|bit|rebung|pare|oyong|gambas|selada|brokoli|kembang kol|daun|pucuk|tauge|kecipir|jengkol|petai|lalap|asinan|lodeh|botok|buntil)\b/i, 'Sayur'],

  [/\b(pisang|mangga|pepaya|jeruk|apel|semangka|melon|nanas|nangka|salak|rambutan|durian|alpukat|anggur|jambu|duku|kedondong|belimbing|sirsak|manggis|markisa|sawo|srikaya|kesemek|arbei|stroberi|kurma|kismis|kelengkeng|leci|blewah|buah)\b/i, 'Buah'],

  [/\b(kerupuk|keripik|kue|biskuit|wafer|permen|dodol|martabak|donat|bakwan|gorengan|onde|klepon|wajik|jenang|bagea|bika|brem|getuk|lapis|lemper|nagasari|putu|serabi|apem|cucur|rengginang|emping|opak|pilus|kacang|coklat|cokelat|selai|madu|gula)\b/i, 'Camilan'],
];

/**
 * Menentukan kategori dari nama makanan.
 *
 * Kata PERTAMA dicoba lebih dulu, karena dalam bahasa Indonesia kata benda
 * utamanya biasanya di depan. Tanpa ini "Ikan Teri Nasi kering" jatuh ke
 * "Makanan pokok" gara-gara kata "Nasi" di tengah namanya — dan kategori
 * menentukan ukuran saji, jadi salah kategori berarti salah porsi.
 */
function categorize(name) {
  const firstWord = name.trim().split(/\s+/)[0] ?? '';

  for (const [re, label] of CATEGORIES) if (re.test(firstWord)) return label;
  for (const [re, label] of CATEGORIES) if (re.test(name)) return label;

  return 'Lainnya';
}

// ---------------------------------------------------------------------------
// Pengurai CSV
// ---------------------------------------------------------------------------

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const normalize = (name) => name.toLowerCase().replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------
// Konversi
// ---------------------------------------------------------------------------

const rows = parseCsv(fs.readFileSync(CSV, 'utf8'));
const body = rows.slice(1).filter((r) => r.length >= 6 && r[5]?.trim());

const accepted = [];
const review = { impossible: [], inconsistent: [], notAMeal: [], misleading: [], duplicate: [] };
const corrected = [];
const seen = new Set();

for (const r of body) {
  const raw = {
    calories: parseFloat(r[1]),
    protein: parseFloat(r[2]),
    fat: parseFloat(r[3]),
    carbs: parseFloat(r[4]),
    name: r[5].trim().replace(/\s+/g, ' '),
  };

  const key = normalize(raw.name);

  // Koreksi diterapkan SEBELUM validasi, supaya angka yang sudah dibetulkan
  // ikut diperiksa seperti yang lain.
  const correction = CORRECTIONS[key];
  let source = 'dataset-eksternal';
  if (correction) {
    raw.calories = correction.calories;
    raw.protein = correction.protein;
    raw.carbs = correction.carbs;
    raw.fat = correction.fat;
    source = 'estimasi';
    corrected.push({ name: raw.name, ...correction });
  }

  const numbers = [raw.calories, raw.protein, raw.fat, raw.carbs];

  // Mustahil secara fisik — hampir selalu titik desimal tergeser
  const macroSum = raw.protein + raw.fat + raw.carbs;
  if (numbers.some((v) => !Number.isFinite(v) || v < 0) ||
      raw.calories <= 0 || raw.calories > MAX_CALORIES || macroSum > 100) {
    review.impossible.push({ ...raw, macroSum: +macroSum.toFixed(1) });
    continue;
  }

  // Kalori harus konsisten dengan makronya
  const computed = raw.protein * 4 + raw.carbs * 4 + raw.fat * 9;
  const drift = Math.abs(computed - raw.calories) / raw.calories;
  if (drift > TOLERANCE) {
    review.inconsistent.push({ ...raw, computed: Math.round(computed), driftPct: Math.round(drift * 100) });
    continue;
  }

  if (MISLEADING.has(key)) { review.misleading.push(raw); continue; }

  const rename = RENAMES[key];
  if (!rename && NOT_A_MEAL.test(raw.name)) { review.notAMeal.push(raw); continue; }

  const name = rename?.name ?? raw.name;
  const displayKey = normalize(name);
  if (seen.has(displayKey)) { review.duplicate.push({ ...raw, resolvedName: name }); continue; }
  seen.add(displayKey);

  const category = categorize(name);
  const searchTerms = [displayKey, ...(rename?.keywords ?? []).map(normalize)];

  // Ukuran saji tidak disimpan di sini: itu turunan dari kategori, dan
  // aplikasi mendapatkannya lewat servingsForCategory() saat menyemai katalog.
  accepted.push({
    name,
    // Kata kunci digabung ke name_search, sehingga istilah lama tetap ketemu
    nameSearch: [...new Set(searchTerms)].join(' '),
    category,
    calories: raw.calories,
    protein: raw.protein,
    carbs: raw.carbs,
    fat: raw.fat,
    source,
  });
}

accepted.sort((a, b) => a.name.localeCompare(b.name, 'id'));

// ---------------------------------------------------------------------------
// Keluaran
// ---------------------------------------------------------------------------

const catalogPath = path.join(ROOT, 'src/data/foodCatalog.json');
const reviewPath = path.join(ROOT, 'scripts/food-catalog-review.json');

// Tanpa indentasi: berkas ini dibundel ke dalam aplikasi, bukan dibaca manusia
fs.writeFileSync(catalogPath, `${JSON.stringify(accepted)}\n`);
fs.writeFileSync(reviewPath, `${JSON.stringify(review, null, 1)}\n`);

const total = body.length;
const dropped = Object.values(review).reduce((n, list) => n + list.length, 0);

console.log(`Sumber            : ${total} baris`);
console.log(`Diterima          : ${accepted.length}`);
console.log('Disingkirkan      :', dropped);
console.log(`  mustahil fisik  : ${review.impossible.length}`);
console.log(`  kalori tak cocok: ${review.inconsistent.length}`);
console.log(`  bukan makanan   : ${review.notAMeal.length}`);
console.log(`  menyesatkan     : ${review.misleading.length}`);
console.log(`  duplikat        : ${review.duplicate.length}`);
if (corrected.length > 0) {
  console.log(`\nDikoreksi manual  : ${corrected.length}`);
  for (const item of corrected) {
    console.log(`  ${item.name} -> ${item.calories} kkal, P${item.protein} K${item.carbs} L${item.fat}`);
    console.log(`    alasan: ${item.reason}`);
  }
}

console.log(`\nKatalog -> ${path.relative(ROOT, catalogPath)}`);
console.log(`Perlu diperiksa -> ${path.relative(ROOT, reviewPath)}`);

const byCategory = {};
for (const f of accepted) byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
console.log('\nPer kategori:');
for (const [c, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${c.padEnd(22)} ${String(n).padStart(4)}`);
}
