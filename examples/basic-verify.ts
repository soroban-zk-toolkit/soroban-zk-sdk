/**
 * basic-verify.ts
 *
 * End-to-end example: generate a Groth16 proof and verify it against
 * a Soroban ZK verifier contract on testnet.
 *
 * Prerequisites:
 *   - circuit.wasm and circuit_final.zkey in ./circuits/
 *   - verification_key.json in ./circuits/
 *   - SOROBAN_RPC_URL and VERIFIER_CONTRACT_ID set in environment
 */

import { generateGroth16Proof, VerifierClient, ZkSdkError } from '../src';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const rpcUrl = process.env.SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
  const contractId = process.env.VERIFIER_CONTRACT_ID ?? '';

  if (!contractId) {
    console.error('Error: VERIFIER_CONTRACT_ID environment variable is required');
    process.exit(1);
  }

  const circuitsDir = path.resolve(__dirname, '../circuits');
  const wasmPath = path.join(circuitsDir, 'circuit.wasm');
  const zkeyPath = path.join(circuitsDir, 'circuit_final.zkey');
  const vkPath = path.join(circuitsDir, 'verification_key.json');

  console.log('Generating proof...');
  let proof, publicSignals;
  try {
    ({ proof, publicSignals } = await generateGroth16Proof(wasmPath, zkeyPath, {
      secret: '123456789',
      nullifier: '987654321',
    }));
    console.log('Proof generated:', JSON.stringify(proof, null, 2));
    console.log('Public signals:', publicSignals);
  } catch (err) {
    if (err instanceof ZkSdkError) {
      console.error(`Proof generation failed [${err.code}]:`, err.message);
    } else {
      console.error('Unexpected error during proof generation:', err);
    }
    process.exit(1);
  }

  const verificationKey = JSON.parse(fs.readFileSync(vkPath, 'utf8'));

  const client = new VerifierClient({ rpcUrl, contractId });

  console.log('\nSubmitting proof for on-chain verification...');
  try {
    const result = await client.verify(proof, publicSignals, verificationKey);
    if (result.verified) {
      console.log('Proof verified successfully!');
      console.log('Transaction hash:', result.txHash);
    } else {
      console.log('Proof rejected by contract.');
    }
  } catch (err) {
    if (err instanceof ZkSdkError) {
      console.error(`Verification failed [${err.code}]:`, err.message);
    } else {
      console.error('Unexpected error during verification:', err);
    }
    process.exit(1);
  }
}

main();
