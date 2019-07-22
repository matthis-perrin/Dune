import {StopType} from '@shared/models';

export const labelForStopType = new Map<StopType, string>([
  [StopType.ChangePlanProd, 'Changement de plan de prodution'],
  [StopType.ReprisePlanProd, 'Reprise de prodution'],
  [StopType.ChangeBobinePapier, 'Changement de bobine papier'],
  [StopType.ChangeBobinePolypro, 'Changement de bobine polypro'],
  [StopType.ChangeBobinePapierAndPolypro, 'Changement de bobine papier et polypro'],
  [StopType.EndOfDayEndProd, 'Fin de journée (fin du plan production)'],
  [StopType.EndOfDayPauseProd, 'Fin de journée (pause du plan production)'],
  [StopType.Unplanned, 'Imprévu'],
  [StopType.Maintenance, 'Maintenance'],
]);
