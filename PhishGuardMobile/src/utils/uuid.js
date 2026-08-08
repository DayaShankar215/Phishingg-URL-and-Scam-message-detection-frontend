// utils/uuid.js
// Native-safe UUID v4 generator.
// The `uuid` npm package (v14+) is ESM-only and relies on `crypto.getRandomValues`,
// which is NOT a global on Android/Hermes (browsers/Node have it, native RN does not).
// This implementation prefers the Web Crypto API when present and falls back to
// Math.random so guest ids work identically on web, iOS and Android release builds.

const randomHexBytes = (length) => {
  const globalCrypto =
    typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

  if (globalCrypto && typeof globalCrypto.getRandomValues === 'function') {
    try {
      const bytes = new Uint8Array(length);
      globalCrypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    } catch (error) {
      // fall through to Math.random below
    }
  }

  const bytes = [];
  for (let i = 0; i < length; i++) {
    bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
  }
  return bytes;
};

export const uuidv4 = () => {
  const rnds = randomHexBytes(16);
  rnds[6] = ((parseInt(rnds[6], 16) & 0x0f) | 0x40).toString(16).padStart(2, '0');
  rnds[8] = ((parseInt(rnds[8], 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');
  return [
    rnds.slice(0, 4).join(''),
    rnds.slice(4, 6).join(''),
    rnds.slice(6, 8).join(''),
    rnds.slice(8, 10).join(''),
    rnds.slice(10, 16).join(''),
  ].join('-');
};

export default uuidv4;