import { createHash } from 'crypto';

export function generateNullifier(secret: string, context: string) {
  return createHash('sha256').update(secret + '|' + context).digest('hex');
}

/**
 * Manages a set of spent nullifiers to prevent double-use.
 */
export class NullifierManager {
  private spent: Set<string> = new Set();

  /**
   * Check whether a nullifier has already been spent.
   */
  isSpent(nullifier: string): boolean {
    return this.spent.has(nullifier);
  }

  /**
   * Mark a nullifier as spent.
   * @throws {Error} if the nullifier is already spent
   */
  markSpent(nullifier: string): void {
    if (this.spent.has(nullifier)) {
      throw new Error(`Nullifier already spent: ${nullifier}`);
    }
    this.spent.add(nullifier);
  }

  /**
   * Return all spent nullifiers.
   */
  getSpent(): string[] {
    return Array.from(this.spent);
  }
}
