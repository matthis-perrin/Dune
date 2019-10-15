import {Colors, Palette} from '@root/theme';
import {StopType} from '@shared/models';

const labelForStopType = new Map<StopType, string>([
  [StopType.ChangePlanProd, 'Changement de plan de production'],
  [StopType.ReglagesAdditionel, 'Reprise de réglages'],
  [StopType.ReprisePlanProd, 'Reprise de production'],
  [StopType.ChangeBobinePapier, 'Changement de bobine papier'],
  [StopType.ChangeBobinePolypro, 'Changement de bobine polypro'],
  [StopType.ChangeBobinePapierAndPolypro, 'Changement de bobine papier et polypro'],
  [StopType.EndOfDayEndProd, 'Fin de journée (fin du plan production)'],
  [StopType.EndOfDayPauseProd, 'Fin de journée (pause du plan production)'],
  [StopType.Unplanned, 'Imprévu'],
]);

const labelForUnknownStopType = '???';
const labelForUndefinedStopType = 'Arrêt non renseigné';

export function getLabelForStopType(
  stopType: StopType | undefined,
  defaultLabel: string = labelForUnknownStopType
): string {
  if (stopType === undefined) {
    return labelForUndefinedStopType;
  }
  const label = labelForStopType.get(stopType);
  return label || defaultLabel;
}

const colorForStopType = new Map<StopType, string>([
  [StopType.ChangePlanProd, Palette.Carrot],
  [StopType.ReglagesAdditionel, Palette.Carrot],
  [StopType.ReprisePlanProd, Palette.Carrot],
  [StopType.ChangeBobinePapier, Palette.PeterRiver],
  [StopType.ChangeBobinePolypro, Palette.PeterRiver],
  [StopType.ChangeBobinePapierAndPolypro, Palette.PeterRiver],
  [StopType.EndOfDayEndProd, Palette.Amethyst],
  [StopType.EndOfDayPauseProd, Palette.Amethyst],
  [StopType.Unplanned, Colors.Danger],
  [StopType.Maintenance, Palette.Asbestos],
]);

const colorForUnknownStopType = Palette.Silver;

export function getColorForStopType(stopType: StopType | undefined): string {
  const color = stopType ? colorForStopType.get(stopType) : undefined;
  return color || colorForUnknownStopType;
}
