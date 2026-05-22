import Link from 'next/link';
import { getActivePovertyGrants, getNationalSubsidies, getPoorestProvinces } from '../../../lib/db.js';
import { applyDemoCoverageOverrides } from '../../../lib/demoCoverage';
import { getCoveragePercent, getCoverageTier, isUnderfunded } from '../../../lib/coverageTiers';
import { REGION_VIII_PROVINCES } from '../../../lib/regionViii';
import { normalizeProvinceSlug } from '../../../lib/provinceSlug';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateStaticParams() {
  return [
    'Biliran',
    'Eastern Samar',
    'Leyte',
    'Northern Samar',
    'Samar',
    'Southern Leyte',
  ].map((provinceName) => ({
    slug: normalizeProvinceSlug(provinceName),
  }));
}

export default async function ProvinceDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [grants, poorestList, dbmBudget] = await Promise.all([
    getActivePovertyGrants(),
    getPoorestProvinces(),
    getNationalSubsidies(),
  ]);

  const regionViiiList = poorestList.filter((p: any) => REGION_VIII_PROVINCES.includes(p.name));
  const provinceStats = regionViiiList.map((p: any) => {
    const provinceAid = grants
      .filter((g: any) =>
        g.provinces.some((prov: any) => {
          const pName = p.name.toLowerCase();
          const pReg = p.region.toLowerCase();
          const iatiLoc = prov.toLowerCase();

          const regionAliases: Record<string, string[]> = {
            'region viii': ['eastern visayas', 'region 8', 'samar'],
          };

          return (
            iatiLoc.includes(pName) ||
            iatiLoc.includes(pReg) ||
            regionAliases[pReg]?.some((alias) => iatiLoc.includes(alias))
          );
        }),
      )
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
  const slugProvinceName = REGION_VIII_PROVINCES.find(
    (name) => normalizeProvinceSlug(name) === slug,
  );

  const calculatedProvince = slugProvinceName
    ? provinceStatsWithDemo.find((p: any) => p.name === slugProvinceName)
    : undefined;

  const province = calculatedProvince ?? {
    name: slugProvinceName ?? slug,
    incidence:
      poorestList.find((p: any) => normalizeProvinceSlug(p.name) === slug)
        ?.incidence ?? 0,
    aid: 0,
    budget: 0,
    totalResources: 0,
    coveragePercent: 0,
    tier: getCoverageTier(0),
    isUnderfunded: false,
  };

  // Collect active projects that mention this province or Region VIII
  const regionAliases = ['eastern visayas', 'region 8', 'samar'];
  const provinceNameLower = (slugProvinceName ?? province.name).toLowerCase();

  const provinceProjects = grants
    .filter((g: any) =>
      (g.provinces || []).some((prov: any) => {
        const n = String(prov).toLowerCase();
        return n.includes(provinceNameLower) || regionAliases.some((a) => n.includes(a));
      }),
    )
    .map((g: any) => ({
      id: g.id,
      title: g.title || 'Project',
      provider: g.provider || 'Provider',
      amount: g.amount || 0,
      provinces: g.provinces || [],
    }));

  if (!slugProvinceName) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-gray-200 font-sans">
        <main className="max-w-4xl px-4 py-10 mx-auto">
          <section className="rounded-3xl border border-slate-800 bg-[#020617]/95 p-8 shadow-2xl shadow-sky-900/20">
            <h1 className="text-3xl font-bold text-white">Province page not found</h1>
            <p className="mt-4 text-sm text-slate-400">
              We could not resolve a province for <strong>{slug}</strong>.
              Please choose one of the available provinces below.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {provinceStatsWithDemo.map((prov: any) => (
                <Link
                  key={prov.name}
                  href={`/province/${normalizeProvinceSlug(prov.name)}`}
                  className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-500 hover:bg-slate-900"
                >
                  {prov.name}
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-200 font-sans">
      <header className="sticky top-0 z-[1001] border-b border-gray-800 bg-[#020617] px-6 py-4 shadow-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-bold tracking-wider text-green-500">TrackAid</div>
            <div className="text-sm text-gray-400">Province details for {province.name}</div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-sky-500/70 bg-slate-900 px-3 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-600/15"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl px-4 py-8 mx-auto">
        <section className="rounded-3xl border border-slate-800 bg-[#020617]/95 p-6 shadow-2xl shadow-sky-900/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{province.name}</h1>
              <p className="mt-2 text-sm text-gray-400">Detailed funding and coverage metrics for Eastern Visayas LGUs.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${province.tier.textClass} ${province.tier.badgeClass}`}>
              {province.tier.label}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Poverty Incidence</p>
              <p className="mt-2 text-3xl font-semibold text-white">{province.incidence}%</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Resource Coverage</p>
              <p className="mt-2 text-3xl font-semibold text-white">{province.coveragePercent.toFixed(0)}%</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">DBM Subsidy</p>
              <p className="mt-2 text-3xl font-semibold text-white">₱{(province.budget / 1000000).toFixed(1)}M</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">International Aid</p>
              <p className="mt-2 text-3xl font-semibold text-white">₱{(province.aid / 1000000).toFixed(1)}M</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Summary</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              This page shows the current estimated poverty incidence, total estimated resources, and local funding coverage for the selected province. The values have been aligned with the Region VIII dashboard data and include illustrative coverage adjustments for demonstration purposes.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-[#020617]/80 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Coverage Tier</p>
                <p className="mt-2 text-lg font-semibold text-white">{province.tier.label}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#020617]/80 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Funding Gap</p>
                <p className="mt-2 text-lg font-semibold text-white">{province.isUnderfunded ? 'Underfunded' : 'On track'}</p>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Active Projects</h2>
          <p className="mb-4 text-sm text-gray-400">Projects mentioning this province or Region VIII from the IATI datastore.</p>

          {provinceProjects.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-[#020617]/80 p-6 text-sm text-slate-400">No active projects found for this province.</div>
          ) : (
            <div className="grid gap-4">
              {provinceProjects.map((proj: any) => (
                <article key={proj.id} className="rounded-2xl border border-slate-800 bg-[#020617]/95 p-4 shadow-lg">
                  <h3 className="text-md font-semibold text-white">{proj.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span>{proj.provider}</span>
                    <span>·</span>
                    <span>₱{(proj.amount / 1000000).toFixed(1)}M</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">Provinces: {proj.provinces.join(', ')}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
