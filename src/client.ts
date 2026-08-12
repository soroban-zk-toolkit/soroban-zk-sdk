import fetch from 'node-fetch';
import { Proof, PublicInputs, VerificationKey } from './types';
import { NetworkError, VerificationError, InvalidVerificationKeyError } from './errors';

export interface VerifierClientConfig {
  /** RPC endpoint of the Soroban node (e.g. https://soroban-testnet.stellar.org) */
  rpcUrl: string;
  /** Deployed ZK verifier contract ID on Stellar */
  contractId: string;
  /** Optional request timeout in milliseconds (default: 30_000) */
  timeoutMs?: number;
}

export interface VerifyResult {
  verified: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Client for submitting ZK proofs to a deployed Soroban verifier contract.
 *
 * @example
 * ```typescript
 * const client = new VerifierClient({
 *   rpcUrl: 'https://soroban-testnet.stellar.org',
 *   contractId: 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
 * });
 * const result = await client.verify(proof, publicInputs, verificationKey);
 * console.log(result.verified); // true
 * ```
 */
export class VerifierClient {
  private readonly config: Required<VerifierClientConfig>;

  constructor(config: VerifierClientConfig) {
    this.config = {
      timeoutMs: 30_000,
      ...config,
    };
  }

  /**
   * Submit a ZK proof for on-chain verification via the Soroban contract.
   *
   * @param proof - The Groth16 proof to verify
   * @param publicInputs - The public signals from proof generation
   * @param verificationKey - The circuit's verification key
   * @returns Verification result including tx hash on success
   */
  async verify(
    proof: Proof,
    publicInputs: PublicInputs,
    verificationKey: VerificationKey
  ): Promise<VerifyResult> {
    this.validateVerificationKey(verificationKey);

    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: {
        contractId: this.config.contractId,
        function: 'verify_proof',
        args: { proof, publicInputs, verificationKey },
      },
    };

    let response: Response;
    try {
      // @ts-ignore — node-fetch types differ from browser fetch
      response = await fetch(this.config.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (err) {
      throw new NetworkError(
        `Failed to reach Soroban RPC at ${this.config.rpcUrl}`,
        err
      );
    }

    if (!response.ok) {
      throw new NetworkError(`Soroban RPC returned HTTP ${response.status}`);
    }

    const body = (await response.json()) as any;

    if (body.error) {
      throw new VerificationError(body.error.message ?? 'Contract verification failed', body.error);
    }

    return {
      verified: body.result?.verified === true,
      txHash: body.result?.txHash,
    };
  }

  /**
   * Submit a proof to a REST endpoint (alternative to direct RPC).
   */
  async submitProof(
    endpoint: string,
    proof: Proof,
    publicInputs: PublicInputs
  ): Promise<unknown> {
    let res: Response;
    try {
      // @ts-ignore
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof, publicInputs }),
      });
    } catch (err) {
      throw new NetworkError(`Failed to reach endpoint ${endpoint}`, err);
    }
    return res.json();
  }

  private validateVerificationKey(vk: VerificationKey): void {
    if (!vk || typeof vk !== 'object') {
      throw new InvalidVerificationKeyError('Verification key must be a non-null object');
    }
    const required = ['alpha', 'beta', 'gamma', 'delta', 'ic'] as const;
    for (const field of required) {
      if (!(field in vk)) {
        throw new InvalidVerificationKeyError(
          `Verification key is missing required field: "${field}"`
        );
      }
    }
  }
}
