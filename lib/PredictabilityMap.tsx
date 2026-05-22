'use client';

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Rectangle,
  useMap,
} from 'react-leaflet';
import { useEffect } from 'react';
import { getCoveragePercent, getCoverageTier, type CoverageTier } from './coverageTiers';
import { useMapNavigation } from './MapNavigationContext';
import { getProvinceDetailsUrl } from './provinceSlug';

const AnyMapContainer = MapContainer as any;
const AnyTileLayer = TileLayer as any;
const AnyCircleMarker = CircleMarker as any;
const AnyPopup = Popup as any;
const AnyRectangle = Rectangle as any;
import {
  FOCUS_REGION_LABEL,
  REGION_VIII_BOUNDS,
  REGION_VIII_CENTER,
  REGION_VIII_DEFAULT_ZOOM,
  REGION_VIII_FLY_ZOOM,
  REGION_VIII_MAX_ZOOM,
  REGION_VIII_MIN_ZOOM,
} from './regionViii';
import 'leaflet/dist/leaflet.css';

interface Province {
  name: string;
  lat: number;
  lng: number;
  incidence: number;
  aid: number;
  region: string;
  isUnderfunded: boolean;
  totalResources: number;
  budget: number;
  coveragePercent?: number;
  tier?: CoverageTier;
}

function MapFlyController() {
  const map = useMap();
  const { selectedProvince, provinces } = useMapNavigation();

  useEffect(() => {
    if (!selectedProvince) return;
    const province = provinces.find((p) => p.name === selectedProvince);
    if (!province) return;

    map.flyTo([province.lat, province.lng], REGION_VIII_FLY_ZOOM, { duration: 1.1 });
  }, [selectedProvince, provinces, map]);

  return null;
}

function RegionViewLock() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(REGION_VIII_BOUNDS, {
      padding: [20, 20],
      maxZoom: REGION_VIII_DEFAULT_ZOOM,
      animate: false,
    });
    map.setMaxBounds(REGION_VIII_BOUNDS);
    map.setMinZoom(REGION_VIII_MIN_ZOOM);
    map.setMaxZoom(REGION_VIII_MAX_ZOOM);
  }, [map]);

  return null;
}

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

export default function PredictabilityMap({ provinces }: { provinces: Province[] }) {
  const { selectedProvince } = useMapNavigation();

  const provinceTier = (p: Province) =>
    p.tier ?? getCoverageTier(p.coveragePercent ?? getCoveragePercent(p.totalResources, p.incidence));

  return (
    <div className="relative h-full w-full bg-[#e8eef4]">
      <AnyMapContainer
        center={REGION_VIII_CENTER}
        zoom={REGION_VIII_DEFAULT_ZOOM}
        minZoom={REGION_VIII_MIN_ZOOM}
        maxZoom={REGION_VIII_MAX_ZOOM}
        maxBounds={REGION_VIII_BOUNDS}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        style={{ height: '100%', width: '100%', background: '#e8eef4' }}
        zoomControl={true}
      >
        <RegionViewLock />
        <MapFlyController />
        <MapResizeFix />

        <AnyTileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <AnyRectangle
          bounds={REGION_VIII_BOUNDS}
          pathOptions={{
            color: '#0d9488',
            weight: 2.5,
            fillColor: '#5eead4',
            fillOpacity: 0.12,
            dashArray: '6 5',
          }}
        />

        {provinces.map((p) => {
          const tier = provinceTier(p);
          const coverage =
            p.coveragePercent ?? getCoveragePercent(p.totalResources, p.incidence);
          const isSelected = selectedProvince === p.name;

          return (
            <AnyCircleMarker
              key={p.name}
              center={[p.lat, p.lng]}
              pathOptions={{
                color: isSelected ? '#0f766e' : '#1e293b',
                fillColor: tier.hex,
                fillOpacity: isSelected ? 0.95 : 0.82,
                weight: isSelected ? 3 : 2,
              }}
              radius={(isSelected ? 15 : 10) + p.incidence / 6}
            >
              <AnyPopup className="trackaid-popup">
                <div className="text-xs text-slate-700">
                  <strong className="mb-2 block border-b border-sky-100 pb-1 text-sm text-slate-900">
                    {p.name}
                  </strong>
                  <p className="text-slate-500">{FOCUS_REGION_LABEL}</p>
                  <p className="mt-2 text-[11px] text-slate-500">Open the province detail page for funding metrics and coverage analysis.</p>
                  <div className="mt-3">
                    <a
                      href={getProvinceDetailsUrl(p.name)}
                      className="inline-flex items-center rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-600"
                    >
                      Show details
                    </a>
                  </div>
                </div>
              </AnyPopup>
            </AnyCircleMarker>
          );
        })}
      </AnyMapContainer>
    </div>
  );
}
