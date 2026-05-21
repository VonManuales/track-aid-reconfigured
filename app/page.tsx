// import Image from "next/image";
import { getActivePovertyGrants, getPoorestProvinces, getNationalSubsidies } from "../lib/db.js";
import PredictabilityMapWrapper from "../lib/PredictabilityMapWrapper";
import CoverageLegend from "../lib/CoverageLegend";
import { MapNavigationProvider, ProvinceMapLink } from "../lib/MapNavigationContext";
import {
  getCoveragePercent,
  getCoverageTier,
  isUnderfunded,
} from "../lib/coverageTiers";
import { applyDemoCoverageOverrides } from "../lib/demoCoverage";
import { FOCUS_REGION, FOCUS_REGION_LABEL, isRegionViiiProvince } from "../lib/regionViii";

export default async function Dashboard() {
  const [grants, poorestList, dbmBudget] = await Promise.all<[any[], any[], any]>([
    getActivePovertyGrants(),
    getPoorestProvinces(),
    getNationalSubsidies()
  ]);

  const regionViiiList = poorestList.filter((p: any) => isRegionViiiProvince(p.region));

  // Process provincial aid matching and detection (Region VIII only)
  const provinceStats = regionViiiList.map((p: any) => {
    const provinceAid = grants
      .filter((g: any) => g.provinces.some((prov: any) => {
        const pName = p.name.toLowerCase();
        const pReg = p.region.toLowerCase();
        const iatiLoc = prov.toLowerCase();
        
        // Fuzzy matching for regions (e.g., "Region VIII" matches "Eastern Visayas")
        const regionAliases: Record<string, string[]> = {
          "region viii": ["eastern visayas", "region 8", "samar"],
          "region vii": ["central visayas", "region 7", "cebu"],
          "barmm": ["bangsamoro", "muslim mindanao"],
          "car": ["cordillera"]
        };

        return iatiLoc.includes(pName) || 
               iatiLoc.includes(pReg) || 
               (regionAliases[pReg]?.some(alias => iatiLoc.includes(alias)));
      }))
      .reduce((sum, g) => sum + g.amount, 0);
    
    // RECONCILIATION: Combine IATI (International) + DBM (National Tax Allotment)
    const nationalBudget = dbmBudget[p.name] || (p.incidence * 42000000); 
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

  // Illustrative amounts for select provinces so all coverage tiers are visible
  const provinceStatsWithDemo = applyDemoCoverageOverrides(provinceStats);

  const regionStats = provinceStatsWithDemo;
  const provinceCount = regionStats.length || 1;
  const underfundedCount = regionStats.filter(p => p.isUnderfunded).length;
  const avgCoverage = (
    (regionStats.reduce((sum, p) => sum + (p.coveragePercent || 0), 0) / provinceCount)
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-200 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-[1001] flex items-center justify-between px-8 py-4 bg-[#020617] border-b border-gray-800 shadow-xl">
        <div>
          <div className="text-xl font-bold tracking-wider text-green-500">TrackAid</div>
          <div className="text-sm text-gray-400">The Philippine Resource Mobilization Tracker</div>
          <div className="mt-1 text-xs text-cyan-500/90">{FOCUS_REGION_LABEL}</div>
        </div>
        <nav className="hidden text-sm text-gray-400 md:block">
          Eastern Visayas funding gaps for LGUs and NGOs. Powered by Next.js, Leaflet, and live IATI data.
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl px-4 py-8 mx-auto">
        <MapNavigationProvider provinces={provinceStatsWithDemo}>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article className="p-5 bg-[#020617] border border-gray-800 rounded-xl shadow-2xl">
            <div className="mb-2 text-xs font-semibold tracking-widest text-gray-400 uppercase">Active Poverty Grants</div>
            <div className="text-2xl font-bold">{grants.length}</div>
            <p className="mt-1 text-xs text-sky-500">Live IATI Datastore projects.</p>
          </article>

          <article className="p-5 bg-[#020617] border border-gray-800 rounded-xl shadow-2xl">
            <div className="mb-2 text-xs font-semibold tracking-widest text-gray-400 uppercase">Avg Funding Coverage</div>
            <div className="text-2xl font-bold">{avgCoverage}%</div>
            <p className="mt-1 text-xs text-gray-500">Resources vs. Estimated Need.</p>
          </article>

          <article className="p-5 bg-[#020617] border border-gray-800 rounded-xl shadow-2xl">
            <div className="mb-2 text-xs font-semibold tracking-widest text-gray-400 uppercase">Underfunded ({FOCUS_REGION})</div>
            <div className="text-2xl font-bold">{underfundedCount}</div>
            <span className="inline-flex items-center px-2 py-1 mt-2 text-[10px] font-bold tracking-widest text-red-300 uppercase bg-red-900/30 rounded-full">
              Funding gap detected
            </span>
          </article>
        </section>

        {/* Map Section */}
        <section id="resource-map" className="mt-8 scroll-mt-24">
          <h2 className="mb-2 text-lg font-semibold">Resource Distribution Heatmap</h2>
          <p className="mb-4 text-sm text-gray-400">
            {FOCUS_REGION_LABEL}. Click a province name below to fly to it on the map.
          </p>
          
          {/* Interactive Map with dynamic search engine */}
          <PredictabilityMapWrapper provinces={provinceStatsWithDemo} />
          <CoverageLegend />
        </section>

        {/* Card Grid Section */}
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">Predictability breakdown</h2>
          <p className="mb-3 text-xs text-gray-500">Click a province name to locate it on the map.</p>
          <div className="grid grid-cols-2 gap-4 p-6 border border-gray-800 rounded-2xl bg-[#020617] sm:grid-cols-3">
            {regionStats.map((p) => (
              <div
                key={p.name}
                className={`flex flex-col p-3 rounded-lg bg-gray-900/20 border ${p.tier.borderClass}`}
              >
                <ProvinceMapLink
                  name={p.name}
                  className="text-[10px] text-gray-500 font-bold truncate mb-1 block w-full"
                >
                  {p.name}
                </ProvinceMapLink>
                <div className={`text-lg font-bold ${p.tier.textClass}`}>₱ {(p.totalResources / 1000000).toFixed(1)}M</div>
                <div className="text-[9px] text-gray-500">Total Resources · {p.coveragePercent.toFixed(0)}% covered</div>
                <div className="mt-2 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${p.tier.barClass}`}
                    style={{ width: `${Math.min(p.coveragePercent, 100)}%` }}
                  />
                </div>
                <span className={`mt-1.5 inline-block text-[9px] font-semibold uppercase tracking-wide ${p.tier.textClass}`}>
                  {p.tier.shortLabel}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Table Section */}
        <section className="mt-8 pointer-events-auto">
          <h2 className="mb-2 text-lg font-semibold">LGU Funding Matcher</h2>
          <p className="mb-4 text-sm text-gray-400 p-2 bg-black/30 rounded inline-block">
            Live comparison showing dynamic aid distribution against local poverty levels.
          </p>
          <div className="overflow-hidden bg-[#020617]/80 border border-gray-800 rounded-xl shadow-xl backdrop-blur-md">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-bold tracking-widest text-gray-500 uppercase bg-black/20">
                <tr>
                  <th className="px-4 py-3 border-b border-gray-800">Province</th>
                  <th className="px-4 py-3 border-b border-gray-800">Region</th>
                  <th className="px-4 py-3 border-b border-gray-800">Poverty Incidence</th>
                  <th className="px-4 py-3 border-b border-gray-800">International Aid</th>
                  <th className="px-4 py-3 border-b border-gray-800">Budget Coverage</th>
                  <th className="px-4 py-3 border-b border-gray-800">Alert Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {regionStats.map((p) => (
                  <tr key={p.name} className="transition-colors hover:bg-gray-900/50">
                    <td className="px-4 py-3 font-medium">
                      <ProvinceMapLink name={p.name}>{p.name}</ProvinceMapLink>
                    </td>
                    <td className="px-4 py-3">{p.region}</td>
                    <td className="px-4 py-3">{p.incidence}%</td>
                    <td className="px-4 py-3">₱ {(p.aid / 1000000).toFixed(1)}M</td>
                    <td className={`px-4 py-3 font-mono font-semibold ${p.tier.textClass}`}>
                      {p.coveragePercent.toFixed(0)}%
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${p.tier.badgeClass}`}>
                        {p.tier.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
          TrackAid · Badana, Dadal, Manuales
        </footer>
        </MapNavigationProvider>
      </main>
    </div>
  );
}
