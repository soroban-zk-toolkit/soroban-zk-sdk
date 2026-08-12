/**
 * Utility helpers for encoding, decoding, and converting proof data.
 */

/**
 * Convert a Uint8Array to a hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert a hex string to a Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error('Invalid hex string: odd number of characters');
  }
  const result = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    result[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return result;
}

/**
 * Convert a BigInt to a fixed-length big-endian hex string.
 */
export function bigIntToHex(n: bigint, byteLength = 32): string {
  return n.toString(16).padStart(byteLength * 2, '0');
}

/**
 * Convert a hex string to a BigInt.
 */
export function hexToBigInt(hex: string): bigint {
  const normalized = hex.startsWith('0x') ? hex : '0x' + hex;
  return BigInt(normalized);
}

/**
 * Encode a string to its UTF-8 bytes.
 */
export function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Decode UTF-8 bytes to a string.
 */
export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Check whether a string is a valid 0x-prefixed or unprefixed hex string.
 */
export function isHex(value: string): boolean {
  return /^(0x)?[0-9a-fA-F]*$/.test(value);
}

/**
 * Zero-pad a hex string to a target byte length.
 */
export function padHex(hex: string, byteLength: number): string {
  const stripped = hex.startsWith('0x') ? hex.slice(2) : hex;
  return stripped.padStart(byteLength * 2, '0');
}
