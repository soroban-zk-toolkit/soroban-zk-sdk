# TypeScript Strict Mode Guide

This document explains how to enable TypeScript strict mode in the Soroban ZK SDK and how to fix the common type errors that surface once strict checks are turned on.

## Enabling Strict Mode

In `tsconfig.json`, set:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

The `strict` flag enables the following individual options:

| Flag | What it catches |
|---|---|
| `strictNullChecks` | Forbids treating `null`/`undefined` as other types |
| `strictFunctionTypes` | Enforces contravariant parameter checking for function types |
| `strictBindCallApply` | Type-checks `.bind`, `.call`, `.apply` arguments |
| `strictPropertyInitialization` | Requires class properties to be assigned in the constructor |
| `noImplicitAny` | Errors on inferred `any` types |
| `noImplicitThis` | Errors on `this` expressions with an implied `any` type |
| `alwaysStrict` | Emits `'use strict'` in every output file |

## Common Errors and Fixes

### 1. `Object is possibly 'undefined'`

```ts
// Before
function getProofHash(result: ProofResult | undefined) {
  return result.proof.pi_a[0]; // TS2532: Object is possibly 'undefined'
}

// After
function getProofHash(result: ProofResult | undefined) {
  if (!result) throw new Error('No proof result');
  return result.proof.pi_a[0];
}
```

### 2. `noImplicitAny` on callback parameters

```ts
// Before
const signals = publicInputs.map(s => BigInt(s)); // ok
const parsed = rawData.map(item => item.value);    // TS7006: 'item' implicitly has 'any' type

// After
interface RawItem { value: string }
const parsed = (rawData as RawItem[]).map(item => item.value);
```

### 3. `strictPropertyInitialization` in classes

```ts
// Before
class ProofCache {
  private store: Map<string, CacheEntry>; // TS2564: not definitely assigned
}

// After
class ProofCache {
  private store: Map<string, CacheEntry> = new Map();
}
```

### 4. `strictFunctionTypes` with callbacks

```ts
// Before
type Listener = (event: ProofEvent | ErrorEvent) => void;
const handler: Listener = (event: ProofEvent) => { /* ... */ }; // TS2322

// After
type Listener = (event: ProofEvent | ErrorEvent) => void;
const handler: Listener = (event) => {
  if (event instanceof ProofEvent) { /* ... */ }
};
```

### 5. Return type inference becomes stricter

```ts
// Before
function buildArgs(inputs: unknown) {
  if (!inputs) return; // inferred return type widens to undefined
  return serialize(inputs);
}

// After — annotate explicitly
function buildArgs(inputs: unknown): SerializedArgs | undefined {
  if (!inputs) return undefined;
  return serialize(inputs);
}
```

## Incremental Migration

If the codebase is large, enable strict flags incrementally rather than all at once:

1. Start with `strictNullChecks: true` — highest ROI, catches most real bugs
2. Add `noImplicitAny: true`
3. Add `strictPropertyInitialization: true`
4. Enable `strict: true` as a final step once all per-flag errors are resolved

Use `// @ts-strict-ignore` sparingly as a temporary escape hatch during migration, never as a permanent suppression.

## `skipLibCheck` Consideration

If third-party dependencies have their own type errors under strict mode, use:

```json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true
  }
}
```

This skips checking `node_modules/**/*.d.ts` without relaxing checks on the SDK's own source.

## Verifying the Build

After enabling strict mode, verify with:

```bash
npx tsc --noEmit
```

A clean exit (no output) means all strict checks pass. CI should run this command on every PR.
