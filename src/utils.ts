/**
 * Utility helpers for encoding, decoding, and converting proof data.
 */

import { Proof, ProofBytes } from './types';

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

export interface SerializeProofOptions {
  /**
   * Output encoding format.
   * 'hex' (default) returns a hex string (`ProofBytes`).
   * 'bytes' returns a raw `Uint8Array`.
   */
  format?: 'hex' | 'bytes';
  /**
   * Whether to include '0x' prefix when output format is 'hex'.
   * Default: false.
   */
  prefix?: boolean;
}

/**
 * Serializes a typed Groth16 `Proof` object into a binary or hex format
 * suitable for submission to Soroban contract entry points.
 *
 * @param proof - The typed Proof object containing components a, b, c.
 * @param options - Serialization options (format: 'hex' | 'bytes', prefix: boolean).
 * @returns Serialized proof as a hex string or Uint8Array.
 */
export function serializeProof(
  proof: Proof,
  options?: { format?: 'hex'; prefix?: boolean }
): ProofBytes;
export function serializeProof(
  proof: Proof,
  options: { format: 'bytes' }
): Uint8Array;
export function serializeProof(
  proof: Proof,
  options?: SerializeProofOptions
): ProofBytes | Uint8Array;
export function serializeProof(
  proof: Proof,
  options: SerializeProofOptions = {}
): ProofBytes | Uint8Array {
  if (!proof || typeof proof !== 'object') {
    throw new Error('Invalid proof: expected an object with a, b, c components');
  }
  if (!proof.a || !proof.b || !proof.c) {
    throw new Error('Invalid proof: missing required a, b, or c components');
  }

  const getBytes = (val: string): Uint8Array => {
    const norm = val.startsWith('0x') ? val.slice(2) : val;
    if (isHex(norm) && norm.length > 0 && norm.length % 2 === 0) {
      return hexToBytes(norm);
    }
    return encodeUtf8(val);
  };

  const bytesA = getBytes(proof.a);
  const bytesB = getBytes(proof.b);
  const bytesC = getBytes(proof.c);

  // Magic prefix (0x5350 = 'SP' for Soroban Proof) + 4-byte lengths for robust framing
  const totalLength = 2 + 4 + bytesA.length + 4 + bytesB.length + 4 + bytesC.length;
  const buffer = new Uint8Array(totalLength);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // Magic marker: 0x53, 0x50 ('S', 'P')
  buffer[0] = 0x53;
  buffer[1] = 0x50;

  let offset = 2;
  // Write component A
  view.setUint32(offset, bytesA.length, false);
  offset += 4;
  buffer.set(bytesA, offset);
  offset += bytesA.length;

  // Write component B
  view.setUint32(offset, bytesB.length, false);
  offset += 4;
  buffer.set(bytesB, offset);
  offset += bytesB.length;

  // Write component C
  view.setUint32(offset, bytesC.length, false);
  offset += 4;
  buffer.set(bytesC, offset);

  if (options.format === 'bytes') {
    return buffer;
  }

  const hex = bytesToHex(buffer);
  return options.prefix ? `0x${hex}` : hex;
}

/**
 * Deserializes proof bytes or hex string back into a typed `Proof` object.
 *
 * Supports magic length-framed proofs, raw concatenated point buffers,
 * and JSON-encoded proof payloads.
 *
 * @param serialized - The serialized proof as a hex string or Uint8Array.
 * @returns Typed Proof object.
 */
export function deserializeProof(serialized: ProofBytes | Uint8Array): Proof {
  if (!serialized) {
    throw new Error('Cannot deserialize empty or null proof');
  }

  let bytes: Uint8Array;
  if (typeof serialized === 'string') {
    const trimmed = serialized.trim();
    // Check if JSON string
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.a && parsed.b && parsed.c) {
          return { a: String(parsed.a), b: String(parsed.b), c: String(parsed.c) };
        }
      } catch {
        // Fall through to hex parsing
      }
    }
    bytes = hexToBytes(serialized);
  } else if (serialized instanceof Uint8Array) {
    bytes = serialized;
  } else {
    throw new Error('Unsupported serialized proof format: expected hex string or Uint8Array');
  }

  // Case 1: Magic length-framed format (starts with 'SP' = [0x53, 0x50])
  if (bytes.length >= 14 && bytes[0] === 0x53 && bytes[1] === 0x50) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 2;

    const lenA = view.getUint32(offset, false);
    offset += 4;
    const aBytes = bytes.slice(offset, offset + lenA);
    offset += lenA;

    const lenB = view.getUint32(offset, false);
    offset += 4;
    const bBytes = bytes.slice(offset, offset + lenB);
    offset += lenB;

    const lenC = view.getUint32(offset, false);
    offset += 4;
    const cBytes = bytes.slice(offset, offset + lenC);

    return {
      a: bytesToHex(aBytes),
      b: bytesToHex(bBytes),
      c: bytesToHex(cBytes),
    };
  }

  // Case 2: Standard uncompressed Groth16 representation (256 bytes: 64 bytes A, 128 bytes B, 64 bytes C)
  if (bytes.length === 256) {
    return {
      a: bytesToHex(bytes.slice(0, 64)),
      b: bytesToHex(bytes.slice(64, 192)),
      c: bytesToHex(bytes.slice(192, 256)),
    };
  }

  // Case 3: Standard compressed Groth16 representation (128 bytes: 32 bytes A, 64 bytes B, 32 bytes C)
  if (bytes.length === 128) {
    return {
      a: bytesToHex(bytes.slice(0, 32)),
      b: bytesToHex(bytes.slice(32, 96)),
      c: bytesToHex(bytes.slice(96, 128)),
    };
  }

  // Case 4: Try JSON parse from UTF-8 bytes
  try {
    const jsonStr = decodeUtf8(bytes);
    const parsed = JSON.parse(jsonStr);
    if (parsed.a && parsed.b && parsed.c) {
      return { a: String(parsed.a), b: String(parsed.b), c: String(parsed.c) };
    }
  } catch {
    // ignore
  }

  throw new Error(`Invalid serialized proof payload: unrecognized byte length ${bytes.length}`);
}
