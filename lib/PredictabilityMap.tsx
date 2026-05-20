'use client';

import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useState, useMemo, useEffect } from 'react';
import { regionCoords } from './geoData';
import { getCoveragePercent, getCoverageTier, type CoverageTier } from './coverageTiers';
import { useMapNavigation } from './MapNavigationContext';
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

// Internal helper to monitor zoom level
function ZoomTracker({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
    moveend: () => onZoomChange(map.getZoom()),
  });
  return null;
}

function MapFlyController() {
  const map = useMap();
  const { selectedProvince, provinces } = useMapNavigation();

  useEffect(() => {
    if (!selectedProvince) return;
    const province = provinces.find((p) => p.name === selectedProvince);
    if (!province) return;

    map.flyTo([province.lat, province.lng], 9, { duration: 1.25 });
  }, [selectedProvince, provinces, map]);

  return null;
}

export default function PredictabilityMap({ provinces }: { provinces: Province[] }) {
  const { selectedProvince } = useMapNavigation();
  const center: [number, number] = [12.8797, 121.7740]; // Center of Philippines
  const [currentZoom, setCurrentZoom] = useState(6);

  // Define boundaries for the Philippines to prevent panning away
  const phBounds: [[number, number], [number, number]] = [
    [4.5, 114.0], // Southwest
    [21.5, 128.0] // Northeast
  ];

  const showProvinces = currentZoom >= 8;

  // Regional Aggregator
  const regionalData = useMemo(() => {
    const groups: Record<string, {
      name: string;
      aid: number;
      count: number;
      avgIncidence: number;
      underfundedCount: number;
      totalCoverage: number;
    }> = {};

    provinces.forEach((p) => {
      const coverage =
        p.coveragePercent ?? getCoveragePercent(p.totalResources, p.incidence);
      if (!groups[p.region]) {
        groups[p.region] = {
          name: p.region,
          aid: 0,
          count: 0,
          avgIncidence: 0,
          underfundedCount: 0,
          totalCoverage: 0,
        };
      }
      groups[p.region].aid += p.aid;
      groups[p.region].avgIncidence += p.incidence;
      groups[p.region].totalCoverage += coverage;
      if (p.isUnderfunded) groups[p.region].underfundedCount += 1;
      groups[p.region].count += 1;
    });

    return Object.values(groups).map((g) => {
      const avgCoverage = g.totalCoverage / g.count;
      const tier = getCoverageTier(avgCoverage);
      return {
        ...g,
        avgIncidence: (g.avgIncidence / g.count).toFixed(1),
        avgCoverage: avgCoverage.toFixed(0),
        tier,
        isRegionalCrisis: g.underfundedCount > g.count / 2,
      };
    });
  }, [provinces]);

  const provinceTier = (p: Province) =>
    p.tier ?? getCoverageTier(p.coveragePercent ?? getCoveragePercent(p.totalResources, p.incidence));

  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={center} 
        zoom={6}
        minZoom={5}
        maxBounds={phBounds}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%', background: '#020617' }}
        zoomControl={true}
      >
        <ZoomTracker onZoomChange={setCurrentZoom} />
        <MapFlyController />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; PSA OpenStat'
        />

        {/* Regional View (Zoomed Out) */}
        {!showProvinces && regionalData.map((reg) => (
          <CircleMarker
            key={reg.name}
            center={regionCoords[reg.name] || center}
            pathOptions={{
              color: reg.tier.hex,
              fillColor: reg.tier.hex,
              fillOpacity: 0.55,
              weight: 2,
            }}
            radius={12 + Math.min(reg.underfundedCount, 6)}
          >
            <Popup>
              <div className="text-gray-900 text-xs">
                <strong className="block text-sm">{reg.name}</strong>
                Provinces: {reg.count}<br/>
                Avg coverage: {reg.avgCoverage}%<br/>
                Status: {reg.tier.label}<br/>
                Underfunded provinces: {reg.underfundedCount}<br/>
                <span className="text-emerald-600 font-bold mt-1 block">Zoom in to see provinces</span>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Provincial View (Zoomed In) */}
        {showProvinces && provinces.map((p) => {
            const tier = provinceTier(p);
            const coverage =
              p.coveragePercent ?? getCoveragePercent(p.totalResources, p.incidence);
            const isSelected = selectedProvince === p.name;
            return (
              <CircleMarker
                key={p.name}
                center={[p.lat, p.lng]}
                pathOptions={{
                  color: isSelected ? '#ffffff' : tier.hex,
                  fillColor: tier.hex,
                  fillOpacity: isSelected ? 0.85 : 0.6,
                  weight: isSelected ? 3 : 2,
                }}
                radius={(isSelected ? 14 : 8) + (p.incidence / 4)}
              >
                <Popup>
                  <div className="text-gray-900 text-xs">
                    <strong className="block text-sm border-b mb-1">{p.name}</strong>
                    Poverty: {p.incidence}%<br/>
                    Coverage: {coverage.toFixed(0)}%<br/>
                    DBM Subsidy: ₱{(p.budget/1000000).toFixed(1)}M<br/>
                    IATI Aid: ₱{(p.aid/1000000).toFixed(1)}M<br/>
                    Status: {tier.label}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}