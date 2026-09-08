/** Data tidur contoh. Durasi disimpan dalam menit agar mudah dihitung. */
export const sleepTargetMinutes = 8 * 60;

/**
 * Satu-satunya sumber data tidur tadi malam.
 *
 * Durasinya tidak disimpan sebagai angka terpisah — selalu dihitung dari
 * `bedtime` dan `wakeTime` lewat `lastNightDuration()`, supaya dashboard,
 * tab Sleep, dan form input tidak pernah menampilkan durasi yang berbeda.
 */
export const lastNightSleep = {
  bedtime: '22:45',
  wakeTime: '06:20',
  quality: 'nyenyak',
  notes: '',
};

export const sleepQualityOptions = [
  { value: 'nyenyak', label: 'Nyenyak', labelEn: 'Good', emoji: '🙂' },
  { value: 'biasa', label: 'Biasa', labelEn: 'Fair', emoji: '😐' },
  { value: 'buruk', label: 'Buruk', labelEn: 'Poor', emoji: '☹️' },
];

export const weeklyTrend = [
  { day: 'M', minutes: 380 },
  { day: 'T', minutes: 425 },
  { day: 'W', minutes: 400 },
  { day: 'T', minutes: 470, active: true },
  { day: 'F', minutes: 440 },
  { day: 'S', minutes: 415 },
  { day: 'S', minutes: 435 },
];

export const bedtimeReminder = '22:30';

/** Selisih dua jam "HH:MM", memperhitungkan pergantian hari. */
export function minutesBetween(start, end) {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const diff = endHour * 60 + endMin - (startHour * 60 + startMin);
  return diff < 0 ? diff + 24 * 60 : diff;
}

/** Durasi tidur tadi malam dalam menit. */
export function lastNightDuration() {
  return minutesBetween(lastNightSleep.bedtime, lastNightSleep.wakeTime);
}

/** Label kualitas tidur dalam bahasa Inggris, untuk badge "Sleep Quality". */
export function qualityLabelEn(value = lastNightSleep.quality) {
  return sleepQualityOptions.find((option) => option.value === value)?.labelEn ?? '—';
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
