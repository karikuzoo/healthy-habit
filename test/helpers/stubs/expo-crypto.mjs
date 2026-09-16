import { createHash, randomBytes, randomUUID as nodeRandomUUID } from 'node:crypto';

/**
 * Pengganti `expo-crypto` selama uji.
 *
 * Implementasinya SUNGGUHAN, bukan boneka: SHA-256 dan byte acak di Node
 * menghasilkan nilai yang sama persis dengan di perangkat. Jadi uji kata
 * sandi benar-benar menguji hashing-nya, bukan sekadar alurnya.
 */
export const CryptoDigestAlgorithm = {
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA384: 'SHA-384',
  SHA512: 'SHA-512',
};

export function randomUUID() {
  return nodeRandomUUID();
}

export async function getRandomBytesAsync(byteCount) {
  return new Uint8Array(randomBytes(byteCount));
}

export async function digestStringAsync(algorithm, data) {
  const nodeName = String(algorithm).toLowerCase().replace('-', '');
  return createHash(nodeName).update(data, 'utf8').digest('hex');
}
