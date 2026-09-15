import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDecimal } from '../src/lib/parseNumber.js';
import { validateFood, parseFoodForm, MAX_CALORIES } from '../src/lib/validateFood.js';
import { dayLabel, fullDayLabel } from '../src/lib/dates.js';
import { formatNumber } from '../src/lib/format.js';
import { minutesBetween, formatDuration } from '../src/data/sleep.js';
import { portionLabel, slotLabel } from '../src/data/nutrition.js';

/**
 * Fungsi murni di `src/lib` dan `src/data`.
 *
 * Semuanya tanpa database dan tanpa React, jadi bisa diimpor apa adanya.
 * Bagian ini kebal terhadap perubahan tata letak — kalau desain baru mengubah
 * setiap layar, berkas ini tetap berlaku.
 */

test('parseDecimal membaca desimal berkoma ala Indonesia', () => {
  // Inti alasan fungsi ini ada: Number('4,2') menghasilkan NaN,
  // parseFloat('4,2') menghasilkan 4 — keduanya salah untuk "4,2 gram".
  assert.equal(parseDecimal('4,2'), 4.2);
  assert.equal(parseDecimal('4.2'), 4.2);
  assert.equal(parseDecimal(' 12 '), 12);

  // Kosong dan tidak valid HARUS null, bukan 0 — pemanggil membedakan
  // "belum diisi" dari "diisi nol".
  assert.equal(parseDecimal(''), null);
  assert.equal(parseDecimal('   '), null);
  assert.equal(parseDecimal(null), null);
  assert.equal(parseDecimal('abc'), null);
  assert.equal(parseDecimal('0'), 0);
});

test('validateFood memblokir yang mustahil secara fisik', () => {
  const base = { name: 'Uji', calories: '100', protein: '5', carbs: '10', fat: '2' };

  assert.equal(validateFood(parseFoodForm(base)).valid, true);

  const noName = validateFood(parseFoodForm({ ...base, name: '  ' }));
  assert.equal(noName.valid, false);
  assert.ok(noName.errors.name);

  const tooManyCalories = validateFood(
    parseFoodForm({ ...base, calories: String(MAX_CALORIES + 1) }),
  );
  assert.equal(tooManyCalories.valid, false, 'di atas lemak murni harus ditolak');

  // Makro tidak mungkin lebih dari 100 g per 100 g
  const impossibleMacros = validateFood(
    parseFoodForm({ ...base, protein: '50', carbs: '40', fat: '30' }),
  );
  assert.equal(impossibleMacros.valid, false);
  assert.ok(impossibleMacros.errors.macroSum);

  const negative = validateFood(parseFoodForm({ ...base, protein: '-1' }));
  assert.equal(negative.valid, false);
});

test('validateFood hanya MEMPERINGATKAN saat kalori tidak cocok dengan makro', () => {
  // 5*4 + 10*4 + 2*9 = 78 kkal, diisi 200 -> selisih jauh di atas 25%.
  // Ini boleh saja benar (label kemasan, faktor Atwater beragam), jadi
  // wajib lolos simpan — hanya diberi peringatan.
  const drifted = validateFood(
    parseFoodForm({ name: 'Uji', calories: '200', protein: '5', carbs: '10', fat: '2' }),
  );

  assert.equal(drifted.valid, true, 'selisih kalori tidak boleh memblokir simpan');
  assert.ok(drifted.warning, 'tapi harus memberi peringatan');
});

test('minutesBetween menangani tidur yang melewati tengah malam', () => {
  assert.equal(minutesBetween('22:45', '06:20'), 455);
  assert.equal(minutesBetween('23:00', '07:00'), 480);
  // Tidur siang, tidak melewati tengah malam
  assert.equal(minutesBetween('13:00', '14:30'), 90);
});

test('formatDuration dan formatNumber memakai gaya Indonesia', () => {
  assert.equal(formatDuration(455), '7j 35m');
  assert.equal(formatDuration(480), '8j 00m');
  assert.equal(formatNumber(6248), '6.248');
});

test('dayLabel menyebut dua hari terakhir dengan namanya', () => {
  const iso = (offsetDays) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
  };

  assert.equal(dayLabel(iso(0)), 'Hari ini');
  assert.equal(dayLabel(iso(-1)), 'Kemarin');

  // Tanggal lama jatuh ke format pendek berbahasa Indonesia
  assert.equal(dayLabel('2026-09-09'), 'Rab, 9 Sep 2026');
  assert.equal(fullDayLabel('2026-09-09'), 'Rabu, 9 September 2026');
});

test('portionLabel dan slotLabel', () => {
  assert.equal(portionLabel('porsi', 1), 'porsi');
  assert.equal(portionLabel('porsi', 2), '2 × porsi');
  assert.equal(slotLabel('siang'), 'Makan Siang');
  // Nilai tak dikenal dikembalikan apa adanya, bukan jadi undefined
  assert.equal(slotLabel('entah'), 'entah');
});
