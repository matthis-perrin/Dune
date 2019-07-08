import {padNumber} from '@root/lib/utils';

const PLAN_PROD_NUMBER_DIGIT_COUNT = 5;

export function getPlanProdTitle(id: number): string {
  return `PRODUCTION N°${padNumber(id, PLAN_PROD_NUMBER_DIGIT_COUNT)}`;
}
