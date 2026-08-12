/**
 * Error codes for the Soroban ZK SDK.
 */
export enum ZkErrorCode {
  PROOF_GENERATION_FAILED = 'PROOF_GENERATION_FAILED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  INVALID_VERIFICATION_KEY = 'INVALID_VERIFICATION_KEY',
  INVALID_PUBLIC_INPUTS = 'INVALID_PUBLIC_INPUTS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  NULLIFIER_ALREADY_SPENT = 'NULLIFIER_ALREADY_SPENT',
  MERKLE_ERROR = 'MERKLE_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Base error class for all Soroban ZK SDK errors.
 */
export class ZkSdkError extends Error {
  readonly code: ZkErrorCode;
  readonly cause?: unknown;

  constructor(message: string, code: ZkErrorCode, cause?: unknown) {
    super(message);
    this.name = 'ZkSdkError';
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Thrown when proof generation fails (e.g., bad circuit inputs or missing wasm/zkey).
 */
export class ProofGenerationError extends ZkSdkError {
  constructor(message: string, cause?: unknown) {
    super(message, ZkErrorCode.PROOF_GENERATION_FAILED, cause);
    this.name = 'ProofGenerationError';
  }
}

/**
 * Thrown when on-chain or off-chain verification of a proof fails.
 */
export class VerificationError extends ZkSdkError {
  constructor(message: string, cause?: unknown) {
    super(message, ZkErrorCode.VERIFICATION_FAILED, cause);
    this.name = 'VerificationError';
  }
}

/**
 * Thrown when a verification key is malformed or missing required fields.
 */
export class InvalidVerificationKeyError extends ZkSdkError {
  constructor(message: string, cause?: unknown) {
    super(message, ZkErrorCode.INVALID_VERIFICATION_KEY, cause);
    this.name = 'InvalidVerificationKeyError';
  }
}

/**
 * Thrown when network communication with a Soroban node fails.
 */
export class NetworkError extends ZkSdkError {
  constructor(message: string, cause?: unknown) {
    super(message, ZkErrorCode.NETWORK_ERROR, cause);
    this.name = 'NetworkError';
  }
}

/**
 * Thrown when a nullifier has already been spent.
 */
export class NullifierAlreadySpentError extends ZkSdkError {
  readonly nullifier: string;

  constructor(nullifier: string) {
    super(`Nullifier already spent: ${nullifier}`, ZkErrorCode.NULLIFIER_ALREADY_SPENT);
    this.name = 'NullifierAlreadySpentError';
    this.nullifier = nullifier;
  }
}
