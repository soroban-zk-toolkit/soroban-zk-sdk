# Browser-Compatible Proof Generation Using snarkjs WASM

This guide explains how to generate ZK proofs in a browser environment using the snarkjs WebAssembly build bundled with the Soroban ZK SDK.

## Overview

Server-side proof generation requires Node.js native modules. For browser applications (React, Vue, plain JS), the SDK ships a dedicated WASM build that runs snarkjs entirely in the browser without any server round-trips.

## Requirements

- A modern browser with WebAssembly support (all major browsers since 2017)
- A bundler that supports WASM assets (Vite, webpack 5, Rollup with the `@rollup/plugin-wasm` plugin)
- The circuit `.zkey` and `.wasm` files served from a reachable URL or bundled as assets

## Installation

```bash
# WASM build is included in the main package — no separate install needed
npm install @soroban-zk/sdk
```

## Bundler Configuration

### Vite

```ts
// vite.config.ts
export default {
  optimizeDeps: {
    exclude: ['@soroban-zk/sdk'],
  },
};
```

### webpack 5

```js
// webpack.config.js
module.exports = {
  experiments: { asyncWebAssembly: true },
};
```

## Basic Usage

```ts
import { BrowserProofGenerator } from '@soroban-zk/sdk/browser';

const generator = new BrowserProofGenerator({
  wasmUrl: '/circuits/circuit.wasm',
  zkeyUrl: '/circuits/circuit_final.zkey',
});

const { proof, publicSignals } = await generator.generate({
  // circuit-specific inputs
  secret: '12345',
  nullifier: '67890',
});

console.log('Proof:', proof);
console.log('Public signals:', publicSignals);
```

## Loading Progress

Large `.zkey` files (often 10–100 MB) take time to fetch. Use the `onProgress` callback:

```ts
const generator = new BrowserProofGenerator({
  wasmUrl: '/circuits/circuit.wasm',
  zkeyUrl: '/circuits/circuit_final.zkey',
  onProgress: ({ phase, loaded, total }) => {
    console.log(`${phase}: ${Math.round((loaded / total) * 100)}%`);
  },
});
```

Phases: `'fetching-wasm'`, `'fetching-zkey'`, `'proving'`.

## Web Worker Support

For large circuits, proof generation can block the main thread for several seconds. Run it in a Web Worker:

```ts
// proof.worker.ts
import { BrowserProofGenerator } from '@soroban-zk/sdk/browser';

self.onmessage = async ({ data }) => {
  const generator = new BrowserProofGenerator(data.options);
  const result = await generator.generate(data.inputs);
  self.postMessage(result);
};
```

```ts
// main.ts
const worker = new Worker(new URL('./proof.worker.ts', import.meta.url), { type: 'module' });
worker.postMessage({ options, inputs });
worker.onmessage = ({ data }) => console.log('Proof ready:', data);
```

## Caching Compiled WASM

The browser automatically caches compiled WASM modules via the HTTP cache. Ensure your server sets appropriate `Cache-Control` headers for `.wasm` files:

```
Cache-Control: public, max-age=31536000, immutable
```

## Formatting the Proof for Soroban

Once a proof is generated in the browser, serialize it for submission to a Soroban verifier contract:

```ts
import { serializeProofForSoroban } from '@soroban-zk/sdk/browser';

const sorobanArgs = serializeProofForSoroban(proof, publicSignals, vkeyJson);

// Pass sorobanArgs to a wallet (e.g., Freighter) transaction builder
```

## Limitations

- WASM execution is single-threaded in the browser; use a Web Worker to avoid UI freezes
- Very large circuits (>100M constraints) may exceed browser memory limits
- Safari on iOS has stricter WASM memory limits than desktop browsers; test on device

## Security Considerations

- Circuit files (`.wasm`, `.zkey`) are public; never embed secret keys in them
- Always verify the proof on-chain; browser-generated proofs are not trusted by themselves
- Validate public signals against expected ranges before constructing a transaction
