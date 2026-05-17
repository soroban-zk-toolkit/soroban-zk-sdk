export type Proof = {
  a: string;
  b: string;
  c: string;
};

export type PublicInputs = string[];

export type MerkleProof = {
  leaf: string;
  pathElements: string[];
  pathIndices: number[];
  root: string;
};
