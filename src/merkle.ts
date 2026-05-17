import { createHash } from 'crypto';

export function hash(data: string) {
  return createHash('sha256').update(data).digest('hex');
}

export class MerkleTree {
  leaves: string[];
  constructor(leaves: string[] = []) {
    this.leaves = leaves.map((l) => hash(l));
  }
  getRoot(): string {
    let nodes = this.leaves.slice();
    if (nodes.length === 0) return '';
    while (nodes.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < nodes.length; i += 2) {
        const a = nodes[i];
        const b = i + 1 < nodes.length ? nodes[i + 1] : nodes[i];
        next.push(hash(a + b));
      }
      nodes = next;
    }
    return nodes[0];
  }
}
