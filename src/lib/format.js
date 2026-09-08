/**
 * Format angka ribuan gaya Indonesia: 6248 -> "6.248".
 *
 * Mockup memakai pemisah campur ("6.248 langkah" tapi "1,850 kcal");
 * seluruh aplikasi disatukan ke format id-ID karena teksnya bahasa Indonesia.
 */
export function formatNumber(value) {
  return Number(value).toLocaleString('id-ID');
}

export default formatNumber;
