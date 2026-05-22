import Link from 'next/link';
import { getActivePovertyGrants, getNationalSubsidies, getPoorestProvinces } from '../../../lib/db.js';
import { applyDemoCoverageOverrides } from '../../../lib/demoCoverage';
import { getCoveragePercent, getCoverageTier, isUnderfunded } from '../../../lib/coverageTiers';
import { REGION_VIII_PROVINCES } from '../../../lib/regionViii';
import { normalizeProvinceSlug } from '../../../lib/provinceSlug';
import { isGrantAssociatedWithProvince } from '../../../lib/aidFiltering';

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
  const provinceProjects = grants
    .filter((g: any) => isGrantAssociatedWithProvince(g.provinces, slugProvinceName ?? province.name, g.title, g.description))
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
            <div className="flex items-center gap-2.5">
              <img src="/icon.svg" alt="TrackAid Logo" className="w-7 h-7" />
              <div className="text-xl font-bold tracking-wider text-green-500">TrackAid</div>
            </div>
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
              {province.name} currently faces a poverty incidence of <span className="font-semibold text-white">{province.incidence}%</span>. 
              The province is supported by <span className="font-semibold text-white">₱{(province.totalResources / 1000000).toFixed(1)}M</span> in total resources, 
              comprised of <span className="font-semibold text-white">₱{(province.budget / 1000000).toFixed(1)}M</span> from national DBM subsidies and 
              <span className="font-semibold text-white"> ₱{(province.aid / 1000000).toFixed(1)}M</span> in international aid. 
              This results in a <span className={`font-semibold ${province.tier.textClass}`}>{province.coveragePercent.toFixed(0)}% resource coverage</span>, 
              categorizing the province&apos;s funding status as <span className={`font-bold ${province.tier.textClass}`}>{province.tier.label}</span>. 
              Currently, there are <span className="font-semibold text-white">{provinceProjects.length} active projects</span> tracking resources for this area.
            </p>
          </div>
        </section>
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Active Projects</h2>
          <p className="mb-4 text-sm text-gray-400">Projects mentioning this province or Region VIII from the IATI datastore.</p>

          {provinceProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-[#020617]/40 p-10 text-center">
              <p className="text-sm text-slate-500">No projects specifically tagged for {province.name} or Region VIII were found in the current dataset ({grants.length} total projects scanned).</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {provinceProjects.map((proj: any) => (
                <article key={proj.id} className="group rounded-2xl border border-slate-800 bg-[#020617]/95 p-5 shadow-lg transition-all hover:border-sky-500/50 hover:bg-slate-900/40">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h3 className="text-md font-semibold text-white group-hover:text-sky-400">{proj.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                          {proj.provider}
                        </span>
                        <span>₱{(proj.amount / 1000000).toFixed(1)}M Total Value</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                      IATI ID: {proj.id}
                    </div>
                  </div>
                  <p className="mt-4 border-t border-slate-800 pt-3 text-xs leading-relaxed text-slate-400">
                    <strong className="text-slate-300">Scope:</strong> {proj.provinces.join(', ')}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
