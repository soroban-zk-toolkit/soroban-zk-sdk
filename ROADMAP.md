# Roadmap — Soroban ZK SDK

## v0.1.0-alpha (Current)
- [x] Groth16 proof generation via snarkjs
- [x] VerifierClient for Soroban RPC
- [x] MerkleTree helper
- [x] Nullifier generation
- [x] Typed error classes
- [x] Encoding utilities

## v0.2.0 — Developer Experience
- [ ] `useZkProof` React hook
- [ ] Proof serialization/deserialization for Soroban XDR format
- [ ] CLI tool for local circuit testing
- [ ] Improved TypeScript types (branded types for proof fields)
- [ ] Jest integration test suite against Soroban testnet

## v0.3.0 — Extended Proving Systems
- [ ] Plonk proving system support
- [ ] FFLONK support
- [ ] Pluggable hash functions for MerkleTree (Poseidon, Pedersen)
- [ ] Sparse Merkle Tree support

## v1.0.0 — Stable Release
- [ ] Security audit
- [ ] Full API stability guarantee (semver)
- [ ] Comprehensive integration tests
- [ ] npm provenance publishing
- [ ] Full JSDoc on all exported symbols
- [ ] Performance benchmarks

## Post-1.0 Ideas
- WASM build for browser-native proof generation
- Multi-contract verifier registry client
- Proof aggregation utilities
- Hardware wallet signing integration
