import {flatten, omit} from 'lodash';

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
import {
  getRefentes,
  isValidRefente,
  getRefenteAlgo,
} from '@root/plan_production/data_extraction/refente';
import {filterAll} from '@root/plan_production/master_filter';
import {Selectables, PlanProduction, BobineFilleClichePose} from '@root/plan_production/models';

import {MAX_COULEURS_IMPRESSIONS} from '@shared/constants';
import {getPosesForCliches} from '@shared/lib/cliches';
import {generateAllAcceptableColorsOrder, EncrierColor} from '@shared/lib/encrier';
import {
  BobineFille,
  BobineMere,
  Cliche,
  Perfo,
  Refente as RefenteModel,
  PlanProductionState,
  BobineFilleWithPose,
  BobineFilleWithMultiPose,
  PlanProductionInfo,
  PlanProduction as PlanProductionModel,
} from '@shared/models';
import {removeUndefined} from '@shared/type_utils';

export class PlanProductionEngine {
  private readonly planProduction: PlanProduction;
  private tourCount: number | undefined;

  // All the elements that can be used in a PlanProduction.
  // Does not account for the constraints given by the current PlanProduction.
  private readonly originalSelectables: Selectables;

  // Original elements used by the engine by keys for fast lookup
  private readonly originalPolyprosByRef: Map<string, BobineMere>;
  private readonly originalPapiersByRef: Map<string, BobineMere>;
  private readonly originalPerfosByRef: Map<string, Perfo>;
  private readonly originalRefentesByRef: Map<string, RefenteModel>;
  private readonly originalBobinesFillesByRef: Map<string, BobineFille>;

  // More useful info for faster lookup
  private readonly allClicheByRef: Map<string, Cliche>;
  private readonly allBobinesFillesPosesByRef: Map<string, number[]>;

  // All the elements that can be added to the current PlanProduction
  // without violating any contraints.
  private selectables: Selectables;

  private isComputing: boolean = false;
  private calculationTime: number = 0;

