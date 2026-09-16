import { register } from 'node:module';

/**
 * Titik masuk `node --import`, memasang loader uji sebelum berkas uji dimuat.
 * Lihat `loader.mjs` untuk alasan loadernya ada.
 */
register('./loader.mjs', import.meta.url);
