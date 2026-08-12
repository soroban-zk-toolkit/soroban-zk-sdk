/**
 * A Groth16 ZK proof consisting of three elliptic curve point components.
 */
export type Proof = {
  a: string;
  b: string;
  c: string;
};

/** Serialized proof bytes as a hex string for on-chain submission. */
export type ProofBytes = string;

/**
 * Public inputs / signals output by proof generation.
 * Each element is a field element represented as a decimal string.
 */
export type PublicInputs = string[];

/**
 * Groth16 verification key structure as exported by snarkjs.
 */
export type VerificationKey = {
  alpha: string;
  beta: string;
  gamma: string;
  delta: string;
  /** Accumulator points for public inputs */
  ic: string[];
  [key: string]: unknown;
};

/**
 * Membership proof for a leaf in a Merkle tree.
 */
export type MerkleProof = {
  leaf: string;
  pathElements: string[];
  pathIndices: number[];
  root: string;
};

/**
 * A nullifier value represented as a hex string.
 */
export type Nullifier = string;

/**
 * Configuration for a ZK circuit (wasm + zkey paths).
 */
export type CircuitConfig = {
  wasmPath: string;
  zkeyPath: string;
};