  constructor(
    private readonly info: PlanProductionInfo,
    private readonly previousPlanProd: PlanProductionModel | undefined,
    bobinesFilles: BobineFille[],
    bobinesMeres: BobineMere[],
    cliches: Cliche[],
    refentes: RefenteModel[],
    perfos: Perfo[],
    private readonly changeHandler: () => void
  ) {
    this.planProduction = {
      bobinesFilles: [],
      refente: previousPlanProd && getRefenteAlgo(previousPlanProd.data.refente),
      perfo: previousPlanProd && previousPlanProd.data.perfo,
    };
    this.allClicheByRef = new Map<string, Cliche>();
    cliches.forEach(c => this.allClicheByRef.set(c.ref, c));

    this.originalSelectables = {
      selectablePolypros: getBobinesMeresPolypro(bobinesMeres),
      selectablePapiers: getBobinesMeresPapier(bobinesMeres),
      selectablePerfos: getPerfos(perfos),
      selectableRefentes: getRefentes(refentes),
      selectableBobinesFilles: flatten(
        bobinesFilles.map(b => getBobineFilleClichePose(b, this.allClicheByRef))
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

    this.allBobinesFillesPosesByRef = new Map<string, number[]>();
    for (const bobineFille of this.originalBobinesFillesByRef.values()) {
      const cliche1 =
        bobineFille.refCliche1 === undefined
          ? undefined
          : this.allClicheByRef.get(bobineFille.refCliche1);
      const cliche2 =
        bobineFille.refCliche2 === undefined
          ? undefined
          : this.allClicheByRef.get(bobineFille.refCliche2);
      const poses = getPosesForCliches(cliche1, cliche2);
      this.allBobinesFillesPosesByRef.set(bobineFille.ref, poses);
    }

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

      couleursEncrier: this.getValidCouleursEncriers(),
      tourCount: this.tourCount,
      calculationTime: this.calculationTime,
    };
  }

  public getPlanProductionInfo(): PlanProductionInfo {
    return this.info;
  }

  private getByRef<T extends {ref: string}>(all: T[], ref?: string): T | undefined {
    if (ref === undefined) {
      return undefined;
    }
    return all.filter(item => item.ref === ref)[0];
  }

  public setTourCount(tourCount?: number): void {
    this.tourCount = tourCount;
    this.changeHandler();
  }

  public setPerfo(ref?: string): void {
    if (this.isComputing) {
      return;
    }
    this.planProduction.perfo = this.getByRef(this.selectables.selectablePerfos, ref);
    if (this.planProduction.perfo) {
      this.recalculate(false);
      this.autoComplete();
      this.changeHandler();
    } else {
      this.recalculate();
    }
  }

  public setRefente(ref?: string): void {
    if (this.isComputing) {
      return;
    }
    this.planProduction.refente = this.getByRef(this.selectables.selectableRefentes, ref);
    if (this.planProduction.refente) {
      this.recalculate(false);
      this.autoComplete();
      this.changeHandler();
    } else {
      this.recalculate();
    }
  }

  public setPapier(ref?: string): void {
    if (this.isComputing) {
      return;
    }
    this.planProduction.papier = this.getByRef(this.selectables.selectablePapiers, ref);
    if (this.planProduction.papier) {
      this.recalculate(false);
      this.autoComplete();
      this.changeHandler();
    } else {
      this.recalculate();
    }
  }

  public setPolypro(ref?: string): void {
    if (this.isComputing) {
      return;
    }
    this.planProduction.polypro = this.getByRef(this.selectables.selectablePolypros, ref);
    if (this.planProduction.polypro) {
      this.recalculate(false);
      this.autoComplete();
      this.changeHandler();
    } else {
      this.recalculate();
    }
  }

  public addBobine(ref: string, pose: number): void {
    if (this.isComputing) {
      return;
    }
    const firstSelectableBobine = this.selectables.selectableBobinesFilles.filter(
      b => b.ref === ref && b.pose === pose
    )[0];
    if (firstSelectableBobine) {
      this.planProduction.bobinesFilles.push(firstSelectableBobine);
    }
    this.recalculate(false);
    this.autoComplete();
    this.changeHandler();
  }

  public removeBobine(ref: string, pose?: number): void {
    if (this.isComputing) {
      return;
    }
    if (pose) {
      const matchingBobines = this.planProduction.bobinesFilles.filter(
        b => b.ref === ref && b.pose === pose
      );
      if (matchingBobines.length > 0) {
        const toRemove = matchingBobines[matchingBobines.length - 1];
        const index = this.planProduction.bobinesFilles.indexOf(toRemove);
        this.planProduction.bobinesFilles.splice(index, 1);
        this.recalculate();
      }
    } else {
      this.planProduction.bobinesFilles = this.planProduction.bobinesFilles.filter(
        b => b.ref !== ref
      );
      this.recalculate();
    }
  }

  public clearPlan(): void {
    if (this.isComputing) {
      return;
    }
    this.planProduction.bobinesFilles = [];
    this.planProduction.papier = undefined;
    this.planProduction.perfo = undefined;
    this.planProduction.polypro = undefined;
    this.planProduction.refente = undefined;
    this.recalculate();
  }

  public autoComplete(): void {
    if (this.isComputing) {
      return;
    }
    let hasChanged = false;
    if (this.selectables.selectablePolypros.length === 1) {
      hasChanged = true;
      this.planProduction.polypro = this.selectables.selectablePolypros[0];
    }
    if (this.selectables.selectablePapiers.length === 1) {
      hasChanged = true;
      this.planProduction.papier = this.selectables.selectablePapiers[0];
    }
    if (this.selectables.selectablePerfos.length === 1) {
      hasChanged = true;
      this.planProduction.perfo = this.selectables.selectablePerfos[0];
    }
    if (this.selectables.selectableRefentes.length === 1) {
      hasChanged = true;
      this.planProduction.refente = this.selectables.selectableRefentes[0];
    }
    if (hasChanged) {
      this.recalculate(false);
    }
  }

  public recalculate(notifyChangeHandler: boolean = true): void {
    this.selectables = this.computeSelectables();
    if (notifyChangeHandler) {
      this.changeHandler();
    }
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
        return (
          bobine && {
            ...bobine,
            pose: b.pose,
            colors: b.couleursImpression,
          }
        );
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

  private getSelectableBobines(): BobineFilleWithMultiPose[] {
    const selectableBobinesByRef = new Map<string, BobineFilleClichePose[]>();
    this.selectables.selectableBobinesFilles.forEach(bobineCliche => {
      const current = selectableBobinesByRef.get(bobineCliche.ref);
      if (!current) {
        selectableBobinesByRef.set(bobineCliche.ref, [bobineCliche]);
      } else {
        current.push(bobineCliche);
      }
    });

    const bobinesMultiPose: BobineFilleWithMultiPose[] = [];
    for (const bobinesCliche of selectableBobinesByRef.values()) {
      const {ref} = bobinesCliche[0];
      const availablePoses = bobinesCliche.map(bc => bc.pose);
      const allPoses = this.allBobinesFillesPosesByRef.get(ref) || [];
      const bobineMultiPose = omit(bobinesCliche[0], ['pose', 'couleursImpression']);
      const originalBobine = this.originalBobinesFillesByRef.get(ref);
      if (originalBobine) {
        bobinesMultiPose.push({
          ...bobineMultiPose,
          ...originalBobine,
          availablePoses,
          allPoses,
          colors: bobinesCliche[0].couleursImpression,
        });
      }
    }

    return bobinesMultiPose;
  }

  private getValidCouleursEncriers(): EncrierColor[][] {
    return generateAllAcceptableColorsOrder(
      this.planProduction.bobinesFilles.map(b => b.couleursImpression),
      MAX_COULEURS_IMPRESSIONS,
      this.previousPlanProd && this.previousPlanProd.data.encriers
    );
  }

  private computeSelectables(): Selectables {
    this.isComputing = true;
    const startTime = Date.now();
    const res = filterAll(this.planProduction, this.originalSelectables, this.allClicheByRef);
    const endTime = Date.now();
    this.calculationTime = endTime - startTime;
    this.isComputing = false;
    return res;
  }
}
