# Changelog

All notable changes to the Soroban ZK SDK are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Plonk proving system support
- Pluggable hash functions for MerkleTree
- React hook `useZkProof`
- Proof serialization/deserialization utilities
- Integration tests against Soroban testnet

---

## [0.1.0-alpha] — 2026-08-12

### Added
- `MerkleTree` class with SHA-256 hashing and root computation
- `generateNullifier` function for deterministic nullifier derivation
- `generateGroth16Proof` wrapper around snarkjs groth16.fullProve
- `buildWitnessFromInputs` passthrough helper
- `VerifierClient` class for submitting proofs to Soroban RPC
- `submitProof` REST helper
- Typed error hierarchy: `ZkSdkError`, `ProofGenerationError`, `VerificationError`,
  `InvalidVerificationKeyError`, `NetworkError`, `NullifierAlreadySpentError`
- Utility functions: `bytesToHex`, `hexToBytes`, `bigIntToHex`, `hexToBigInt`, `isHex`, `padHex`
- Extended `types.ts`: `VerificationKey`, `ProofBytes`, `Nullifier`, `CircuitConfig`
- Quickstart, API reference, integration guide, FAQ, and contributor documentation
- Examples: `basic-verify.ts`, `merkle-proof.ts`
- `SECURITY.md`, `ROADMAP.md`, `CHANGELOG.md`
- GitHub issue templates and PR template

### Notes
- Alpha release — API is unstable and subject to breaking changes
- Not audited — do not use in production
