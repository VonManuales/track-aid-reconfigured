'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import the Leaflet component with SSR disabled.
// This wrapper renders the same placeholder on server and first client render,
// avoiding a hydration mismatch before the actual map is mounted.
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative">
      {mounted ? (
        <Map provinces={provinces} />
      ) : (
        <div className="w-full h-full bg-gray-900 animate-pulse flex items-center justify-center text-gray-500">
          Initializing Geospatial Engine...
        </div>
      )}
    </div>
  );
}