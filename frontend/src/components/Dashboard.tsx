import React, { useEffect, useState } from 'react';
import { CommandHeader } from './CommandHeader';
import { OperationalStatsRow } from './OperationalStatsRow';
import { GISMap } from './GISMap';
import { ZoneDetailPanel } from './ZoneDetailPanel';
import { ActiveAlertsPanel } from './ActiveAlertsPanel';
import { Card } from './ui/Card';
import type {
  WardZone,
  HospitalMarker,
  ShelterMarker,
  EmergencyUnitMarker,
  RoadSegmentMarker,
  IncidentAlert,
  OperationalSummary,
  FloodIncident,
} from '../lib/types';
import {
  FLOOD_INCIDENTS,
  INITIAL_OPERATIONAL_SUMMARY,
} from '../lib/mockData';
import {
  checkBackendHealth,
  fetchCitySummary,
  fetchWards,
  fetchHospitals,
  fetchShelters,
  fetchRoads,
  fetchDepotResources,
  type HealthStatus,
} from '../lib/api';

export const Dashboard: React.FC = () => {
  const [activeIncident, setActiveIncident] = useState<FloodIncident>(FLOOD_INCIDENTS[0]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [summary, setSummary] = useState<OperationalSummary>(FLOOD_INCIDENTS[0].summary);
  const [zones, setZones] = useState<WardZone[]>(FLOOD_INCIDENTS[0].zones);
  const [hospitals, setHospitals] = useState<HospitalMarker[]>(FLOOD_INCIDENTS[0].hospitals);
  const [shelters, setShelters] = useState<ShelterMarker[]>(FLOOD_INCIDENTS[0].shelters);
  const [units, setUnits] = useState<EmergencyUnitMarker[]>(FLOOD_INCIDENTS[0].units);
  const [roads, setRoads] = useState<RoadSegmentMarker[]>(FLOOD_INCIDENTS[0].roads);
  const [alerts, setAlerts] = useState<IncidentAlert[]>(FLOOD_INCIDENTS[0].alerts);

  const [selectedZone, setSelectedZone] = useState<WardZone | null>(FLOOD_INCIDENTS[0].zones[0] ?? null);
  const [focusedCoords, setFocusedCoords] = useState<[number, number] | null>(null);
  const [activeTab, setActiveTab] = useState<'ZONE_INSPECTOR' | 'ALERTS'>('ZONE_INSPECTOR');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleSelectIncident = (incident: FloodIncident) => {
    setActiveIncident(incident);
    setSelectedZone(incident.zones[0] ?? null);
    setFocusedCoords(null);
    setSummary(incident.summary);
    setZones(incident.zones);
    setHospitals(incident.hospitals);
    setShelters(incident.shelters);
    setUnits(incident.units);
    setRoads(incident.roads);
    setAlerts(incident.alerts);

    // If switching back to the real backend incident and system is online, hydrate live
    if (incident.is_real_backend_dataset && health?.online) {
      loadData(incident);
    }
  };

  const loadData = async (targetIncident?: FloodIncident) => {
    const currentIncident = targetIncident ?? activeIncident;
    setRefreshing(true);

    // 1. Live health check
    const healthStatus = await checkBackendHealth(2000);
    setHealth(healthStatus);

    // 2. If backend is online AND the active incident is the real PostGIS dataset, hydrate
    if (healthStatus.online && currentIncident.is_real_backend_dataset) {
      try {
        const [wardsData, hospitalsData, sheltersData, roadsData, depotData] =
          await Promise.allSettled([
            fetchWards(),
            fetchHospitals(),
            fetchShelters(),
            fetchRoads(),
            fetchDepotResources(),
          ]);

        // Hydrate hospitals if valid
        if (
          hospitalsData.status === 'fulfilled' &&
          Array.isArray(hospitalsData.value) &&
          hospitalsData.value.length > 0
        ) {
          const mappedHosp: HospitalMarker[] = hospitalsData.value.map((h: any) => ({
            hospital_id: h.hospital_id,
            name: h.name,
            city_id: h.city_id,
            zone_id: h.zone_id,
            bed_capacity: h.bed_capacity,
            icu_beds: h.icu_beds,
            has_emergency_ward: h.has_emergency_ward,
            status: h.has_emergency_ward ? 'WATER_INGRESS' : 'OPERATIONAL',
            coordinates: h.geometry?.coordinates ?? [72.572, 23.035],
          }));
          setHospitals(mappedHosp);
        }

        // Hydrate shelters if valid
        if (
          sheltersData.status === 'fulfilled' &&
          Array.isArray(sheltersData.value) &&
          sheltersData.value.length > 0
        ) {
          const mappedShelters: ShelterMarker[] = sheltersData.value.map((s: any) => ({
            shelter_id: s.shelter_id,
            name: s.name,
            city_id: s.city_id,
            zone_id: s.zone_id,
            occupancy_capacity: s.occupancy_capacity,
            current_occupancy: Math.round(s.occupancy_capacity * 0.75),
            has_generator: s.has_generator,
            potable_water_liters: s.potable_water_liters,
            status: s.occupancy_capacity > 600 ? 'NEAR_CAPACITY' : 'OPEN',
            coordinates: s.geometry?.coordinates ?? [72.555, 23.045],
          }));
          setShelters(mappedShelters);
        }

        // Hydrate depot stockpile counts
        if (depotData.status === 'fulfilled' && depotData.value) {
          setSummary((prev) => ({
            ...prev,
            depot_resources: {
              ambulances: depotData.value.ambulances ?? prev.depot_resources.ambulances,
              rescue_boats: depotData.value.rescue_boats ?? prev.depot_resources.rescue_boats,
              food_packets: depotData.value.food_packets ?? prev.depot_resources.food_packets,
              medical_kits: depotData.value.medical_kits ?? prev.depot_resources.medical_kits,
              personnel: depotData.value.personnel ?? prev.depot_resources.personnel,
            },
          }));
        }
      } catch (err) {
        console.warn('Backend hydration failed, using high-fidelity fallback demo data', err);
      }
    }

    setRefreshing(false);
  };

  useEffect(() => {
    loadData();

    // Auto-poll health every 15 seconds to keep the live badge accurate
    const interval = setInterval(async () => {
      const h = await checkBackendHealth(2000);
      setHealth(h);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectZone = (zone: WardZone) => {
    setSelectedZone(zone);
    setActiveTab('ZONE_INSPECTOR');
  };

  const handleSelectAlert = (alert: IncidentAlert) => {
    if (alert.coordinates) {
      setFocusedCoords(alert.coordinates);
    }
    const matchingZone = zones.find((z) => z.zone_id === alert.zone_id);
    if (matchingZone) {
      setSelectedZone(matchingZone);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tactical Incident Command Header with Selectable Active Flood Area */}
      <CommandHeader
        health={health}
        onRefresh={() => loadData()}
        refreshing={refreshing}
        activeIncident={activeIncident}
        incidents={FLOOD_INCIDENTS}
        onSelectIncident={handleSelectIncident}
      />

      {/* Operational Statistics Row */}
      <OperationalStatsRow
        summary={summary}
        backendOnline={health?.online === true && activeIncident.is_real_backend_dataset}
      />

      {/* Main Operational Command Workspace: Map + Tactical Inspector Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Center: Primary GIS Map (Centerpiece) */}
        <div className="col-span-1 lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeIncident.status === 'ACTIVE_FLOOD'
                    ? 'bg-red-600 animate-pulse'
                    : 'bg-amber-500'
                }`}
              ></span>
              <h2 className="text-sm font-semibold uppercase tracking-wider font-mono text-ink">
                Cartographic Operational Surface // {activeIncident.short_label}
              </h2>
            </div>
            <div className="text-xs font-mono text-mute hidden sm:block">
              Coordinates: {activeIncident.center_coordinates[1].toFixed(3)}° N,{' '}
              {activeIncident.center_coordinates[0].toFixed(3)}° E ({activeIncident.region})
            </div>
          </div>

          <GISMap
            zones={zones}
            hospitals={hospitals}
            shelters={shelters}
            units={units}
            roads={roads}
            alerts={alerts}
            selectedZone={selectedZone}
            onSelectZone={handleSelectZone}
            focusedCoordinates={focusedCoords}
            centerCoordinates={activeIncident.center_coordinates}
            zoomLevel={activeIncident.zoom_level}
            floodCorridor={activeIncident.flood_corridor}
            incidentName={activeIncident.name}
            isRealBackendDataset={activeIncident.is_real_backend_dataset}
          />
        </div>

        {/* Right / Rail: Dual-Tab Tactical Inspector (Zone Details & Alerts) */}
        <div className="col-span-1 lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-4">
          {/* Rail Navigation Tabs */}
          <div className="flex items-center gap-2 p-1 bg-canvas-elevated border border-hairline rounded-lg text-xs font-mono">
            <button
              onClick={() => setActiveTab('ZONE_INSPECTOR')}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all font-semibold cursor-pointer ${
                activeTab === 'ZONE_INSPECTOR'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-body hover:text-ink hover:bg-hairline-soft'
              }`}
            >
              Zone Inspector {selectedZone ? '●' : ''}
            </button>
            <button
              onClick={() => setActiveTab('ALERTS')}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all font-semibold cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'ALERTS'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-body hover:text-ink hover:bg-hairline-soft'
              }`}
            >
              <span>Tactical Alerts</span>
              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px]">
                {alerts.length}
              </span>
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="h-[650px]">
            {activeTab === 'ZONE_INSPECTOR' ? (
              selectedZone ? (
                <ZoneDetailPanel
                  zone={selectedZone}
                  onClose={() => setSelectedZone(null)}
                  onLaunchSimulation={(zoneId) => {
                    window.location.href = `/simulation?zone=${zoneId}`;
                  }}
                />
              ) : (
                <Card className="h-full flex flex-col items-center justify-center text-center p-8 border-dashed">
                  <div className="text-3xl mb-2">🗺️</div>
                  <h4 className="font-semibold text-sm text-ink mb-1">No Zone Selected</h4>
                  <p className="text-xs text-mute max-w-xs leading-relaxed">
                    Click any ward polygon on the GIS map to inspect inundated areas, affected population, facilities, and response gaps.
                  </p>
                </Card>
              )
            ) : (
              <ActiveAlertsPanel
                alerts={alerts}
                onSelectAlert={handleSelectAlert}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Pipeline Status Strip */}
      <Card className="border border-hairline bg-canvas-elevated">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-mute mb-1">
              End-to-End Decision Pipeline Architecture
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-body">
              <span className="px-2 py-0.5 rounded border border-hairline bg-canvas text-ink">
                1. Satellite GeoTIFF
              </span>
              <span className="text-mute">→</span>
              <span className="px-2 py-0.5 rounded border border-hairline bg-canvas text-ink">
                2. NDWI Water Inversion
              </span>
              <span className="text-mute">→</span>
              <span className="px-2 py-0.5 rounded border border-hairline bg-canvas text-ink">
                3. Permanent Masking
              </span>
              <span className="text-mute">→</span>
              <span className="px-2 py-0.5 rounded border border-hairline bg-canvas text-ink">
                4. GeoJSON Polygonizer
              </span>
              <span className="text-mute">→</span>
              <span className="px-2 py-0.5 rounded border border-hairline bg-canvas text-ink">
                5. PostGIS Intersection
              </span>
              <span className="text-mute">→</span>
              <span className="px-2 py-0.5 rounded border border-hairline bg-primary text-on-primary font-semibold">
                6. Dynamic Resource Optimization
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono text-mute">
              Connected Services: <strong>FastAPI / Shapely / PostGIS / PyProj / ISRO Bhuvan WMS</strong>
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
