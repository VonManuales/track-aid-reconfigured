'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { FOCUS_REGION_LABEL } from './regionViii';

const Map = dynamic(() => import('./PredictabilityMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#e8eef4] text-sky-700/70">
      Loading Eastern Visayas map…
    </div>
  ),
});

interface MapWrapperProps {
  provinces: any[];
}

export default function PredictabilityMapWrapper({ provinces }: MapWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative h-[540px] w-full overflow-hidden rounded-2xl border border-sky-200/90 bg-[#e8eef4] shadow-xl shadow-sky-200/50 ring-1 ring-sky-300/40">
      {mounted ? (
        <Map provinces={provinces} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#e8eef4] text-sky-700/70">
          Loading Eastern Visayas map…
        </div>
      )}

      {/* Soft sky/emerald wash over the visible region only */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-100/25 via-transparent to-emerald-100/20"
        aria-hidden
      />

      <div className="absolute left-3 top-3 z-[1000] rounded-lg border border-sky-200 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-teal-700">
          {FOCUS_REGION_LABEL}
        </span>
        <span className="text-[9px] text-slate-500">Locked to Eastern Visayas · surrounding areas visible</span>
      </div>
    </div>
  );
}
