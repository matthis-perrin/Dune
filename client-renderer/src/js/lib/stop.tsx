import {Colors, Palette} from '@root/theme';
import {StopType} from '@shared/models';

const labelForStopType = new Map<StopType, string>([
  [StopType.ChangePlanProd, 'Changement de plan de production'],
  [StopType.ReglagesAdditionel, 'Reprise de réglages'],
  [StopType.ReprisePlanProd, 'Reprise de prodution'],
  [StopType.ChangeBobinePapier, 'Changement de bobine papier'],
  [StopType.ChangeBobinePolypro, 'Changement de bobine polypro'],
  [StopType.ChangeBobinePapierAndPolypro, 'Changement de bobine papier et polypro'],
  [StopType.EndOfDayEndProd, 'Fin de journée (fin du plan production)'],
  [StopType.EndOfDayPauseProd, 'Fin de journée (pause du plan production)'],
  [StopType.Unplanned, 'Imprévu'],
  [StopType.Maintenance, 'Maintenance'],
  [StopType.OperationPinned, 'Réglage du prochain plan obligatoire en début de journée'],
  [StopType.ProductionPinned, 'Production du prochain plan obligatoire en début de journée'],
]);

const labelForUnknownStopType = '???';
const labelForUndefinedStopType = 'Arrêt non renseigné';

export function getLabelForStopType(stopType: StopType | undefined, defaultLabel?: string): string {
  if (stopType === undefined) {
    return labelForUndefinedStopType;
  }
  if (stopType === StopType.NotProdHours) {
    return defaultLabel || '';
  }
  const label = labelForStopType.get(stopType);
  return label || labelForUnknownStopType;
}

const colorForStopType = new Map<StopType, string>([
  [StopType.ChangePlanProd, Palette.PeterRiver],
  [StopType.ReglagesAdditionel, Palette.PeterRiver],
  [StopType.ReprisePlanProd, Palette.PeterRiver],
  [StopType.ChangeBobinePapier, Palette.PeterRiver],
  [StopType.ChangeBobinePolypro, Palette.PeterRiver],
  [StopType.ChangeBobinePapierAndPolypro, Palette.PeterRiver],
  [StopType.EndOfDayEndProd, Palette.PeterRiver],
  [StopType.EndOfDayPauseProd, Palette.PeterRiver],
  [StopType.Unplanned, Colors.Danger],
  [StopType.Maintenance, Palette.Asbestos],
  [StopType.OperationPinned, Palette.Asbestos],
  [StopType.ProductionPinned, Palette.Asbestos],
]);

const colorForUnknownStopType = Palette.Silver;

export function getColorForStopType(stopType: StopType | undefined): string {
  const color = stopType ? colorForStopType.get(stopType) : undefined;
  return color || colorForUnknownStopType;
}
