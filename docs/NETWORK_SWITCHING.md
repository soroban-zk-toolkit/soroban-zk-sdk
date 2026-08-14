# Network Switching Between Testnet and Mainnet

This guide explains how to configure and switch the Soroban ZK SDK between Stellar Testnet and Mainnet (Pubnet).

## Network Presets

The SDK ships with two built-in network presets:

| Preset | RPC URL | Network Passphrase | Contract Registry |
|---|---|---|---|
| `testnet` | `https://soroban-testnet.stellar.org` | `Test SDF Network ; September 2015` | `testnet.registry.json` |
| `mainnet` | `https://mainnet.stellar.validationcloud.io/v1/<API_KEY>` | `Public Global Stellar Network ; September 2015` | `mainnet.registry.json` |

## Configuration at Initialization

```ts
import { SorobanZkSdk, NETWORKS } from '@soroban-zk/sdk';

// Testnet (default for development)
const sdk = new SorobanZkSdk({ network: NETWORKS.TESTNET });

// Mainnet
const sdk = new SorobanZkSdk({
  network: NETWORKS.MAINNET,
  rpcApiKey: process.env.STELLAR_RPC_API_KEY,
});
```

## Custom Network Configuration

```ts
const sdk = new SorobanZkSdk({
  network: {
    rpcUrl: 'https://my-private-node.example.com',
    networkPassphrase: 'Private Stellar Network ; 2024',
    contractId: 'CABC...XYZ',
  },
});
```

## Runtime Network Switching

Switch networks without creating a new SDK instance:

```ts
await sdk.switchNetwork(NETWORKS.MAINNET, {
  rpcApiKey: process.env.STELLAR_RPC_API_KEY,
});

console.log('Now on:', sdk.currentNetwork.name); // "mainnet"
```

`switchNetwork` performs the following before completing:
1. Drains any in-flight RPC requests
2. Clears the proof cache (proofs verified on testnet are not valid on mainnet)
3. Reloads the contract ID from the registry for the new network
4. Emits a `networkSwitched` event

## Environment-Based Auto-Selection

Use environment variables for automatic selection in CI and production:

```ts
import { SorobanZkSdk, NETWORKS, networkFromEnv } from '@soroban-zk/sdk';

// Reads STELLAR_NETWORK env var: 'testnet' | 'mainnet'
const sdk = new SorobanZkSdk({ network: networkFromEnv() });
```

Set in your environment:
```bash
# .env.development
STELLAR_NETWORK=testnet

# .env.production
STELLAR_NETWORK=mainnet
STELLAR_RPC_API_KEY=your_api_key_here
```

## Network-Specific Contract IDs

Each network deploys its own verifier contract. The SDK registry maps network names to contract IDs:

```ts
// Override the registry entry for a specific network
const sdk = new SorobanZkSdk({
  network: NETWORKS.TESTNET,
  contractId: 'CABC...TESTNET_OVERRIDE',
});
```

## Listening for Network Events

```ts
sdk.on('networkSwitched', ({ from, to }) => {
  console.log(`Switched from ${from.name} to ${to.name}`);
  // Re-fetch any network-specific data (e.g., current VK)
  sdk.fetchCurrentVk().then(vk => updateUI(vk));
});
```

## Wallet Integration

When switching networks, ensure the connected wallet (e.g., Freighter) is also set to the same network. The SDK does not control wallet settings:

```ts
import { getNetworkDetails } from '@stellar/freighter-api';

sdk.on('networkSwitched', async ({ to }) => {
  const walletNetwork = await getNetworkDetails();
  if (walletNetwork.networkPassphrase !== to.networkPassphrase) {
    console.warn('Wallet network mismatch — ask user to switch wallet network');
  }
});
```

## Testing Both Networks in CI

```yaml
# .github/workflows/integration.yml
strategy:
  matrix:
    network: [testnet, mainnet]
env:
  STELLAR_NETWORK: ${{ matrix.network }}
  STELLAR_RPC_API_KEY: ${{ secrets.STELLAR_RPC_API_KEY }}
```

## Common Mistakes

| Mistake | Result | Fix |
|---|---|---|
| Using testnet contract ID on mainnet | Transaction fails with `HostError: contract not found` | Use `networkFromEnv()` or explicit network preset |
| Not clearing proof cache on switch | Stale cache entries from the other network | `switchNetwork()` clears the cache automatically |
| Hardcoding network passphrase | Breaks when passphrase is corrected | Use `NETWORKS.TESTNET.networkPassphrase` constant |
