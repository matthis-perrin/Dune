import {flatten, keyBy} from 'lodash';

import {
  getBobineFilleClichePose,
  isValidBobineFille,
} from '@root/plan_production/data_extraction/bobine_fille';
import {
  getBobinesMeresPapier,
  getBobinesMeresPolypro,
  isValidPolypro,
  isValidPapier,
} from '@root/plan_production/data_extraction/bobine_mere';
import {getPerfos, isValidPerfo} from '@root/plan_production/data_extraction/perfo';
import {getRefentes, isValidRefente} from '@root/plan_production/data_extraction/refente';
import {filterAll} from '@root/plan_production/master_filter';
import {Selectables, PlanProduction} from '@root/plan_production/models';

import {
  BobineFille,
  BobineMere,
  Cliche,
  Perfo,
  Refente as RefenteModel,
  PlanProductionState,
  BobineFilleWithPose,
} from '@shared/models';
import {removeUndefined} from '@shared/type_utils';

export class PlanProductionEngine {
  private readonly planProduction: PlanProduction;

  // All the elements that can be used in a PlanProduction.
  // Does not account for the constraints given by the current PlanProduction.
  private readonly originalSelectables: Selectables;

  // Original elements used by the engine by keys for fast lookup
  private readonly originalPolyprosByRef: Map<string, BobineMere>;
  private readonly originalPapiersByRef: Map<string, BobineMere>;
  private readonly originalPerfosByRef: Map<string, Perfo>;
  private readonly originalRefentesByRef: Map<string, RefenteModel>;
  private readonly originalBobinesFillesByRef: Map<string, BobineFille>;

  // All the elements that can be added to the current PlanProduction
  // without violating any contraints.
  private selectables: Selectables;

  private calculationTime: number = 0;

  constructor(
    bobinesFilles: BobineFille[],
    bobinesMeres: BobineMere[],
    cliches: Cliche[],
    refentes: RefenteModel[],
    perfos: Perfo[],
    private readonly changeHandler: () => void
  ) {
    this.planProduction = {bobinesFilles: []};
    const clichesByRef = keyBy(cliches, 'ref');
    this.originalSelectables = {
      selectablePolypros: getBobinesMeresPolypro(bobinesMeres),
      selectablePapiers: getBobinesMeresPapier(bobinesMeres),
      selectablePerfos: getPerfos(perfos),
      selectableRefentes: getRefentes(refentes),
      selectableBobinesFilles: flatten(
        bobinesFilles.map(b => getBobineFilleClichePose(b, clichesByRef))
      ),
    };

    this.originalPolyprosByRef = new Map<string, BobineMere>();
    bobinesMeres.forEach(b => isValidPolypro(b) && this.originalPolyprosByRef.set(b.ref, b));
    this.originalPapiersByRef = new Map<string, BobineMere>();
    bobinesMeres.forEach(b => isValidPapier(b) && this.originalPapiersByRef.set(b.ref, b));
    this.originalPerfosByRef = new Map<string, Perfo>();
    perfos.forEach(p => isValidPerfo(p) && this.originalPerfosByRef.set(p.ref, p));
    this.originalRefentesByRef = new Map<string, RefenteModel>();
    refentes.forEach(r => isValidRefente(r) && this.originalRefentesByRef.set(r.ref, r));
    this.originalBobinesFillesByRef = new Map<string, BobineFille>();
    bobinesFilles.forEach(
      b => isValidBobineFille(b) && this.originalBobinesFillesByRef.set(b.ref, b)
    );

    this.selectables = this.computeSelectables();
  }

  public getCalculationTime(): number {
    return this.calculationTime;
  }

  public getPlanProductionState(): PlanProductionState {
    return {
      selectedPerfo: this.getSelectedPerfo(),
      selectedRefente: this.getSelectedRefente(),
      selectedPapier: this.getSelectedPapier(),
      selectedPolypro: this.getSelectedPolypro(),
      selectedBobines: this.getSelectedBobines(),

      selectablePolypros: this.getSelectablePolypros(),
      selectablePapiers: this.getSelectablePapiers(),
      selectablePerfos: this.getSelectablePerfos(),
      selectableRefentes: this.getSelectableRefentes(),
      selectableBobines: this.getSelectableBobines(),
    };
  }

