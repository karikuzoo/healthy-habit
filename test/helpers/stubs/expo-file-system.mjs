/**
 * Pengganti `expo-file-system` selama uji.
 *
 * Berkasnya hanya dicatat di Map, bukan ditulis ke disk — yang diuji adalah
 * PERILAKU `saveAvatar`: berkas disalin ke tujuan yang benar, dan foto lama
 * dihapus hanya SESUDAH yang baru berhasil disalin.
 */
export const fakeDisk = new Map();

export function resetDisk() {
  fakeDisk.clear();
}

/** Disetel uji untuk memaksa `copy` gagal. */
export const failures = { copy: false };

export class Directory {
  constructor(...parts) {
    this.uri = parts.map((p) => (typeof p === 'string' ? p : p.uri)).join('/');
  }

  get exists() {
    return fakeDisk.has(`dir:${this.uri}`);
  }

  create() {
    fakeDisk.set(`dir:${this.uri}`, true);
  }
}

export class File {
  constructor(...parts) {
    this.uri = parts.map((p) => (typeof p === 'string' ? p : p.uri)).join('/');
  }

  get exists() {
    return fakeDisk.has(this.uri);
  }

  async copy(destination) {
    if (failures.copy) throw new Error('penyalinan gagal');
    fakeDisk.set(destination.uri, fakeDisk.get(this.uri) ?? 'isi-berkas');
  }

  async delete() {
    fakeDisk.delete(this.uri);
  }
}

export const Paths = {
  document: { uri: 'file:///dokumen' },
  cache: { uri: 'file:///cache' },
};
