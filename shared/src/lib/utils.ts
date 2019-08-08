export function permutations<T>(arr: T[]): T[][] {
  const res: T[][] = [];
  arr.forEach((element: T, index: number) => {
    const subPermutations = permutations(arr.filter((_, i) => i !== index));
    if (subPermutations.length === 0) {
      res.push([element]);
    } else {
      subPermutations.forEach(subPermutation => res.push([element].concat(subPermutation)));
    }
  });
  return res;
}

export function capitalize(value: string): string {
  if (value.length === 0) {
    return '';
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function startOfDay(date?: Date): Date {
  const d = date ? new Date(date.getTime()) : new Date();
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

const END_OF_DAY_HOUR = 24;

export function endOfDay(date?: Date): Date {
  const d = date ? new Date(date.getTime()) : new Date();
  d.setHours(END_OF_DAY_HOUR);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

export function padNumber(value: number, padding: number): string {
  let valueStr = String(value);
  while (valueStr.length < padding) {
    valueStr = `0${valueStr}`;
  }
  return valueStr;
}
