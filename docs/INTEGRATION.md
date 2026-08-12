# Integration Guide — Soroban ZK SDK

This guide covers patterns for integrating the Soroban ZK SDK into dApps, backends, and CI workflows.

## dApp Integration (React)

### Basic Hook Pattern

```typescript
import { useState, useCallback } from 'react';
import { generateGroth16Proof, VerifierClient } from 'soroban-zk-sdk';

function useZkProof(config: { rpcUrl: string; contractId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const client = new VerifierClient(config);

  const prove = useCallback(async (circuitInputs: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const { proof, publicSignals } = await generateGroth16Proof(
        '/circuit.wasm',
        '/circuit_final.zkey',
        circuitInputs
      );
      const vk = await fetch('/verification_key.json').then(r => r.json());
      const result = await client.verify(proof, publicSignals, vk);
      if (result.txHash) setTxHash(result.txHash);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { prove, loading, error, txHash };
}
```

## Backend Integration (Node.js)

```typescript
import { generateGroth16Proof, VerifierClient, ZkSdkError } from 'soroban-zk-sdk';

async function handleProofRequest(req: Request) {
  const client = new VerifierClient({
    rpcUrl: process.env.SOROBAN_RPC_URL!,
    contractId: process.env.VERIFIER_CONTRACT_ID!,
  });

  try {
    const { proof, publicSignals } = await generateGroth16Proof(
      './circuits/transfer.wasm',
      './circuits/transfer_final.zkey',
      req.body.inputs
    );
    const vk = require('./verification_key.json');
    return await client.verify(proof, publicSignals, vk);
  } catch (err) {
    if (err instanceof ZkSdkError) {
      return { error: err.code, message: err.message };
    }
    throw err;
  }
}
```

## Merkle Membership Pattern

```typescript
import { MerkleTree, generateNullifier } from 'soroban-zk-sdk';

// Build the membership set
const allowlist = ['user1', 'user2', 'user3'];
const tree = new MerkleTree(allowlist);
const root = tree.getRoot();

// Generate a nullifier to prevent double-use
const nullifier = generateNullifier(userSecret, 'vote-2026-Q3');

// Pass root and nullifier as circuit public inputs
const circuitInputs = {
  root,
  nullifier,
  secret: userSecret,
  pathElements: membershipProof.pathElements,
  pathIndices: membershipProof.pathIndices,
};
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SOROBAN_RPC_URL` | Soroban node RPC endpoint |
| `VERIFIER_CONTRACT_ID` | Deployed ZK verifier contract ID |
| `NETWORK_PASSPHRASE` | Stellar network passphrase |
