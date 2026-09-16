import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

/**
 * Loader modul khusus untuk uji — TIDAK memengaruhi aplikasi sama sekali.
 *
 * Kode di `src/` ditulis untuk Metro, bukan untuk Node, dan tiga perbedaan itu
 * yang menghalanginya diimpor langsung oleh `node --test`:
 *
 * 1. `src/db/helpers.js` mengimpor `expo-crypto`, paket React Native yang
 *    tidak bisa dimuat di Node. Seluruh modul di `src/db/` lewat sana, jadi
 *    satu impor ini mengunci semuanya.
 * 2. `src/db/foods.js` mengimpor `foodCatalog.json` secara polos. Metro
 *    menerimanya; Node ESM menuntut `with { type: 'json' }`.
 * 3. Impor relatif ditulis tanpa ekstensi (`./helpers`, `../data/nutrition`).
 *    Metro menebak ekstensinya; Node ESM menuntut jalur yang utuh.
 *
 * Alternatifnya adalah mengubah kode produksi agar ramah-uji — menyuntikkan
 * pembuat id, atau memindahkan impor JSON. Keduanya membuat kode aplikasi
 * lebih rumit demi kebutuhan uji, dan itu urutan yang terbalik. Loader ini
 * menaruh penyesuaiannya di sisi uji, tempatnya memang di sini.
 */

const STUBS = {
  'expo-crypto': new URL('./stubs/expo-crypto.mjs', import.meta.url).href,
  'expo-file-system': new URL('./stubs/expo-file-system.mjs', import.meta.url).href,
};

/** Ekstensi yang ditebak Metro, diurutkan seperti urutan resolusinya. */
const EXTENSIONS = ['.js', '.jsx', '/index.js', '/index.jsx'];

export async function resolve(specifier, context, nextResolve) {
  const stub = STUBS[specifier];
  if (stub) return { url: stub, shortCircuit: true };

  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !specifier.startsWith('.')) {
      throw error;
    }

    for (const extension of EXTENSIONS) {
      try {
        return await nextResolve(specifier + extension, context);
      } catch {
        // coba ekstensi berikutnya
      }
    }

    throw error;
  }
}

export async function load(url, context, nextLoad) {
  // JSON dibungkus jadi modul ESM biasa, supaya impor polos ala Metro jalan.
  if (url.startsWith('file:') && url.endsWith('.json')) {
    const source = await readFile(fileURLToPath(url), 'utf8');
    return {
      format: 'module',
      source: `export default ${source};`,
      shortCircuit: true,
    };
  }

  return nextLoad(url, context);
}

/** Dipakai berkas uji untuk mengimpor modul aplikasi lewat jalur absolut. */
export function appModule(relativePath) {
  const root = path.resolve(fileURLToPath(import.meta.url), '../../..');
  return pathToFileURL(path.join(root, relativePath)).href;
}