  public setPerfo(perfo?: Perfo): void {
    this.planProduction.perfo = perfo;
    this.recalculate();
  }

  public setRefente(refente?: RefenteModel): void {
    this.planProduction.refente =
      refente && this.selectables.selectableRefentes.filter(r => r.ref === refente.ref)[0];
    this.recalculate();
  }

  public setPapier(papier?: BobineMere): void {
    this.planProduction.papier =
      papier && this.selectables.selectablePapiers.filter(p => p.ref === papier.ref)[0];
    this.recalculate();
  }

  public setPolypro(polypro?: BobineMere): void {
    this.planProduction.polypro =
      polypro && this.selectables.selectablePolypros.filter(p => p.ref === polypro.ref)[0];
    this.recalculate();
  }

  public addBobine(bobine: BobineFilleWithPose): void {
    const firstSelectableBobine = this.selectables.selectableBobinesFilles.filter(
      b => b.ref === bobine.ref && b.pose === bobine.pose
    )[0];
    if (firstSelectableBobine) {
      this.planProduction.bobinesFilles.push(firstSelectableBobine);
    }
    this.recalculate();
  }

  // public removeBobineFille(bobineFille: BobineFilleClichePose): void {
  //   this.planProduction.bobinesFilles = this.planProduction.bobinesFilles.filter(
  //     b => b !== bobineFille
  //   );
  //   this.recalculate();
  // }

  public recalculate(): void {
    this.selectables = this.computeSelectables();
    this.changeHandler();
  }

  private getSelectedPerfo(): Perfo | undefined {
    const {perfo} = this.planProduction;
    return perfo && this.originalPerfosByRef.get(perfo.ref);
  }

  private getSelectedRefente(): RefenteModel | undefined {
    const {refente} = this.planProduction;
    return refente && this.originalRefentesByRef.get(refente.ref);
  }

  private getSelectedPapier(): BobineMere | undefined {
    const {papier} = this.planProduction;
    return papier && this.originalPapiersByRef.get(papier.ref);
  }

  private getSelectedPolypro(): BobineMere | undefined {
    const {polypro} = this.planProduction;
    return polypro && this.originalPolyprosByRef.get(polypro.ref);
  }

  private getSelectedBobines(): BobineFilleWithPose[] {
    return removeUndefined(
      this.planProduction.bobinesFilles.map(b => {
        const bobine = this.originalBobinesFillesByRef.get(b.ref);
        return bobine && {...bobine, pose: b.pose};
      })
    );
  }

  private getSelectablePerfos(): Perfo[] {
    return removeUndefined(
      this.selectables.selectablePerfos.map(p => this.originalPerfosByRef.get(p.ref))
    );
  }

  private getSelectableRefentes(): RefenteModel[] {
    return removeUndefined(
      this.selectables.selectableRefentes.map(r => this.originalRefentesByRef.get(r.ref))
    );
  }

  private getSelectablePapiers(): BobineMere[] {
    return removeUndefined(
      this.selectables.selectablePapiers.map(p => this.originalPapiersByRef.get(p.ref))
    );
  }

  private getSelectablePolypros(): BobineMere[] {
    return removeUndefined(
      this.selectables.selectablePolypros.map(p => this.originalPolyprosByRef.get(p.ref))
    );
  }

  private getSelectableBobines(): BobineFilleWithPose[] {
    return removeUndefined(
      this.selectables.selectableBobinesFilles.map(b => {
        const bobine = this.originalBobinesFillesByRef.get(b.ref);
        return bobine && {...bobine, pose: b.pose};
      })
    );
  }

  private computeSelectables(): Selectables {
    const startTime = Date.now();
    const res = filterAll(this.planProduction, this.originalSelectables);
    const endTime = Date.now();
    this.calculationTime = endTime - startTime;
    return res;
  }
}
