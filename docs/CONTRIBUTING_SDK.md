# SDK Contributor Guide

Welcome! This document covers the specifics of contributing to the Soroban ZK SDK codebase. For general contribution guidelines, see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Repository Layout

```
src/
  types.ts          — Core TypeScript types
  errors.ts         — Typed error classes
  utils.ts          — Encoding/conversion utilities
  merkle.ts         — MerkleTree implementation
  nullifier.ts      — Nullifier generation
  proofGenerator.ts — Groth16 proof generation wrapper
  witnessBuilder.ts — Circuit witness construction
  verifierClient.ts — Legacy REST submit helper
  client.ts         — VerifierClient for Soroban RPC
  index.ts          — Public API barrel export
__tests__/          — Jest unit tests
examples/           — Runnable TypeScript examples
docs/               — Documentation markdown
```

## Adding a New Module

1. Create `src/your-module.ts` with exported functions/classes
2. Re-export from `src/index.ts`
3. Add tests in `__tests__/your-module.test.ts`
4. Document public API in `docs/API_REFERENCE.md`

## Error Handling Conventions

- All public functions must throw `ZkSdkError` subclasses, never plain `Error`
- Wrap third-party errors: `throw new ProofGenerationError('...', originalError)`
- Validate inputs at the top of each function and throw `InvalidVerificationKeyError` / similar early

## Testing

```bash
npx jest              # run all tests
npx jest --watch      # watch mode
npx jest --coverage   # coverage report
```

Target: 80%+ line coverage on all `src/` files.

## TypeScript Guidelines

- Prefer explicit return types on all exported functions
- Use `readonly` arrays where mutation is not needed
- Avoid `any` — use `unknown` and narrow with type guards
- Export all types that appear in function signatures

## Commit Message Format

```
feat(merkle): add getProof method for membership proofs
fix(client): wrap network errors in NetworkError class
docs(api): add VerifierClient examples to API reference
test(merkle): add odd-leaf-count edge case
```

Prefixes: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
