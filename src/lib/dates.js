import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

/**
 * Label tanggal untuk layar riwayat.
 *
 * Kolom `logged_on` menyimpan tanggal lokal 'YYYY-MM-DD' (lihat
 * `src/db/schema.js`), jadi di sinilah bentuk itu diterjemahkan menjadi
 * sesuatu yang bisa dibaca.
 *
 * Dua hari terakhir disebut dengan namanya sendiri — "Hari ini" dan
 * "Kemarin" jauh lebih cepat dikenali daripada tanggalnya, dan itu dua
 * baris yang paling sering dilihat di daftar riwayat.
 */

/** '2026-09-11' -> "Hari ini" | "Kemarin" | "Sen, 8 Sep 2026" */
export function dayLabel(loggedOn) {
  const date = parseISO(loggedOn);

  if (isToday(date)) return 'Hari ini';
  if (isYesterday(date)) return 'Kemarin';

  return format(date, 'EEE, d MMM yyyy', { locale: idLocale });
}

/** '2026-09-11' -> "Jumat, 11 September 2026" — untuk judul layar harian. */
export function fullDayLabel(loggedOn) {
  return format(parseISO(loggedOn), 'EEEE, d MMMM yyyy', { locale: idLocale });
}
