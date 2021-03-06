import {Prod, SpeedTime} from '@shared/models';
import {removeUndefined} from '@shared/type_utils';

export function computeMetrage(duration: number, speed: number): number {
  return (speed * duration) / 1000 / 60;
}

export function getProdMetrage(prod: Prod, allSpeeds: SpeedTime[]): number {
  const end = prod.end === undefined ? Date.now() : prod.end;
  const duration = end - prod.start;
  if (prod.avgSpeed === undefined) {
    const speeds = removeUndefined(
      allSpeeds.filter(s => s.time >= prod.start && s.time < end).map(s => s.speed)
    );
    const average = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    return computeMetrage(duration, average);
  }
  return computeMetrage(duration, prod.avgSpeed);
}
