import { MerkleTree } from '../src/merkle';

test('merkle root with two leaves', () => {
  const tree = new MerkleTree(['a', 'b']);
  const root = tree.getRoot();
  expect(typeof root).toBe('string');
  expect(root.length).toBeGreaterThan(0);
});
