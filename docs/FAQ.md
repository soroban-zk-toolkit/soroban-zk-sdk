# FAQ — Soroban ZK SDK

**Q: What proving system does the SDK support?**
A: Currently Groth16 via snarkjs. Plonk support is on the roadmap.

**Q: Do I need to install snarkjs separately?**
A: Yes. `snarkjs` is a peer dependency. Install it with `npm install snarkjs`.

**Q: Can I use this SDK in the browser?**
A: Yes, but proof generation (snarkjs) is CPU-intensive. Consider offloading it to a Web Worker.

**Q: How do I get a Soroban testnet account?**
A: Use the Stellar Friendbot: `curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"`.

**Q: What is a nullifier and why do I need one?**
A: A nullifier is a one-time-use value derived from a secret. It prevents double-spending without revealing the secret.

**Q: Is the SDK audited?**
A: Not yet. This is an alpha release. Do not use in production without a security audit.

**Q: How do I report a security vulnerability?**
A: See [SECURITY.md](../SECURITY.md) for the responsible disclosure process.

**Q: Can I use a custom hash function in MerkleTree?**
A: Not yet — SHA-256 is hardcoded. Pluggable hash functions are on the roadmap.

**Q: Does the SDK handle Stellar transaction signing?**
A: Not directly. The `VerifierClient` submits pre-built transactions. For signing, use `stellar-sdk` alongside this SDK.
