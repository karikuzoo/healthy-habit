/**
 * Target berat badan dan estimasi perjalanannya.
 *
 * Semua di sini fungsi murni: tidak menyentuh database, tidak tahu tanggal
 * hari ini, tidak merender apa pun. Itu disengaja — angka-angka ini yang
 * menentukan berapa kalori yang boleh dimakan pengguna setiap hari, jadi ia
 * harus bisa diuji tanpa perlu menyalakan aplikasi.
 *
 * Yang MENYETIR di sini adalah targetnya, bukan program. Pengguna menyebut
 * mau berada di berat berapa dan kapan; dari situ dihitung mundur berapa
 * defisit kalori harian yang dibutuhkan. Program (cutting/maintenance/
 * bulking) tetap dipakai untuk pembagian makro, tapi tidak lagi menentukan
 * besar defisitnya ketika target terisi.
 */

import { hitungBmr, hitungTdee } from './energy';

/**
 * Satu kilogram jaringan tubuh ≈ 7.700 kkal.
 *
 * Angka Wishnofsky, dan ia PENDEKATAN — tubuh tidak membakar lemak murni,
 * dan lajunya melambat seiring berat turun. Dipakai di sini karena cukup
 * baik untuk memberi arah dan mudah dijelaskan ke pengguna; yang tidak boleh
 * dilakukan adalah menampilkannya seolah janji yang presisi.
 */
export const KKAL_PER_KG = 7700;

/**
 * Batas laju yang dianggap aman.
 *
 * Turun dibatasi 1% berat badan per minggu — bukan angka tetap — karena
 * kehilangan 1 kg seminggu berarti hal yang sangat berbeda bagi orang 60 kg
 * dan orang 120 kg. Tetap diberi langit-langit 1 kg supaya berat yang sangat
 * besar tidak menghasilkan defisit ekstrem.
 *
 * Naik dibatasi lebih ketat: menambah berat lebih cepat dari ini sebagian
 * besar jadi lemak, bukan otot.
 */
export const MAKS_TURUN_PERSEN_PER_MINGGU = 0.01;
export const MAKS_TURUN_KG_PER_MINGGU = 1;
export const MAKS_NAIK_KG_PER_MINGGU = 0.5;

/** Selisih berat yang terlalu kecil untuk disebut punya arah. */
const AMBANG_KG = 0.1;

function batasLaju(beratKg) {
  return {
    turun: Math.min(beratKg * MAKS_TURUN_PERSEN_PER_MINGGU, MAKS_TURUN_KG_PER_MINGGU),
    naik: MAKS_NAIK_KG_PER_MINGGU,
  };
}

/**
 * Rencana harian untuk sampai ke berat target pada waktu yang diminta.
 *
 * `laju` bertanda: positif berarti turun, negatif berarti naik — searah
 * dengan cara orang membacanya ("turun 0,5 kg per minggu").
 *
 * Hasilnya bisa BERBEDA dari yang diminta, dan itu inti fungsi ini. Target
 * yang mustahil tidak ditolak mentah-mentah; ia dibatasi ke laju yang aman,
 * lalu `dibatasiOleh` dan `hariRealistis` dipakai layar untuk berkata jujur
 * "waktu yang kamu minta terlalu cepat, perkiraan kami sekian".
 *
 * Dua batas bekerja berurutan:
 * 1. laju aman (lihat konstanta di atas)
 * 2. kalori tidak pernah turun di bawah BMR — makan di bawah kebutuhan dasar
 *    tubuh bukan sesuatu yang boleh disarankan aplikasi secara otomatis
 */
