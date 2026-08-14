# Contributing Guide for SDK Module Authors

This guide explains how to add new circuit adapters and SDK modules to the Soroban ZK SDK. It covers the module interface contract, registration, testing requirements, and the review process.

## Module Types

The SDK supports two extension points:

| Type | Purpose | Example |
|---|---|---|
| **Circuit Adapter** | Wraps a specific ZK circuit (WASM + zkey) | Groth16 Merkle-proof adapter, PLONK range adapter |
| **SDK Module** | Adds higher-level functionality | Batch verifier, proof aggregator, analytics reporter |

## Adding a Circuit Adapter

### 1. Implement the `CircuitAdapter` Interface

```ts
// src/adapters/my-circuit.adapter.ts
import type { CircuitAdapter, CircuitInputs, ProofResult } from '@soroban-zk/sdk/types';

export class MyCircuitAdapter implements CircuitAdapter {
  readonly id = 'my-circuit-v1';           // unique, stable identifier
  readonly wasmUrl: string;
  readonly zkeyUrl: string;

  constructor(options: { wasmUrl: string; zkeyUrl: string }) {
    this.wasmUrl = options.wasmUrl;
    this.zkeyUrl = options.zkeyUrl;
  }

  /** Validate inputs before proof generation — throw on invalid */
  validateInputs(inputs: CircuitInputs): void {
    if (typeof inputs.value !== 'string') {
      throw new TypeError('CircuitInputs.value must be a string');
    }
  }

  /** Transform SDK-level inputs to the format snarkjs expects */
  prepareInputs(inputs: CircuitInputs): Record<string, string | string[]> {
    return { value: inputs.value as string };
  }

  /** Optionally transform the raw ProofResult before returning to the caller */
  postProcess(result: ProofResult): ProofResult {
    return result; // pass-through by default
  }
}
```

### 2. Register the Adapter

```ts
// src/adapters/index.ts  (add to the exports map)
export { MyCircuitAdapter } from './my-circuit.adapter';
```

Registering at the SDK level:

```ts
import { SorobanZkSdk } from '@soroban-zk/sdk';
import { MyCircuitAdapter } from './my-circuit.adapter';

const sdk = new SorobanZkSdk({ network: NETWORKS.TESTNET });
sdk.registerAdapter(new MyCircuitAdapter({
  wasmUrl: '/circuits/my-circuit.wasm',
  zkeyUrl: '/circuits/my-circuit_final.zkey',
}));

// Use by adapter ID
const proof = await sdk.generateProof('my-circuit-v1', inputs);
```

### 3. Add Unit Tests

Every adapter must include tests covering:

```ts
// src/adapters/__tests__/my-circuit.adapter.test.ts
import { MyCircuitAdapter } from '../my-circuit.adapter';

describe('MyCircuitAdapter', () => {
  const adapter = new MyCircuitAdapter({ wasmUrl: '', zkeyUrl: '' });

  it('has a stable, unique id', () => {
    expect(adapter.id).toBe('my-circuit-v1');
  });

  it('validateInputs throws on missing value', () => {
    expect(() => adapter.validateInputs({})).toThrow(TypeError);
  });

  it('prepareInputs returns correct snarkjs format', () => {
    expect(adapter.prepareInputs({ value: '42' })).toEqual({ value: '42' });
  });
});
```

## Adding an SDK Module

### 1. Implement the `SdkModule` Interface

```ts
// src/modules/my-module.ts
import type { SdkModule, SdkModuleContext } from '@soroban-zk/sdk/types';

export class MyModule implements SdkModule {
  readonly name = 'my-module';

  install(context: SdkModuleContext): void {
    // context.sdk — the parent SorobanZkSdk instance
    // context.events — typed EventEmitter
    // context.cache — proof cache (if configured)
    context.events.on('proofGenerated', this.onProofGenerated.bind(this));
  }

  uninstall(context: SdkModuleContext): void {
    context.events.off('proofGenerated', this.onProofGenerated.bind(this));
  }

  private onProofGenerated(result: ProofResult): void {
    console.log('[my-module] Proof generated:', result.proof.pi_a[0]);
  }
}
```

### 2. Registering the Module

```ts
const sdk = new SorobanZkSdk({ network: NETWORKS.TESTNET });
sdk.use(new MyModule());
```

## Naming and Versioning Conventions

- Adapter IDs: `{circuit-name}-v{N}` (e.g., `merkle-proof-v2`)
- Module names: kebab-case noun describing the feature (e.g., `batch-verifier`)
- Increment the version suffix when breaking the `validateInputs` or `prepareInputs` contract; older versions can remain registered simultaneously

## Pull Request Checklist

Before submitting a PR that adds a circuit adapter or SDK module:

- [ ] Implements the full `CircuitAdapter` or `SdkModule` interface
- [ ] Has a stable, unique `id` / `name` that will not change once merged
- [ ] Includes unit tests with ≥ 80% branch coverage for the adapter/module
- [ ] Exports are added to `src/adapters/index.ts` or `src/modules/index.ts`
- [ ] Types are exported from `src/types.ts` if new public types are added
- [ ] `docs/` entry added describing the circuit's inputs, constraints, and trust assumptions
- [ ] No new runtime dependencies unless justified in the PR description

## Review Process

1. Open a draft PR early for design feedback
2. Request review from at least one core maintainer (`@Devcyprian`)
3. CI must pass: `npx tsc --noEmit` and all unit tests
4. Once approved, squash-merge into `main`

## Questions?

Open an issue with the label `module-proposal` to discuss a new adapter or module before starting implementation.
