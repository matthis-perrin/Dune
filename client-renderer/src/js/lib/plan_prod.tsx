import {padNumber} from '@root/lib/utils';

export function computePlanProdRef(ts: number, indexInDay: number): string {
  const date = new Date(ts);
  const fullYearStr = date.getFullYear().toString();
  const lastTwoDigitYear = fullYearStr.slice(2, fullYearStr.length);
  const month = padNumber(date.getMonth() + 1, 2);
  const day = padNumber(date.getDate(), 2);
  const index = indexInDay + 1;
  const planProdRef = `${lastTwoDigitYear}${month}${day}_${index}`;
  return planProdRef;
}
