# Proof Caching Layer

This document describes the design for caching ZK proof verification results to avoid redundant on-chain verification calls.

## Overview

On-chain verification is expensive in terms of both time and gas fees. When the same proof is submitted multiple times (e.g., in retry scenarios or duplicate submissions), re-verifying it wastes resources. The proof caching layer stores verification results locally with a configurable TTL and invalidates entries automatically on verification key rotation.

## Cache Key

The cache key is derived from a SHA-256 hash of:
- The serialized proof bytes
- The public inputs array
- The verification key identifier (VK ID or contract address)

```ts
function buildCacheKey(proof: Uint8Array, publicInputs: string[], vkId: string): string {
  const raw = JSON.stringify({ proof: Buffer.from(proof).toString('hex'), publicInputs, vkId });
  return crypto.createHash('sha256').update(raw).digest('hex');
}
```

## Cache Entry Structure

```ts
interface CacheEntry {
  result: boolean;          // verification outcome
  verifiedAt: number;       // Unix timestamp (ms)
  ttl: number;              // time-to-live in milliseconds
  vkId: string;             // verification key ID at time of caching
}
```

## TTL Policy

- Default TTL: **5 minutes** (300 000 ms)
- Configurable via `ProofCacheOptions.ttl`
- Entries older than their TTL are considered stale and trigger a fresh on-chain call
- Negative results (proof invalid) are cached for a shorter period (**30 seconds**) to allow resubmission after correction

```ts
interface ProofCacheOptions {
  ttl?: number;          // default 300_000
  negativeTtl?: number;  // default 30_000
  maxEntries?: number;   // LRU eviction limit, default 1000
}
```

## Cache Invalidation on Key Rotation

When a verification key is rotated (see `docs/VERIFICATION_KEY_ROTATION.md`), all cache entries associated with the old VK ID must be invalidated immediately.

```ts
class ProofCache {
  invalidateByVkId(vkId: string): void {
    for (const [key, entry] of this.store.entries()) {
      if (entry.vkId === vkId) {
        this.store.delete(key);
      }
    }
  }
}
```

The SDK emits a `vkRotated` event that the cache subscribes to automatically, so callers do not need to manage invalidation manually.

## LRU Eviction

When `maxEntries` is reached, the least-recently-used entry is evicted. The underlying store uses a `Map` (insertion-order) combined with a move-to-end on access to approximate LRU without external dependencies.

## Usage

```ts
import { ProofCache } from '@soroban-zk/sdk';

const cache = new ProofCache({ ttl: 600_000, maxEntries: 500 });

const sdk = new SorobanZkSdk({ proofCache: cache });

// Subsequent calls with the same proof skip on-chain verification
const result1 = await sdk.verifyProof(proof, publicInputs); // hits chain
const result2 = await sdk.verifyProof(proof, publicInputs); // served from cache
```

## Metrics

The cache exposes hit/miss counters accessible via `cache.stats()`:

```ts
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  invalidations: number;
}
```

## Security Considerations

- The cache **must not** be shared across different contract addresses or network environments
- Positive results cached before a key rotation will be invalidated automatically; applications must not bypass the SDK cache layer
- The cache lives in-process memory only — it does not persist across restarts, preventing stale results from surviving deployments
