# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x (alpha) | Yes — best effort |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

To report a vulnerability, email **security@soroban-zk-toolkit.dev** with:

1. A description of the vulnerability and its potential impact
2. Steps to reproduce or a proof-of-concept
3. Affected versions

We will acknowledge receipt within 48 hours and provide a remediation timeline within 7 days.

## Security Considerations

### Alpha Status
This SDK is in alpha. It has not been audited. **Do not use in production systems** without a thorough security review.

### ZK Proof Security
- Circuit files (`.wasm`, `.zkey`) must be sourced from a trusted, verified ceremony
- Never use development/test zkeys in production
- Verification keys must match the exact circuit used for proof generation

### Key Management
- Never commit secrets, private keys, or zkeys to version control
- Use environment variables (see `.env.example`) for all sensitive configuration

### Nullifier Reuse
- The SDK generates nullifiers deterministically from secrets. Ensure nullifier storage is persistent and tamper-resistant to prevent double-spend attacks.
