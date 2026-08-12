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

/**
 * Insert a new leaf into the tree and return the new root.
 * Note: rebuilds the full tree — for large trees, use an incremental implementation.
 */
export function insertLeaf(tree: MerkleTree, leaf: string): string {
  tree.leaves.push(hash(leaf));
  return tree.getRoot();
}

/**
 * Generate a membership proof for a leaf at the given index.
 * Returns path elements and path indices for use as circuit inputs.
 */
export function getMerkleProof(tree: MerkleTree, leafIndex: number): { pathElements: string[]; pathIndices: number[]; root: string } {
  const layers: string[][] = [tree.leaves.slice()];
  let current = tree.leaves.slice();
  while (current.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i];
      const b = i + 1 < current.length ? current[i + 1] : current[i];
      next.push(hash(a + b));
    }
    layers.push(next);
    current = next;
  }
  const pathElements: string[] = [];
  const pathIndices: number[] = [];
  let idx = leafIndex;
  for (let l = 0; l < layers.length - 1; l++) {
    const layer = layers[l];
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    pathElements.push(siblingIdx < layer.length ? layer[siblingIdx] : layer[idx]);
    pathIndices.push(isRight ? 1 : 0);
    idx = Math.floor(idx / 2);
  }
  return { pathElements, pathIndices, root: layers[layers.length - 1][0] };
}
