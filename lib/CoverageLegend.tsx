import { COVERAGE_TIERS } from './coverageTiers';

export default function CoverageLegend() {
  return (
    <div
      className="mt-3 rounded-xl border border-gray-800 bg-[#020617]/90 px-4 py-3"
      aria-label="Funding coverage color legend"
    >
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
        Predictability coverage scale
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {COVERAGE_TIERS.map((tier) => (
          <div key={tier.id} className="flex items-center gap-2 text-xs text-gray-400">
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-white/10 shadow-sm"
              style={{ backgroundColor: tier.hex }}
              aria-hidden
            />
            <span>
              <span className="font-medium text-gray-300">{tier.shortLabel}</span>
              <span className="text-gray-500"> · {tier.rangeLabel}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-gray-500">
        Colors reflect total resources (IATI aid + national subsidy) vs. estimated need from poverty incidence.
        When demo mode is enabled, the ten highest-poverty provinces use illustrative coverage values to show each tier.
      </p>
    </div>
  );
}
