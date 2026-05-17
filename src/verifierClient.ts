import fetch from 'node-fetch';
import { Proof, PublicInputs } from './types';

export async function submitProof(endpoint: string, proof: Proof, publicInputs: PublicInputs) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proof, publicInputs }),
  });
  return res.json();
}
