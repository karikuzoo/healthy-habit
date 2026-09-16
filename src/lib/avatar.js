import { Directory, File, Paths } from 'expo-file-system';

/**
 * Penyimpanan foto profil (PROF-9).
 *
 * `expo-image-picker` mengembalikan berkas di direktori CACHE — URI-nya
 * berbentuk `file:///.../cache/cropped1814158652.jpg`. Menyimpan URI itu apa
 * adanya ke database akan membuat fotonya hilang sendiri: cache boleh dihapus
 * sistem kapan saja saat penyimpanan menipis, dan yang tertinggal di kolom
 * `avatar_uri` adalah penunjuk ke berkas yang sudah tidak ada.
 *
 * Karena itu berkasnya DISALIN ke direktori dokumen, yang memang dijanjikan
 * aman dari pembersihan sistem.
 *
 * Nama berkasnya memuat timestamp, bukan hanya id pengguna. Kalau namanya
 * tetap, komponen gambar akan menampilkan foto LAMA dari cache-nya sendiri
 * meski isi berkasnya sudah diganti — URI yang sama dianggap gambar yang sama.
 */

/** Subdirektori tempat seluruh foto profil disimpan. */
const AVATAR_DIR = 'avatars';

/** Ekstensi bawaan kalau URI sumbernya tidak memberi petunjuk. */
const DEFAULT_EXTENSION = 'jpg';

/**
 * Menebak ekstensi dari URI, tanpa ikut terbawa query string.
 *
 * URI dari picker kadang berbentuk `...jpg?width=100`, dan ekstensi yang
 * memuat tanda tanya akan menghasilkan nama berkas yang tidak sah.
 */
export function extensionFromUri(uri) {
  const withoutQuery = String(uri ?? '').split('?')[0];
  const lastSegment = withoutQuery.split('/').pop() ?? '';
  const dot = lastSegment.lastIndexOf('.');

  if (dot === -1 || dot === lastSegment.length - 1) return DEFAULT_EXTENSION;

  const extension = lastSegment.slice(dot + 1).toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(extension) ? extension : DEFAULT_EXTENSION;
}

/** Nama berkas untuk foto profil baru. */
export function avatarFileName(userId, sourceUri, now = Date.now()) {
  return `${userId}-${now}.${extensionFromUri(sourceUri)}`;
}

/**
 * Menyalin foto terpilih ke penyimpanan tetap, lalu mengembalikan URI barunya.
 *
 * Foto lama dihapus SESUDAH yang baru selesai disalin — kalau urutannya
 * dibalik dan penyalinan gagal, pengguna kehilangan foto lamanya tanpa
 * mendapat yang baru.
 */
export async function saveAvatar(sourceUri, userId, previousUri = null) {
  const directory = new Directory(Paths.document, AVATAR_DIR);
  if (!directory.exists) directory.create({ intermediates: true });

  const destination = new File(directory, avatarFileName(userId, sourceUri));
  await new File(sourceUri).copy(destination);

  await deleteAvatar(previousUri);

  return destination.uri;
}

/**
 * Menghapus berkas foto profil, kalau ada.
 *
 * Kegagalan sengaja ditelan: berkas yang sudah lenyap bukan alasan untuk
 * menggagalkan penyimpanan profil. Yang penting kolom di database sudah
 * tidak lagi menunjuk ke sana.
 */
export async function deleteAvatar(uri) {
  if (!uri) return;

  try {
    const file = new File(uri);
    if (file.exists) await file.delete();
  } catch {
    // berkasnya memang sudah tidak ada — tidak ada yang perlu dilakukan
  }
}
