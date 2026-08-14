# Verification Key Rotation Without Contract Redeployment

This document describes the design for rotating ZK verification keys on a deployed Soroban verifier contract without redeploying the contract bytecode.

## Problem

ZK verification keys (VKs) are protocol-specific parameters derived during a trusted setup ceremony. They may need to be rotated when:

- A new circuit version is deployed (e.g., upgraded constraint system)
- The existing trusted setup is deprecated for security reasons
- A multi-party computation (MPC) ceremony produces a stronger setup

Redeploying the contract on every VK rotation is expensive, breaks existing integrations, and changes the contract address — requiring all clients to update. The solution is to store the VK on-chain as mutable contract state and provide an authorized rotation mechanism.

## Contract Design

### Storage Layout

```rust
// In the Soroban verifier contract
#[contracterror]
pub enum VerifierError {
    Unauthorized = 1,
    InvalidVk = 2,
    VkNotSet = 3,
}

#[contractimpl]
impl Verifier {
    // Current VK stored as a serialized byte blob
    fn vk_key() -> Symbol { symbol_short!("VK") }

    // Admin address authorized to rotate the VK
    fn admin_key() -> Symbol { symbol_short!("ADMIN") }
}
```

### Admin Authorization

Key rotation is gated by an admin address stored at contract initialization. Only the admin can call `rotate_vk`:

```rust
pub fn rotate_vk(env: Env, caller: Address, new_vk_bytes: Bytes) -> Result<(), VerifierError> {
    caller.require_auth();
    let admin: Address = env.storage().instance().get(&Self::admin_key())
        .ok_or(VerifierError::Unauthorized)?;
    if caller != admin {
        return Err(VerifierError::Unauthorized);
    }
    // Validate structure before storing
    Self::validate_vk(&new_vk_bytes)?;
    env.storage().instance().set(&Self::vk_key(), &new_vk_bytes);
    // Emit rotation event for off-chain indexers and SDK cache invalidation
    env.events().publish((symbol_short!("VK_ROTATED"),), new_vk_bytes.clone());
    Ok(())
}
```

### Validation

Before storing a new VK, the contract validates:
1. Byte length matches the expected VK serialization format
2. Group elements are on the correct elliptic curve
3. Checksum (if embedded) matches the payload

Invalid VKs are rejected before any state mutation occurs.

## SDK-Side Key Rotation

### Listening for `VK_ROTATED` Events

The SDK subscribes to the `VK_ROTATED` contract event and automatically:
1. Fetches the new VK bytes from the contract
2. Invalidates the proof cache for all entries associated with the old VK ID
3. Emits a `vkRotated` event to the application layer

```ts
sdk.on('vkRotated', ({ oldVkId, newVkId }) => {
  console.log(`VK rotated: ${oldVkId} → ${newVkId}`);
  // Application can re-request proof generation if needed
});
```

### Rotating the VK Programmatically

```ts
import { SorobanZkSdk } from '@soroban-zk/sdk';

const sdk = new SorobanZkSdk({ contractId: 'CABC...XYZ', rpcUrl: '...' });

// Requires the calling keypair to match the on-chain admin address
const txResult = await sdk.rotateVerificationKey({
  newVkBytes: newVkBuffer,
  adminKeypair: adminKeypair,
});

console.log('New VK activated at ledger:', txResult.ledger);
```

## Key Versioning

Each VK is assigned a monotonically increasing version number stored alongside the VK bytes:

```
storage: { VK: <bytes>, VK_VER: <u32> }
```

The version is included in proof cache keys so that proofs verified under a previous VK are automatically invalidated after rotation, even if the cache TTL has not expired.

## Multi-Admin and Timelock (Advanced)

For production deployments, consider:

- **Multi-sig admin**: Replace a single admin address with an `n-of-m` multisig contract
- **Timelock**: Require a 48-hour delay between announcing and executing a rotation, giving users time to review
- **Emergency revoke**: A separate `revoke_vk` function that immediately disables verification without setting a new VK, usable in response to a compromise

These patterns are out of scope for the core SDK but are supported by the contract interface.

## Migration Checklist

- [ ] Run the new trusted setup ceremony and obtain `verification_key.json`
- [ ] Serialize the VK to bytes using `serializeVk(vkJson)`
- [ ] Call `sdk.rotateVerificationKey({ newVkBytes, adminKeypair })`
- [ ] Monitor the `VK_ROTATED` event on-chain to confirm propagation
- [ ] Notify SDK consumers to pull the latest VK via `sdk.fetchCurrentVk()`
- [ ] Update any hardcoded VK identifiers in client applications