export function rencanaTarget({ beratKg, targetKg, hari, tdee, bmr }) {
  const kosong = {
    arah: 'jaga',
    selisihKg: 0,
    lajuDimintaKgPerMinggu: 0,
    lajuKgPerMinggu: 0,
    deltaKaloriHarian: 0,
    // null, bukan 0: berat atau tinggi yang belum diisi membuat TDEE tak
    // terhitung, dan "0 kkal" akan tampil di layar sebagai angka sungguhan.
    kaloriTarget: Number.isFinite(tdee) ? Math.round(tdee) : null,
    dibatasiOleh: null,
    hariRealistis: 0,
  };

  const beratSah = Number.isFinite(beratKg) && beratKg > 0;
  const targetSah = Number.isFinite(targetKg) && targetKg > 0;
  const hariSah = Number.isFinite(hari) && hari >= 1;
  if (!beratSah || !targetSah || !hariSah || !Number.isFinite(tdee)) return kosong;

  const selisihKg = beratKg - targetKg;
  if (Math.abs(selisihKg) < AMBANG_KG) return { ...kosong, selisihKg };

  const arah = selisihKg > 0 ? 'turun' : 'naik';
  const lajuDiminta = selisihKg / (hari / 7);

  const batas = batasLaju(beratKg);
  let laju = Math.min(Math.max(lajuDiminta, -batas.naik), batas.turun);
  let dibatasiOleh = laju !== lajuDiminta ? 'laju' : null;

  let kaloriTarget = tdee - (laju * KKAL_PER_KG) / 7;

  // Lantai BMR dipasang SETELAH batas laju, dan lajunya dihitung ulang dari
  // kalori yang benar-benar dipakai. Kalau tidak, layar akan menjanjikan
  // laju yang tidak sesuai dengan angka kalori yang ditampilkannya sendiri.
  if (Number.isFinite(bmr) && kaloriTarget < bmr) {
    kaloriTarget = bmr;
    laju = ((tdee - bmr) * 7) / KKAL_PER_KG;
    dibatasiOleh = 'bmr';
  }

  // Laju nol atau berlawanan arah berarti target tidak akan tercapai dengan
  // rencana ini — misalnya ingin naik berat padahal TDEE sudah di bawah BMR.
  const searah = laju !== 0 && Math.sign(laju) === Math.sign(selisihKg);
  const hariRealistis = searah ? Math.ceil((selisihKg / laju) * 7) : null;

  return {
    arah,
    selisihKg,
    lajuDimintaKgPerMinggu: lajuDiminta,
    lajuKgPerMinggu: laju,
    deltaKaloriHarian: Math.round(kaloriTarget - tdee),
    kaloriTarget: Math.round(kaloriTarget),
    dibatasiOleh,
    hariRealistis,
  };
}

/**
 * Perkiraan berat pada beberapa titik waktu ke depan.
 *
 * Berhenti di berat target, tidak melewatinya: orang yang sudah sampai
 * tidak lanjut turun dengan laju yang sama, dan grafik yang menembus target
 * akan terbaca sebagai janji yang salah.
 *
 * `titikMinggu` bawaannya 4/8/12 minggu — cukup jauh untuk terasa berarti,
 * cukup dekat untuk masih bisa dipercaya.
 */
export function proyeksiBerat({
  beratKg,
  targetKg,
  lajuKgPerMinggu,
  titikMinggu = [4, 8, 12],
}) {
  if (!Number.isFinite(beratKg) || !Number.isFinite(lajuKgPerMinggu)) return [];

  const punyaTarget = Number.isFinite(targetKg);

  return titikMinggu.map((minggu) => {
    const mentah = beratKg - lajuKgPerMinggu * minggu;

    let berat = mentah;
    if (punyaTarget && lajuKgPerMinggu > 0) berat = Math.max(mentah, targetKg);
    if (punyaTarget && lajuKgPerMinggu < 0) berat = Math.min(mentah, targetKg);

    return {
      minggu,
      beratKg: Math.round(berat * 10) / 10,
      tercapai: punyaTarget && berat === targetKg,
    };
  });
}

/**
 * Satu jalur dari data tubuh mentah sampai rencana dan proyeksinya.
 *
 * Ada karena TIGA tempat membutuhkan rangkaian yang sama: konteks pengguna,
 * layar pendaftaran tahap 2, dan Edit profil. Dua layar terakhir menghitung
 * dari angka yang sedang diketik — belum tersimpan — jadi mereka tidak bisa
 * sekadar membaca hasil dari konteks. Tanpa fungsi ini, rangkaiannya disalin
 * tiga kali dan bisa menyimpang diam-diam.
 */
export function rencanaLengkap({
  beratKg,
  tinggiCm,
  umur,
  gender,
  activityLevel,
  targetKg,
  hari,
}) {
  const bmr = hitungBmr({ beratKg, tinggiCm, umur, gender });
  const tdee = hitungTdee(bmr, activityLevel);
  const rencana = rencanaTarget({ beratKg, targetKg, hari, tdee, bmr });

  return {
    bmr,
    tdee,
    rencana,
    proyeksi: proyeksiBerat({
      beratKg,
      targetKg,
      lajuKgPerMinggu: rencana.lajuKgPerMinggu,
    }),
  };
}
