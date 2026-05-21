import {
  getCoverageTier,
  getEstimatedNeed,
  isUnderfunded,
  type CoverageTierId,
} from './coverageTiers';

/** Illustrative tiers for demos; disable with ENABLE_DEMO_COVERAGE=false in .env.local */
export function isDemoCoverageEnabled(): boolean {
  return process.env.ENABLE_DEMO_COVERAGE !== 'false';
}

/** Region VIII demo targets — one sample per coverage tier across six provinces. */
export const DEMO_COVERAGE_BY_PROVINCE: Record<string, number> = {
  'Eastern Samar': 18,
  Samar: 38,
  'Northern Samar': 62,
  Leyte: 88,
  'Southern Leyte': 115,
  Biliran: 45,
};

export function resourcesForCoverage(incidence: number, coveragePercent: number): number {
  return getEstimatedNeed(incidence) * (coveragePercent / 100);
}

export type ProvinceWithCoverage = {
  name: string;
  incidence: number;
  aid: number;
  budget: number;
  totalResources: number;
  coveragePercent: number;
  tier: ReturnType<typeof getCoverageTier>;
  isUnderfunded: boolean;
  [key: string]: unknown;
};

export function applyDemoCoverageOverrides<T extends ProvinceWithCoverage>(stats: T[]): T[] {
  if (!isDemoCoverageEnabled()) return stats;

  return stats.map((p) => {
    const target = DEMO_COVERAGE_BY_PROVINCE[p.name];
    if (target === undefined) return p;

    const totalResources = resourcesForCoverage(p.incidence, target);
    const aid = Math.round(totalResources * 0.35);
    const budget = totalResources - aid;

    return {
      ...p,
      aid,
      budget,
      totalResources,
      coveragePercent: target,
      tier: getCoverageTier(target),
      isUnderfunded: isUnderfunded(totalResources, p.incidence),
    };
  });
}

export const DEMO_TIER_SAMPLES: Record<CoverageTierId, string> = {
  critical: 'Eastern Samar',
  low: 'Samar',
  moderate: 'Northern Samar',
  good: 'Leyte',
  covered: 'Southern Leyte',
};
