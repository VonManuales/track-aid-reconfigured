import Link from 'next/link';
import { getActivePovertyGrants, getPoorestProvinces, getNationalSubsidies } from '../../lib/db.js';
import { applyDemoCoverageOverrides } from '../../lib/demoCoverage';
import { getCoveragePercent, getCoverageTier, isUnderfunded } from '../../lib/coverageTiers';
import { REGION_VIII_PROVINCES } from '../../lib/regionViii';
import { normalizeProvinceSlug } from '../../lib/provinceSlug';
import { isGrantAssociatedWithProvince } from '../../lib/aidFiltering';

export default async function ProvinceIndexPage() {
  const [grants, poorestList, dbmBudget] = await Promise.all([
    getActivePovertyGrants(),
    getPoorestProvinces(),
    getNationalSubsidies(),
  ]);

  const regionViiiList = poorestList.filter((p: any) => REGION_VIII_PROVINCES.includes(p.name));
  const provinceStats = regionViiiList.map((p: any) => {
    const provinceAid = grants
      .filter((g: any) => isGrantAssociatedWithProvince(g.provinces, p.name, g.title, g.description))
      .reduce((sum: number, g: any) => sum + g.amount, 0);

    const nationalBudget = dbmBudget[p.name] || p.incidence * 42000000;
    const totalResources = provinceAid + nationalBudget;
    const coveragePercent = getCoveragePercent(totalResources, p.incidence);
    const tier = getCoverageTier(coveragePercent);
    const underfunded = isUnderfunded(totalResources, p.incidence);

    return {
      ...p,
      aid: provinceAid,
      budget: nationalBudget,
      totalResources,
      coveragePercent,
      tier,
      isUnderfunded: underfunded,
    };
  });

  const provinceStatsWithDemo = applyDemoCoverageOverrides(provinceStats);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-200 font-sans">
      <main className="max-w-6xl px-4 py-10 mx-auto">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-[#020617]/95 p-6 shadow-2xl shadow-sky-900/20">
          <h1 className="text-3xl font-bold text-white">Province Detail Pages</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Browse Eastern Visayas provinces and open a dedicated page for each one. These pages include funding coverage, international aid, and subsidy details.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center rounded-md border border-sky-500/70 bg-slate-900 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-600/10">
              Back to dashboard
            </Link>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {provinceStatsWithDemo.map((province: any) => (
            <article key={province.name} className="rounded-3xl border border-slate-800 bg-[#020617]/95 p-5 shadow-xl shadow-slate-950/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{province.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{province.region}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${province.tier.textClass} ${province.tier.badgeClass}`}>
                  {province.tier.shortLabel}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Poverty incidence: {province.incidence}%</p>
                <p>Coverage: {province.coveragePercent.toFixed(0)}%</p>
                <p>DBM subsidy: ₱{(province.budget / 1000000).toFixed(1)}M</p>
                <p>IATI aid: ₱{(province.aid / 1000000).toFixed(1)}M</p>
              </div>

              <Link
                href={`/province/${normalizeProvinceSlug(province.name)}`}
                className="mt-5 inline-flex items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
              >
                View province details
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
