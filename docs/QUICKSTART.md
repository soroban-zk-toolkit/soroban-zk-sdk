# Quickstart — Soroban ZK SDK

This guide gets you from zero to a working ZK proof submission on Soroban in under 10 minutes.

## Prerequisites

- Node.js 18+
- A Stellar account funded on testnet (`friendbot.stellar.org`)
- A deployed Soroban ZK verifier contract

## Installation

```bash
npm install soroban-zk-sdk snarkjs
```

## 1. Generate a Proof

```typescript
import { generateGroth16Proof } from 'soroban-zk-sdk';

const { proof, publicSignals } = await generateGroth16Proof(
  './circuit.wasm',
  './circuit_final.zkey',
  { secret: '12345', nullifier: '67890' }
);

console.log('Proof:', proof);
console.log('Public signals:', publicSignals);
```

## 2. Verify On-Chain via Soroban

```typescript
import { VerifierClient } from 'soroban-zk-sdk';

const client = new VerifierClient({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  contractId: 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
});

const verificationKey = require('./verification_key.json');
const result = await client.verify(proof, publicSignals, verificationKey);

if (result.verified) {
  console.log('Proof verified! Tx:', result.txHash);
} else {
  console.error('Proof rejected');
}
```

## 3. Build a Merkle Membership Proof

```typescript
import { MerkleTree } from 'soroban-zk-sdk';

const tree = new MerkleTree(['alice', 'bob', 'charlie']);
const root = tree.getRoot();
console.log('Merkle root:', root);
```

## 4. Track Nullifiers

```typescript
import { generateNullifier } from 'soroban-zk-sdk';

const nullifier = generateNullifier('my-secret', 'transfer-context');
console.log('Nullifier:', nullifier);
```

## Next Steps

- Read the [API Reference](./API_REFERENCE.md) for full documentation
- See [examples/](../examples/) for complete working scripts
- Read the [Integration Guide](./INTEGRATION.md) for dApp patterns
