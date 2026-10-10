import {CURRENCY} from '@/constants/app';

/** 12.5 -> "$12.50" */
export const formatPrice = (value: number): string => `${CURRENCY}${value.toFixed(2)}`;

/** ISO date -> "Oct 10, 2026" (device locale) */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

/** "S, M, L" -> ["S", "M", "L"] */
export const parseList = (value: string): string[] =>
  value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
