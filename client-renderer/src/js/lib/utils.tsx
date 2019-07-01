export function padNumber(value: number, padding: number): string {
  let valueStr = String(value);
  while (valueStr.length < padding) {
    valueStr = `0${valueStr}`;
  }
  return valueStr;
}

export function formatMonthCount(monthCount: number): string {
  if (monthCount < 12) {
    return `${monthCount} mois`;
  }
  const yearCount = Math.floor(monthCount / 12);
  const monthCountWithoutYear = monthCount - yearCount * 12;
  const yearStr = yearCount > 1 ? `${yearCount} ans` : '1 an';
  if (monthCountWithoutYear === 0) {
    return yearStr;
  }
  return `${yearStr} et ${monthCountWithoutYear} mois`;
}

export function numberWithSeparator(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
