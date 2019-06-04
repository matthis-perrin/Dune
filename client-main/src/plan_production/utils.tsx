export function permutations<T>(arr: T[]): T[][] {
  const res: T[][] = [];
  arr.forEach((element: T, index: number) => {
    const subPermutations = permutations(arr.filter((_, i) => i !== index));
    if (subPermutations.length === 0) {
      res.push([element]);
    } else {
      subPermutations.forEach(subPermutation => res.push([element].concat(subPermutation)));
    }
  });
  return res;
}
