import {
  bytesToHex,
  hexToBytes,
  bigIntToHex,
  hexToBigInt,
  isHex,
  padHex,
  serializeProof,
  deserializeProof,
} from '../src/utils';

describe('bytesToHex', () => {
  it('converts bytes to hex string', () => {
    expect(bytesToHex(new Uint8Array([0, 1, 255]))).toBe('0001ff');
  });
});

describe('hexToBytes', () => {
  it('converts hex string to bytes', () => {
    expect(hexToBytes('0001ff')).toEqual(new Uint8Array([0, 1, 255]));
  });
  it('handles 0x prefix', () => {
    expect(hexToBytes('0x0001ff')).toEqual(new Uint8Array([0, 1, 255]));
  });
});

describe('bigIntToHex / hexToBigInt', () => {
  it('round-trips', () => {
    const n = BigInt('123456789');
    expect(hexToBigInt(bigIntToHex(n))).toBe(n);
  });
});

describe('isHex', () => {
  it('returns true for valid hex', () => {
    expect(isHex('0xdeadbeef')).toBe(true);
    expect(isHex('deadbeef')).toBe(true);
  });
  it('returns false for non-hex', () => {
    expect(isHex('xyz')).toBe(false);
  });
});

describe('padHex', () => {
  it('pads to target byte length', () => {
    expect(padHex('ff', 4)).toBe('000000ff');
  });
});

describe('serializeProof and deserializeProof', () => {
  const sampleProof = {
    a: '1122334455667788',
    b: 'aabbccddeeff00112233',
    c: '9988776655443322',
  };

  it('serializes to hex string by default and deserializes back', () => {
    const serialized = serializeProof(sampleProof);
    expect(typeof serialized).toBe('string');
    expect(isHex(serialized)).toBe(true);

    const deserialized = deserializeProof(serialized);
    expect(deserialized).toEqual(sampleProof);
  });

  it('supports 0x prefix for hex output and deserializes with 0x', () => {
    const serialized = serializeProof(sampleProof, { prefix: true });
    expect(serialized.startsWith('0x')).toBe(true);

    const deserialized = deserializeProof(serialized);
    expect(deserialized).toEqual(sampleProof);
  });

  it('serializes to raw binary Uint8Array and deserializes back', () => {
    const binary = serializeProof(sampleProof, { format: 'bytes' });
    expect(binary).toBeInstanceOf(Uint8Array);

    const deserialized = deserializeProof(binary);
    expect(deserialized).toEqual(sampleProof);
  });

  it('deserializes standard 256-byte uncompressed Groth16 proof', () => {
    const a = '01'.repeat(64);
    const b = '02'.repeat(128);
    const c = '03'.repeat(64);
    const raw = a + b + c;

    const deserialized = deserializeProof(raw);
    expect(deserialized).toEqual({ a, b, c });
  });

  it('deserializes standard 128-byte compressed Groth16 proof', () => {
    const a = 'aa'.repeat(32);
    const b = 'bb'.repeat(64);
    const c = 'cc'.repeat(32);
    const raw = a + b + c;

    const deserialized = deserializeProof(raw);
    expect(deserialized).toEqual({ a, b, c });
  });

  it('deserializes JSON-formatted proof string', () => {
    const jsonStr = JSON.stringify(sampleProof);
    const deserialized = deserializeProof(jsonStr);
    expect(deserialized).toEqual(sampleProof);
  });

  it('rejects invalid or empty input', () => {
    expect(() => serializeProof(null as any)).toThrow();
    expect(() => serializeProof({ a: '1', b: '2' } as any)).toThrow();
    expect(() => deserializeProof('')).toThrow();
    expect(() => deserializeProof('1234')).toThrow();
  });
});

