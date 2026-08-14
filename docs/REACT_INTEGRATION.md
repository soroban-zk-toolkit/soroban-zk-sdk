# React Integration — `useZkProof` Hook

This guide covers the `useZkProof` React hook shipped with the Soroban ZK SDK for generating ZK proofs inside React applications with built-in loading and error state management.

## Overview

The `useZkProof` hook wraps the SDK's `BrowserProofGenerator` and exposes a simple, idiomatic React API. It handles:

- Async proof generation lifecycle (idle → loading → success / error)
- Cancellation when the component unmounts
- Optional integration with the SDK proof cache

## Installation

```bash
npm install @soroban-zk/sdk @soroban-zk/react
```

## Hook Signature

```ts
function useZkProof(options: UseZkProofOptions): UseZkProofResult;

interface UseZkProofOptions {
  wasmUrl: string;
  zkeyUrl: string;
  cache?: ProofCache;           // optional proof cache instance
  onSuccess?: (result: ProofResult) => void;
  onError?: (error: Error) => void;
}

interface UseZkProofResult {
  generate: (inputs: CircuitInputs) => Promise<void>;
  proof: ProofResult | null;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}
```

## Basic Example

```tsx
import { useZkProof } from '@soroban-zk/react';

function ProofButton() {
  const { generate, proof, isLoading, error, reset } = useZkProof({
    wasmUrl: '/circuits/circuit.wasm',
    zkeyUrl: '/circuits/circuit_final.zkey',
  });

  const handleClick = () => {
    generate({ secret: '42', nullifier: '99' });
  };

  if (isLoading) return <p>Generating proof…</p>;
  if (error) return <p>Error: {error.message} <button onClick={reset}>Retry</button></p>;
  if (proof) return <p>Proof ready: {proof.proof.pi_a[0].slice(0, 8)}…</p>;

  return <button onClick={handleClick}>Generate Proof</button>;
}
```

## State Machine

```
idle
 │
 ▼ generate() called
loading
 │
 ├─── success ──▶ success (proof available)
 │
 └─── failure ──▶ error (error available)

reset() from any state ──▶ idle
```

## With Loading Progress

```tsx
import { useZkProof } from '@soroban-zk/react';
import { useState } from 'react';

function ProofWithProgress() {
  const [progress, setProgress] = useState(0);

  const { generate, proof, isLoading, error } = useZkProof({
    wasmUrl: '/circuits/circuit.wasm',
    zkeyUrl: '/circuits/circuit_final.zkey',
    onProgress: ({ loaded, total }) => setProgress(Math.round((loaded / total) * 100)),
  });

  return (
    <div>
      {isLoading && <progress value={progress} max={100} />}
      <button onClick={() => generate({ x: '7' })} disabled={isLoading}>
        Prove
      </button>
      {error && <p className="error">{error.message}</p>}
      {proof && <pre>{JSON.stringify(proof.publicSignals, null, 2)}</pre>}
    </div>
  );
}
```

## With Proof Cache

Reuse a shared cache instance across multiple components to avoid re-generating identical proofs:

```tsx
import { ProofCache } from '@soroban-zk/sdk';
import { useZkProof } from '@soroban-zk/react';

// Create the cache once at the app level (e.g., Context or a module singleton)
const sharedCache = new ProofCache({ ttl: 300_000 });

function CachedProofComponent() {
  const { generate, proof, isLoading } = useZkProof({
    wasmUrl: '/circuits/circuit.wasm',
    zkeyUrl: '/circuits/circuit_final.zkey',
    cache: sharedCache,  // second call with same inputs skips generation
  });

  return (
    <button onClick={() => generate({ value: '1' })} disabled={isLoading}>
      {isLoading ? 'Generating…' : 'Generate (cached)'}
    </button>
  );
}
```

## Submitting the Proof to Soroban

After proof generation, use the Freighter wallet adapter to submit the proof on-chain:

```tsx
import { serializeProofForSoroban, submitProof } from '@soroban-zk/react';
import { getPublicKey, signTransaction } from '@stellar/freighter-api';

async function submitOnChain(proof: ProofResult) {
  const userAddress = await getPublicKey();
  const txXdr = await serializeProofForSoroban(proof, {
    contractId: 'CABC...XYZ',
    networkPassphrase: 'Test SDF Network ; September 2015',
    userAddress,
  });
  const signedXdr = await signTransaction(txXdr, { network: 'TESTNET' });
  await submitProof(signedXdr);
}
```

## TypeScript Types

All hook inputs and outputs are fully typed. Import types directly:

```ts
import type { ProofResult, CircuitInputs, UseZkProofOptions } from '@soroban-zk/react';
```

## Testing

Mock the proof generator in unit tests:

```tsx
// __mocks__/@soroban-zk/react.ts
export const useZkProof = jest.fn(() => ({
  generate: jest.fn(),
  proof: null,
  isLoading: false,
  error: null,
  reset: jest.fn(),
}));
```
