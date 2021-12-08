import * as log from 'electron-log';
import {ServerErrorData} from '@shared/models';

let errors: ServerErrorData[] = [];

export function getErrors(): ServerErrorData[] {
  return errors;
}

export function clearErrors(): void {
  errors = [];
}

export function addError(msg: string, details: string): void {
  const time = new Date();
  errors.push({time, msg, details});
  log.error({time, msg, details});
}
