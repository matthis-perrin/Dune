export type BobineHashCombinaison = Map<string, number>;

export function getBobineHashCombinaison(hashes: string[]): BobineHashCombinaison {
  const combi = new Map<string, number>();
  for (const hash of hashes) {
    const count = combi.get(hash) || 0;
    combi.set(hash, count + 1);
  }
  return combi;
}
// Return true if `combi1` is contained in `combi2`
export function combinaisonIsContained(
  combi1: BobineHashCombinaison,
  combi2: BobineHashCombinaison
): boolean {
  for (const [hash, count] of combi1.entries()) {
    if ((combi2.get(hash) || 0) < count) {
      return false;
    }
  }
  return true;
}

export function addCombinaisons(
  combi1: BobineHashCombinaison,
  combi2: BobineHashCombinaison
): BobineHashCombinaison {
  const res = new Map<string, number>();
  for (const [hash, count] of combi1.entries()) {
    res.set(hash, count);
  }
  for (const [hash, count] of combi2.entries()) {
    const newCount = (res.get(hash) || 0) + count;
    res.set(hash, newCount);
  }
  return res;
}

// `combi1` - `combi2`.
// Throws if something goes negative.
export function substractCombinaisons(
  combi1: BobineHashCombinaison,
  combi2: BobineHashCombinaison
): BobineHashCombinaison {
  // Copy combi1
  const res = new Map<string, number>();
  for (const [hash, count] of combi1.entries()) {
    res.set(hash, count);
  }
  // And substract it combi2
  for (const [hash, count] of combi2.entries()) {
    const newCount = (res.get(hash) || 0) - count;
    if (newCount < 0) {
      throw new Error("Can't perform substraction");
    }
    if (newCount === 0) {
      res.delete(hash);
    } else {
      res.set(hash, newCount);
    }
  }
  return res;
}
