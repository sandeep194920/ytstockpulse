import type { Momentum } from './types';

export function calcMomentum(last7Count: number, prev7Count: number): Momentum {
  if (last7Count > prev7Count + 1) return 'heating';
  if (last7Count === 0 && prev7Count > 0) return 'cooling';
  if (last7Count < prev7Count && prev7Count > 0) return 'cooling';
  return 'steady';
}
