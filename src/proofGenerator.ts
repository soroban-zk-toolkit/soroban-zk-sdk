import snarkjs from 'snarkjs';
import { Proof, PublicInputs } from './types';

export async function generateGroth16Proof(witnessWasmPath: string, zkeyPath: string, input: any): Promise<{proof: Proof; publicSignals: PublicInputs}> {
  // wrapper around snarkjs groth16 fullProve (users should install snarkjs)
  // This function intentionally keeps a thin wrapper; heavy lifting done by snarkjs.
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, witnessWasmPath, zkeyPath);
  return { proof: proof as unknown as Proof, publicSignals };
}
