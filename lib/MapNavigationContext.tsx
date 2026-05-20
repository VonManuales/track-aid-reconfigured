'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type MapProvince = {
  name: string;
  lat: number;
  lng: number;
};

type MapNavigationContextValue = {
  provinces: MapProvince[];
  selectedProvince: string | null;
  flyToProvince: (name: string) => void;
};

const MapNavigationContext = createContext<MapNavigationContextValue | null>(null);

export function MapNavigationProvider({
  provinces,
  children,
}: {
  provinces: MapProvince[];
  children: ReactNode;
}) {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const flyToProvince = useCallback((name: string) => {
    setSelectedProvince(name);
    const mapSection = document.getElementById('resource-map');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const value = useMemo(
    () => ({ provinces, selectedProvince, flyToProvince }),
    [provinces, selectedProvince, flyToProvince],
  );

  return (
    <MapNavigationContext.Provider value={value}>
      {children}
    </MapNavigationContext.Provider>
  );
}

export function useMapNavigation() {
  const ctx = useContext(MapNavigationContext);
  if (!ctx) {
    throw new Error('useMapNavigation must be used within MapNavigationProvider');
  }
  return ctx;
}

export function ProvinceMapLink({
  name,
  className = '',
  children,
}: {
  name: string;
  className?: string;
  children: ReactNode;
}) {
  const { flyToProvince } = useMapNavigation();

  return (
    <button
      type="button"
      onClick={() => flyToProvince(name)}
      className={`cursor-pointer text-left transition-colors hover:text-sky-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:rounded-sm ${className}`}
      title={`Show ${name} on the map`}
    >
      {children}
    </button>
  );
}
