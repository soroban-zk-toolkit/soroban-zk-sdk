# soroban-zk-sdk

[![npm](https://img.shields.io/npm/v/soroban-zk-sdk)](https://www.npmjs.com/package/soroban-zk-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-blueviolet)](https://stellar.org/soroban)

**TypeScript SDK for generating ZK proofs and interacting with Soroban ZK verifier contracts on Stellar.**

> Alpha release — API is unstable. Not audited. Do not use in production.

---

## Features

- Groth16 proof generation via snarkjs
- `VerifierClient` for submitting proofs to Soroban contracts
- `MerkleTree` helper for membership proof inputs
- Nullifier generation to prevent double-spend
- Typed error classes (`ZkSdkError` hierarchy)
- Encoding utilities (hex, bytes, BigInt conversions)

## Installation

```bash
npm install soroban-zk-sdk snarkjs
```

## Quickstart

```typescript
import { generateGroth16Proof, VerifierClient } from 'soroban-zk-sdk';

// 1. Generate a proof
const { proof, publicSignals } = await generateGroth16Proof(
  './circuit.wasm',
  './circuit_final.zkey',
  { secret: '12345', nullifier: '67890' }
);

// 2. Verify on-chain
const client = new VerifierClient({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  contractId: 'CXXXX...',
});
const vk = require('./verification_key.json');
const result = await client.verify(proof, publicSignals, vk);
console.log(result.verified); // true
```

## Merkle Membership

```typescript
import { MerkleTree, generateNullifier } from 'soroban-zk-sdk';

const tree = new MerkleTree(['alice', 'bob', 'charlie']);
const root = tree.getRoot();
const nullifier = generateNullifier('my-secret', 'action-context');
```

## Documentation

- [Quickstart Guide](docs/QUICKSTART.md)
- [API Reference](docs/API_REFERENCE.md)
- [Integration Guide](docs/INTEGRATION.md)
- [FAQ](docs/FAQ.md)
- [Roadmap](ROADMAP.md)
- [Changelog](CHANGELOG.md)
- [Security Policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## Examples

See [`examples/`](examples/) for runnable TypeScript scripts:
- [`basic-verify.ts`](examples/basic-verify.ts) — end-to-end proof generation and on-chain verification
- [`merkle-proof.ts`](examples/merkle-proof.ts) — Merkle tree membership proof construction

## License

MIT
