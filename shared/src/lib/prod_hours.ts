import {getWeekDay, dateAtHour} from '@shared/lib/time';
import {startOfDay, endOfDay, capitalize, padNumber} from '@shared/lib/utils';
import {ProdRange, NonProd} from '@shared/models';

function convertProdRangesToNonProd(day: Date, prodRanges: Map<string, ProdRange>): NonProd[] {
  const dayOfWeek = getWeekDay(day);
  const prodRange = prodRanges.get(dayOfWeek);
  if (!prodRange) {
    const start = startOfDay(day).getTime();
    const end = endOfDay(day).getTime();
    return [
      {
        id: -start,
        title: `Pas de production le ${capitalize(dayOfWeek)}`,
        start,
        end,
      },
    ];
  }
  const prodStart = dateAtHour(day, prodRange.startHour, prodRange.startMinute).getTime();
  const prodEnd = dateAtHour(day, prodRange.endHour, prodRange.endMinute).getTime();
  const startHourStr = padNumber(prodRange.startHour, 2);
  const startMinuteStr = padNumber(prodRange.startMinute, 2);
  const endHourStr = padNumber(prodRange.endHour, 2);
  const endMinuteStr = padNumber(prodRange.endMinute, 2);
  return [
    {
      id: -1,
      title: `Production démarre à ${startHourStr}h${startMinuteStr}`,
      start: startOfDay(day).getTime(),
      end: prodStart,
    },
    {
      id: -1,
      title: `Production termine à ${endHourStr}h${endMinuteStr}`,
      start: prodEnd,
      end: endOfDay(day).getTime(),
    },
  ];
}

export function getCurrentNonProd(
  date: Date,
  prodRanges: Map<string, ProdRange>,
  nonProds: NonProd[]
): NonProd | undefined {
  const time = date.getTime();
  const prodRangesNonProd = convertProdRangesToNonProd(date, prodRanges);
  for (const nonProd of nonProds.concat(prodRangesNonProd)) {
    if (nonProd.start <= time && time < nonProd.end) {
      return nonProd;
    }
  }
  return undefined;
}

export function getNextNonProd(
  date: Date,
  prodRanges: Map<string, ProdRange>,
  nonProds: NonProd[]
): NonProd | undefined {
  const prodRangesNonProd = convertProdRangesToNonProd(date, prodRanges);
  return nonProds
    .concat(prodRangesNonProd)
    .filter(nonProd => nonProd.start >= date.getTime())
    .sort((np1, np2) => np1.start - np2.start)[0];
}
