const MONTHS_IN_YEAR = 12;

export function padNumber(value: number, padding: number): string {
  let valueStr = String(value);
  while (valueStr.length < padding) {
    valueStr = `0${valueStr}`;
  }
  return valueStr;
}

export function formatMonthCount(monthCount: number): string {
  if (monthCount < MONTHS_IN_YEAR) {
    return `${monthCount} mois`;
  }
  const yearCount = Math.floor(monthCount / MONTHS_IN_YEAR);
  const monthCountWithoutYear = monthCount - yearCount * MONTHS_IN_YEAR;
  const yearStr = yearCount > 1 ? `${yearCount} ans` : '1 an';
  if (monthCountWithoutYear === 0) {
    return yearStr;
  }
  return `${yearStr} et ${monthCountWithoutYear} mois`;
}

export function numberWithSeparator(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const DayOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
// Monday = 0
export function getDayOfWeek(date: Date): number {
  return DayOfWeek.indexOf(date.toLocaleString('fr-FR', {weekday: 'long'}));
}

export function isWeekDay(date: Date): boolean {
  const dayOfWeek = date.toLocaleString('fr-FR', {weekday: 'long'});
  return dayOfWeek !== 'samedi' && dayOfWeek !== 'dimanche';
}
