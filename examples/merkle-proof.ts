/**
 * merkle-proof.ts
 *
 * Example: build a Merkle tree from an allowlist, generate a membership proof,
 * and use it as input to a ZK circuit.
 */

import { MerkleTree, generateNullifier, bytesToHex } from '../src';
import { createHash } from 'crypto';

function main() {
  // 1. Build the allowlist Merkle tree
  const allowlist = [
    'GDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Alice
    'GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Bob
    'GCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Charlie
  ];

  const tree = new MerkleTree(allowlist);
  const root = tree.getRoot();
  console.log('Merkle root:', root);

  // 2. Generate a nullifier for the action (prevents double-use)
  const userSecret = 'my-super-secret-key-never-share-this';
  const actionContext = 'airdrop-round-1';
  const nullifier = generateNullifier(userSecret, actionContext);
  console.log('Nullifier:', nullifier);

  // 3. Hash the user's identity (leaf value matches what was inserted)
  const userIdentity = allowlist[0]; // Alice
  const leafHash = createHash('sha256').update(userIdentity).digest('hex');
  console.log('Leaf hash (Alice):', leafHash);

  // 4. Construct circuit inputs
  // In a real circuit, pathElements and pathIndices come from tree.getProof()
  // (getProof is on the roadmap — see issue #3)
  const circuitInputs = {
    root,
    nullifier,
    leafHash,
    secret: bytesToHex(Buffer.from(userSecret)),
    // pathElements: [...],  // from tree.getProof(leafIndex)
    // pathIndices: [...],
  };

  console.log('\nCircuit inputs ready for proof generation:');
  console.log(JSON.stringify(circuitInputs, null, 2));

  console.log('\nNext step: pass circuitInputs to generateGroth16Proof()');
  console.log('See examples/basic-verify.ts for the full proof generation flow.');
}

main();
