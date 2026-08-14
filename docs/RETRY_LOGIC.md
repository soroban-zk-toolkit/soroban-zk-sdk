# Retry Logic with Exponential Backoff for RPC Failures

This document describes the exponential backoff retry strategy used by the Soroban ZK SDK when RPC calls to the Stellar network fail.

## Overview

Network RPC calls are inherently unreliable. Transient failures — timeouts, rate-limit responses (HTTP 429), and temporary server errors (HTTP 503) — should be retried automatically rather than propagated immediately to the caller. The SDK implements an exponential backoff strategy with full jitter to spread retry load and avoid thundering-herd effects.

## Retry-Eligible Errors

Not all failures should be retried. The SDK only retries on:

| Condition | Retry? |
|---|---|
| Network timeout | Yes |
| HTTP 429 Too Many Requests | Yes |
| HTTP 503 Service Unavailable | Yes |
| HTTP 502 Bad Gateway | Yes |
| Connection reset / ECONNRESET | Yes |
| HTTP 400 Bad Request | No |
| HTTP 401 Unauthorized | No |
| HTTP 404 Not Found | No |
| Contract execution error | No |
| Proof verification failure | No |

## Backoff Formula

```
delay = min(BASE_DELAY_MS * 2^attempt, MAX_DELAY_MS) * random(0, 1)
```

This is **full jitter** — the random multiplier is uniform over `[0, 1)`, which distributes retry storms across the full range rather than clustering near the cap.

| Parameter | Default | Description |
|---|---|---|
| `BASE_DELAY_MS` | 200 | Initial base delay in milliseconds |
| `MAX_DELAY_MS` | 30 000 | Upper cap for a single delay |
| `MAX_RETRIES` | 5 | Maximum number of retry attempts |
| `JITTER` | `full` | Jitter strategy (`full`, `equal`, `none`) |

### Example Delays (full jitter, p50)

| Attempt | Max delay | p50 delay |
|---|---|---|
| 1 | 400 ms | 200 ms |
| 2 | 800 ms | 400 ms |
| 3 | 1 600 ms | 800 ms |
| 4 | 3 200 ms | 1 600 ms |
| 5 | 6 400 ms | 3 200 ms |

## Configuration

```ts
interface RetryOptions {
  maxRetries?: number;       // default 5
  baseDelayMs?: number;      // default 200
  maxDelayMs?: number;       // default 30_000
  jitter?: 'full' | 'equal' | 'none';  // default 'full'
  retryOn?: (error: unknown) => boolean; // custom predicate
}
```

## Implementation

```ts
async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 5, baseDelayMs = 200, maxDelayMs = 30_000, jitter = 'full' } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries || !isRetryable(err)) throw err;

      const cap = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      const delay = jitter === 'full' ? Math.random() * cap : cap;
      await sleep(delay);
    }
  }
  throw lastError;
}
```

## Usage

```ts
import { SorobanZkSdk } from '@soroban-zk/sdk';

const sdk = new SorobanZkSdk({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  retry: {
    maxRetries: 3,
    baseDelayMs: 500,
    jitter: 'full',
  },
});

// All RPC-backed calls automatically use the retry wrapper
const proof = await sdk.generateProof(inputs);
```

## Observability

Each retry attempt emits a `rpcRetry` event with metadata:

```ts
sdk.on('rpcRetry', ({ attempt, delay, error }) => {
  console.warn(`RPC retry #${attempt} after ${delay}ms:`, error.message);
});
```

After all retries are exhausted, the last error is rethrown as-is, preserving the original stack trace.

## Interaction with Proof Caching

If the SDK has a proof cache configured (see `docs/PROOF_CACHING.md`), a successful cache hit skips the RPC call entirely, so retry logic is never invoked for cached results. Retry only applies to live on-chain calls.
