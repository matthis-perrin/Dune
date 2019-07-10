import {PlanProductionInfo} from '@shared/models';

export function compareTime(plan1: PlanProductionInfo, plan2: PlanProductionInfo): number {
  if (plan1.year < plan2.year) {
    return -1;
  }
  if (plan1.year > plan2.year) {
    return 1;
  }
  if (plan1.month < plan2.month) {
    return -1;
  }
  if (plan1.month > plan2.month) {
    return 1;
  }
  if (plan1.day < plan2.day) {
    return -1;
  }
  if (plan1.day > plan2.day) {
    return 1;
  }
  return plan1.indexInDay - plan2.indexInDay;
}
