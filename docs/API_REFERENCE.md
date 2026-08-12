# API Reference — Soroban ZK SDK

## Types

### `Proof`
```typescript
type Proof = { a: string; b: string; c: string };
```
A Groth16 proof with three elliptic curve point components.

### `ProofBytes`
```typescript
type ProofBytes = string;
```
Hex-encoded serialized proof for on-chain submission.

### `PublicInputs`
```typescript
type PublicInputs = string[];
```
Public signals from proof generation (decimal field elements).

### `VerificationKey`
```typescript
type VerificationKey = {
  alpha: string; beta: string; gamma: string; delta: string; ic: string[];
};
```

### `MerkleProof`
```typescript
type MerkleProof = {
  leaf: string; pathElements: string[]; pathIndices: number[]; root: string;
};
```

### `CircuitConfig`
```typescript
type CircuitConfig = { wasmPath: string; zkeyPath: string };
```

---

## `MerkleTree`

```typescript
class MerkleTree {
  constructor(leaves?: string[])
  getRoot(): string
}
```

**`constructor(leaves?: string[])`** — Create a tree. Each leaf is SHA-256 hashed internally.

**`getRoot(): string`** — Returns the Merkle root hex string.

---

## `VerifierClient`

```typescript
class VerifierClient {
  constructor(config: VerifierClientConfig)
  verify(proof, publicInputs, verificationKey): Promise<VerifyResult>
  submitProof(endpoint, proof, publicInputs): Promise<unknown>
}
```

### `VerifierClientConfig`
| Field | Type | Description |
|-------|------|-------------|
| `rpcUrl` | `string` | Soroban RPC endpoint |
| `contractId` | `string` | Deployed verifier contract ID |
| `timeoutMs` | `number?` | Request timeout (default: 30000) |

### `VerifyResult`
| Field | Type | Description |
|-------|------|-------------|
| `verified` | `boolean` | Whether the proof was accepted |
| `txHash` | `string?` | Transaction hash on success |
| `error` | `string?` | Error message on failure |

---

## Functions

### `generateGroth16Proof(wasmPath, zkeyPath, input)`
Generates a Groth16 proof using snarkjs.

**Returns:** `Promise<{ proof: Proof; publicSignals: PublicInputs }>`

### `generateNullifier(secret, context)`
Generates a deterministic nullifier from a secret and context string.

**Returns:** `string` — SHA-256 hex digest

### `buildWitnessFromInputs(inputs)`
Passthrough helper that maps circuit input fields.

**Returns:** `Record<string, any>`

---

## Utilities

### `bytesToHex(bytes: Uint8Array): string`
### `hexToBytes(hex: string): Uint8Array`
### `bigIntToHex(n: bigint, byteLength?: number): string`
### `hexToBigInt(hex: string): bigint`
### `isHex(value: string): boolean`
### `padHex(hex: string, byteLength: number): string`

---

## Errors

| Class | Code | Thrown when |
|-------|------|-------------|
| `ZkSdkError` | (base) | Base class for all SDK errors |
| `ProofGenerationError` | `PROOF_GENERATION_FAILED` | Circuit execution fails |
| `VerificationError` | `VERIFICATION_FAILED` | On-chain verification rejected |
| `InvalidVerificationKeyError` | `INVALID_VERIFICATION_KEY` | Malformed vk input |
| `NetworkError` | `NETWORK_ERROR` | RPC/HTTP failure |
| `NullifierAlreadySpentError` | `NULLIFIER_ALREADY_SPENT` | Reused nullifier detected |
