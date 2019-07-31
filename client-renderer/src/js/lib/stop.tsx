import {Colors, Palette} from '@root/theme';
import {StopType} from '@shared/models';

export const labelForStopType = new Map<StopType, string>([
  [StopType.ChangePlanProd, 'Changement de plan de production'],
  [StopType.ReprisePlanProd, 'Reprise de prodution'],
  [StopType.ChangeBobinePapier, 'Changement de bobine papier'],
  [StopType.ChangeBobinePolypro, 'Changement de bobine polypro'],
  [StopType.ChangeBobinePapierAndPolypro, 'Changement de bobine papier et polypro'],
  [StopType.EndOfDayEndProd, 'Fin de journée (fin du plan production)'],
  [StopType.EndOfDayPauseProd, 'Fin de journée (pause du plan production)'],
  [StopType.Unplanned, 'Imprévu'],
  [StopType.Maintenance, 'Maintenance'],
]);

const colorForStopType = new Map<StopType, string>([
  [StopType.ChangePlanProd, Palette.PeterRiver],
  [StopType.ReprisePlanProd, Palette.PeterRiver],
  [StopType.ChangeBobinePapier, Palette.PeterRiver],
  [StopType.ChangeBobinePolypro, Palette.PeterRiver],
  [StopType.ChangeBobinePapierAndPolypro, Palette.PeterRiver],
  [StopType.EndOfDayEndProd, Palette.PeterRiver],
  [StopType.EndOfDayPauseProd, Palette.PeterRiver],
  [StopType.Unplanned, Colors.Danger],
  [StopType.Maintenance, Palette.Asbestos],
]);

const colorForUnknownStopType = Palette.Silver;

export function getColorForStopType(stopType: StopType | undefined): string {
  const color = stopType ? colorForStopType.get(stopType) : undefined;
  return color || colorForUnknownStopType;
}
