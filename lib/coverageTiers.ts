/** Estimated PHP need per 1% poverty incidence (used across dashboard). */
export const FUNDING_NEED_PER_INCIDENCE_POINT = 50_000_000;

export type CoverageTierId = 'critical' | 'low' | 'moderate' | 'good' | 'covered';

export interface CoverageTier {
  id: CoverageTierId;
  label: string;
  shortLabel: string;
  rangeLabel: string;
  minPercent: number;
  maxPercent: number;
  hex: string;
  textClass: string;
  borderClass: string;
  barClass: string;
  badgeClass: string;
}

export const COVERAGE_TIERS: CoverageTier[] = [
  {
    id: 'critical',
    label: 'Critical funding gap',
    shortLabel: 'Critical',
    rangeLabel: '0–24%',
    minPercent: 0,
    maxPercent: 24.99,
    hex: '#dc2626',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/40',
    barClass: 'bg-red-500',
    badgeClass: 'text-red-300 bg-red-900/30',
  },
  {
    id: 'low',
    label: 'Low coverage',
    shortLabel: 'Low',
    rangeLabel: '25–49%',
    minPercent: 25,
    maxPercent: 49.99,
    hex: '#f97316',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/40',
    barClass: 'bg-orange-500',
    badgeClass: 'text-orange-300 bg-orange-900/30',
  },
  {
    id: 'moderate',
    label: 'Moderate coverage',
    shortLabel: 'Moderate',
    rangeLabel: '50–74%',
    minPercent: 50,
    maxPercent: 74.99,
    hex: '#eab308',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/40',
    barClass: 'bg-yellow-500',
    badgeClass: 'text-yellow-200 bg-yellow-900/30',
  },
  {
    id: 'good',
    label: 'Good coverage',
    shortLabel: 'Good',
    rangeLabel: '75–99%',
    minPercent: 75,
    maxPercent: 99.99,
    hex: '#22d3ee',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/40',
    barClass: 'bg-cyan-500',
    badgeClass: 'text-cyan-300 bg-cyan-900/30',
  },
  {
    id: 'covered',
    label: 'Fully covered',
    shortLabel: 'Covered',
    rangeLabel: '100%+',
    minPercent: 100,
    maxPercent: Infinity,
    hex: '#10b981',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
    barClass: 'bg-emerald-500',
    badgeClass: 'text-emerald-300 bg-emerald-900/30',
  },
];

export function getEstimatedNeed(incidence: number): number {
  return incidence * FUNDING_NEED_PER_INCIDENCE_POINT;
}

export function getCoveragePercent(totalResources: number, incidence: number): number {
  const need = getEstimatedNeed(incidence);
  if (need <= 0) return 0;
  return (totalResources / need) * 100;
}

export function getCoverageTier(coveragePercent: number): CoverageTier {
  for (const tier of COVERAGE_TIERS) {
    if (coveragePercent >= tier.minPercent && coveragePercent <= tier.maxPercent) {
      return tier;
    }
  }
  return COVERAGE_TIERS[COVERAGE_TIERS.length - 1];
}

export function isUnderfunded(totalResources: number, incidence: number): boolean {
  return getCoveragePercent(totalResources, incidence) < 100;
}
