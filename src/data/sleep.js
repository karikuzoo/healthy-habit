/**
 * Data referensi tidur.
 *
 * Catatan tidur sendiri hidup di tabel `sleep_logs` (lihat `src/db/sleepLogs.js`);
 * berkas ini hanya menyimpan hal yang tidak berubah per pengguna, plus util
 * pengolahan jam.
 */

export const sleepTargetMinutes = 8 * 60;

export const bedtimeReminder = '22:30';

export const sleepQualityOptions = [
  { value: 'nyenyak', label: 'Nyenyak', labelEn: 'Good', emoji: '🙂' },
  { value: 'biasa', label: 'Biasa', labelEn: 'Fair', emoji: '😐' },
  { value: 'buruk', label: 'Buruk', labelEn: 'Poor', emoji: '☹️' },
];

/** Label kualitas dalam bahasa Inggris, untuk lencana "Sleep Quality". */
export function qualityLabelEn(value) {
  return sleepQualityOptions.find((option) => option.value === value)?.labelEn ?? '—';
}

/** Memeriksa format jam "HH:MM" sekaligus rentang jam & menitnya. */
export function isValidTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value ?? '')) return false;
  const [hours, minutes] = value.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Selisih dua jam "HH:MM" dalam menit, memperhitungkan pergantian hari —
 * tidur pukul 22:45 dan bangun 06:20 berarti 455 menit, bukan negatif.
 */
export function minutesBetween(start, end) {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const diff = endHour * 60 + endMin - (startHour * 60 + startMin);
  return diff < 0 ? diff + 24 * 60 : diff;
}

/** 455 -> "7j 35m" */
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}j ${mins.toString().padStart(2, '0')}m`;
}

/** 455 -> "7h 35m" (dipakai pada ring ringkasan) */
export function formatDurationEn(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins.toString().padStart(2, '0')}m`;
}

/**
 * Menormalkan ketikan pengguna menjadi "HH:MM" sambil diketik:
 * "2245" -> "22:45", "2" -> "2", "225" -> "22:5".
 */
export function normalizeTimeInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
