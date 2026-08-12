import {
  ZkSdkError, ZkErrorCode, ProofGenerationError, VerificationError,
  InvalidVerificationKeyError, NetworkError, NullifierAlreadySpentError
} from '../src/errors';

describe('ZkSdkError hierarchy', () => {
  it('ProofGenerationError is a ZkSdkError', () => {
    const err = new ProofGenerationError('failed');
    expect(err).toBeInstanceOf(ZkSdkError);
    expect(err.code).toBe(ZkErrorCode.PROOF_GENERATION_FAILED);
    expect(err.name).toBe('ProofGenerationError');
  });

  it('VerificationError has correct code', () => {
    const err = new VerificationError('bad proof');
    expect(err.code).toBe(ZkErrorCode.VERIFICATION_FAILED);
  });

  it('InvalidVerificationKeyError has correct code', () => {
    const err = new InvalidVerificationKeyError('missing field');
    expect(err.code).toBe(ZkErrorCode.INVALID_VERIFICATION_KEY);
  });

  it('NetworkError has correct code', () => {
    const err = new NetworkError('timeout');
    expect(err.code).toBe(ZkErrorCode.NETWORK_ERROR);
  });

  it('NullifierAlreadySpentError stores nullifier', () => {
    const err = new NullifierAlreadySpentError('0xdeadbeef');
    expect(err.nullifier).toBe('0xdeadbeef');
    expect(err.code).toBe(ZkErrorCode.NULLIFIER_ALREADY_SPENT);
  });
});
