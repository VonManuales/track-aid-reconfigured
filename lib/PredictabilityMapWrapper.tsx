'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Leaflet component with SSR disabled.
// This is now safe because this wrapper is a Client Component.
const Map = dynamic(() => import('./PredictabilityMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 animate-pulse flex items-center justify-center text-gray-500">
      Initializing Geospatial Engine...
    </div>
  ),
});

interface MapWrapperProps {
  provinces: any[];
}

export default function PredictabilityMapWrapper({ provinces }: MapWrapperProps) {
  return (
    <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative">
      <Map provinces={provinces} />
    </div>
  );
}