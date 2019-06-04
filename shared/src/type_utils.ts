// tslint:disable-next-line:no-any
export function asMap(value: any): {[key: string]: any} {
  // tslint:disable-next-line:no-any
  return typeof value === 'object' && value !== null ? (value as {[key: string]: any}) : {};
}

// tslint:disable-next-line:no-any
export function asArray<T = any>(value: any): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

// tslint:disable-next-line:no-any
export function asNumber<T>(value: any, defaultValue: T): T | number {
  if (typeof value === 'number') {
    return !isNaN(value) ? value : defaultValue;
  }
  if (typeof value === 'string') {
    try {
      const parsedValue = parseFloat(value);
      return !isNaN(parsedValue) ? parsedValue : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
}

// tslint:disable-next-line:no-any
export function asBoolean(value: any, defaultValue: boolean = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return !isNaN(value) ? value !== 0 : false;
  }
  if (typeof value === 'string') {
    if (value === '0' || value === 'false') {
      return false;
    } else if (value === '1' || value === 'true') {
      return true;
    } else {
      return defaultValue;
    }
  }
  return defaultValue;
}

// tslint:disable-next-line:no-any
export function asString<T>(value: any, defaultValue: T): T | string {
  return typeof value === 'string' ? value : defaultValue;
}

// tslint:disable-next-line:no-any
export function asFunction<T>(value: any, defaultValue: T): T {
  return typeof value === 'function' ? (value as T) : defaultValue;
}

// tslint:disable-next-line:no-any
export function asDate(value: any, defaultValue: Date = new Date(0)): Date {
  if (typeof value === 'number') {
    return new Date(value);
  }
  return value instanceof Date ? value : defaultValue;
}

export function notUndefined<T>(val: T | undefined): val is T {
  return val !== undefined;
}

export function removeUndefined<T>(arr: (T | undefined)[]): T[] {
  return arr.filter(notUndefined);
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
