import {Refente, BobineFilleClichePose} from '@root/lib/plan_production/model';

// Checking for compatibility is very expensive. So we want to cache every valid combinaison we have found,
// and skip as often as possible the compatibility.

// Some types, mostly here for documentation purposes.
type RefenteRef = string;
type BobineHash = string;
type SelectedBobineSortedHashes = BobineHash;
type NumberOfBobineUsed = number;
export type BobineHashCombinaison = Map<BobineHash, NumberOfBobineUsed>;

// Defines a collection of compatibilities.
// For lookup performances, we store them twice in different data structures.
// The reasonning is that most of the time if we have already found a valid combinaison,
// we were starting from the same initial selected bobines filles. So we maintain a map
// between the selected bobines sorted hashes and the other bobines that forms valid combinaisons.
// This allows for a fast lookup of possible combinaisons that are likely to work.
// If no combinaison worked, we still want to check against all the valid combinaisons we ever found so
// we also keep a flat list of them.
interface Compatibilities {
  // Map between selected bobines and selectable bobines that forms a valid combinaison
  compatibilityBySelected: Map<SelectedBobineSortedHashes, BobineHashCombinaison[]>;
  allCompatibilities: BobineHashCombinaison[];
}

// The actual compatibility cache class
class CompatibilityCache {
  private readonly compatibilitiesByRefente = new Map<RefenteRef, Compatibilities>();

  public addCompatibility(
    refente: Refente,
    selectedBobines: BobineFilleClichePose[],
    validCombinaisonBobines: BobineFilleClichePose[]
  ): BobineHashCombinaison {
    // Generate the compatibility data structures
    const selectedBobinesHashes = selectedBobines.map(b => b.hash);
    const validCombinaisonHashes = validCombinaisonBobines.map(b => b.hash);

    const selectedBobinesSortedHash = selectedBobinesHashes.sort().join('/');
    const compatibility = this.getBobineHashCombinaison(validCombinaisonHashes);
    const selectableCompatibility = this.substractCombinaisons(
      compatibility,
      this.getBobineHashCombinaison(selectedBobinesHashes)
    );

    // Get the compatibilities (or create a brand new) for the refente
    if (!this.compatibilitiesByRefente.has(refente.ref)) {
      this.compatibilitiesByRefente.set(refente.ref, {
        compatibilityBySelected: new Map<SelectedBobineSortedHashes, BobineHashCombinaison[]>(),
        allCompatibilities: [],
      });
    }
    const compatibilitiesForRefente = this.compatibilitiesByRefente.get(refente.ref);

    if (compatibilitiesForRefente) {
      // Add the compatibility to the `compatibilityBySelected` index
      if (!compatibilitiesForRefente.compatibilityBySelected.has(selectedBobinesSortedHash)) {
        compatibilitiesForRefente.compatibilityBySelected.set(selectedBobinesSortedHash, []);
      }
      const selectableCompatibilities = compatibilitiesForRefente.compatibilityBySelected.get(
        selectedBobinesSortedHash
      );
      if (selectableCompatibilities) {
        selectableCompatibilities.push(selectableCompatibility);
      }

      // Also add the compatibility to the `allCompatibilities` array
      compatibilitiesForRefente.allCompatibilities.push(compatibility);
    }

    return compatibility;
  }

  public compatibilityInCache(
    refente: Refente,
    selectedBobines: BobineFilleClichePose[],
    selectableBobines: BobineFilleClichePose[]
  ): BobineHashCombinaison | undefined {
    const compatibilitiesForRefente = this.compatibilitiesByRefente.get(refente.ref);
    if (!compatibilitiesForRefente) {
      return undefined;
    }
    const selectedBobinesHashes = selectedBobines.map(b => b.hash);
    const selectedBobinesSortedHash = selectedBobinesHashes.sort().join('/');
    const selectedCombinaison = this.getBobineHashCombinaison(selectedBobinesHashes);
    const compatibilities = compatibilitiesForRefente.compatibilityBySelected.get(
      selectedBobinesSortedHash
    );
    const selectableHashCombinaisons = this.getBobineHashCombinaison(
      selectableBobines.map(b => b.hash)
    );
    if (compatibilities) {
      for (const compatibility of compatibilities) {
        if (this.combinaisonIsContained(compatibility, selectableHashCombinaisons)) {
          return this.addCombinaisons(compatibility, selectedCombinaison);
        }
      }
    }
    for (const compatibility of compatibilitiesForRefente.allCompatibilities) {
      if (this.combinaisonIsContained(selectedCombinaison, compatibility)) {
        const combiWithoutSelected = this.substractCombinaisons(compatibility, selectedCombinaison);
        if (this.combinaisonIsContained(combiWithoutSelected, selectableHashCombinaisons)) {
          return compatibility;
        }
      }
    }
    return undefined;
  }

  private getBobineHashCombinaison(hashes: string[]): BobineHashCombinaison {
    const combi = new Map<string, number>();
    for (const hash of hashes) {
      const count = combi.get(hash) || 0;
      combi.set(hash, count + 1);
    }
    return combi;
  }

  // Return true if `combi1` is contained in `combi2`
  private combinaisonIsContained(
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

  private addCombinaisons(
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
  private substractCombinaisons(
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
        console.log(combi1, combi2);
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
}

export const compatibilityCache = new CompatibilityCache();
