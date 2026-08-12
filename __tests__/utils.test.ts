import { bytesToHex, hexToBytes, bigIntToHex, hexToBigInt, isHex, padHex } from '../src/utils';

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
