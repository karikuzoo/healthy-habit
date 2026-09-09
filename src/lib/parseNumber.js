/**
 * Mengurai angka yang diketik pengguna Indonesia.
 *
 * `parseFloat('4,2')` menghasilkan 4 — koma dianggap akhir angka. Karena
 * desimal di Indonesia memakai koma, input harus dinormalkan lebih dulu atau
 * "4,2 gram serat" akan tersimpan sebagai 4.
 *
 * Mengembalikan null untuk input kosong maupun tidak valid, sehingga
 * pemanggil bisa membedakan "belum diisi" dari "diisi nol".
 */
export function parseDecimal(text) {
  if (text == null) return null;

  const cleaned = String(text).trim().replace(',', '.');
  if (cleaned === '') return null;

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export default parseDecimal;
