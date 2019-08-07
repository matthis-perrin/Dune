import {ProdRange, NonProd} from '@shared/models';
import {getWeekDay, dateAtHour} from '@shared/lib/time';
import {startOfDay, endOfDay, capitalize, padNumber} from '@shared/lib/utils';

export function getNonProd(
  date: Date,
  prodRanges: Map<string, ProdRange>,
  nonProds: NonProd[]
): NonProd | undefined {
  const time = date.getTime();
  for (let nonProd of nonProds) {
    if (nonProd.start <= time && time < nonProd.end) {
      return nonProd;
    }
  }
  const dayOfWeek = getWeekDay(date);
  const prodRange = prodRanges.get(dayOfWeek);
  if (!prodRange) {
    return {
      id: -1,
      title: `Pas de production le ${capitalize(dayOfWeek)}`,
      start: startOfDay(date).getTime(),
      end: endOfDay(date).getTime(),
    };
  }
  const prodStart = dateAtHour(date, prodRange.startHour, prodRange.startMinute).getTime();
  const prodEnd = dateAtHour(date, prodRange.endHour, prodRange.endMinute).getTime();
  if (time < prodStart) {
    const h = padNumber(prodRange.startHour, 2);
    const m = padNumber(prodRange.startMinute, 2);
    return {
      id: -1,
      title: `Production démarre à ${h}h${m}`,
      start: startOfDay(date).getTime(),
      end: prodStart,
    };
  }
  if (time >= prodEnd) {
    const h = padNumber(prodRange.endHour, 2);
    const m = padNumber(prodRange.endMinute, 2);
    return {
      id: -1,
      title: `Production termine à ${h}h${m}`,
      start: prodEnd,
      end: endOfDay(date).getTime(),
    };
  }
}
