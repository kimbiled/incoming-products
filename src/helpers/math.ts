import type { Unit } from '@/types';

export function rowTotal(unit: Unit, qty: number, price?: number): number {
  if (!price) return 0;
  return +(qty * price).toFixed(2);
}
