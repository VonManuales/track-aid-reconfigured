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

/** Target coverage % for select provinces (illustrates all five tier colors). */
export const DEMO_COVERAGE_BY_PROVINCE: Record<string, number> = {
  Apayao: 18,
  'Eastern Samar': 38,
  'Maguindanao del Sur': 62,
  'Zamboanga del Norte': 88,
  'Lanao del Sur': 115,
  Sarangani: 22,
  Sulu: 45,
  Basilan: 68,
  'Agusan del Sur': 92,
  'Northern Samar': 108,
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

/** Province names assigned to each tier (for reference / tests). */
export const DEMO_TIER_SAMPLES: Record<CoverageTierId, string> = {
  critical: 'Apayao',
  low: 'Eastern Samar',
  moderate: 'Maguindanao del Sur',
  good: 'Zamboanga del Norte',
  covered: 'Lanao del Sur',
};
