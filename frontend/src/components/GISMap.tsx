import React, { useEffect, useRef, useState } from 'react';
import type {
  WardZone,
  HospitalMarker,
  ShelterMarker,
  EmergencyUnitMarker,
  RoadSegmentMarker,
  IncidentAlert,
  ISROServiceStatus,
} from '../lib/types';
import { MOCK_FLOOD_CORRIDOR_GEOJSON } from '../lib/mockData';
import { fetchISROStatus, getISROWmsUrl } from '../lib/api';

interface GISMapProps {
  zones: WardZone[];
  hospitals: HospitalMarker[];
  shelters: ShelterMarker[];
  units: EmergencyUnitMarker[];
  roads: RoadSegmentMarker[];
  alerts: IncidentAlert[];
  selectedZone: WardZone | null;
  onSelectZone: (zone: WardZone) => void;
  focusedCoordinates?: [number, number] | null;
  centerCoordinates?: [number, number]; // [lon, lat]
  zoomLevel?: number;
  floodCorridor?: any;
  incidentName?: string;
  isRealBackendDataset?: boolean;
}

export const GISMap: React.FC<GISMapProps> = ({
  zones,
  hospitals,
  shelters,
  units,
  roads,
  alerts,
  selectedZone,
  onSelectZone,
  focusedCoordinates,
  centerCoordinates = [72.575, 23.038], // default: Ahmedabad Sabarmati
  zoomLevel = 13,
  floodCorridor = MOCK_FLOOD_CORRIDOR_GEOJSON,
  incidentName = 'Sabarmati Basin Flood Response',
  isRealBackendDataset = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{
    baseMap?: any;
    isroSatellite?: any;
    zones?: any;
    flood?: any;
    hospitals?: any;
    shelters?: any;
    units?: any;
    roads?: any;
    alerts?: any;
  }>({});

  const [visibleLayers, setVisibleLayers] = useState({
    baseMap: true,
    isroSatellite: false,
    floodExtent: true,
    riskZones: true,
    facilities: true,
    roads: true,
    units: true,
  });

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isroStatus, setIsroStatus] = useState<ISROServiceStatus | null>(null);

  // Fetch ISRO Bhuvan Service Telemetry
  useEffect(() => {
    fetchISROStatus()
      .then((status) => setIsroStatus(status))
      .catch((err) => {
        console.warn('ISRO status telemetry unreachable, fallback mode enabled', err);
        setIsroStatus({
          service: 'ISRO Bhuvan EO Service (Offline Cache)',
          provider: 'ISRO / NRSC',
          portal_url: 'https://bhuvan.nrsc.gov.in',
          wms_endpoint: '/api/v1/gis/isro/wms',
          active_layer: 'india3',
          is_authenticated: false,
          attribution: '© ISRO / NRSC Bhuvan',
          data_classification: 'ISRO BHUVAN PUBLIC WMS',
          supported_layers: [],
          security_note: 'Protected via backend proxy',
        });
      });
  }, []);

  // Initialize map with dynamic Leaflet import to prevent SSR breakages
  useEffect(() => {
    let isMounted = true;

    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

      // Fix Leaflet's default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Initial center [lat, lon]
      const map = L.map(mapContainerRef.current, {
        center: [centerCoordinates[1], centerCoordinates[0]],
        zoom: zoomLevel,
        zoomControl: false,
        attributionControl: false,
      });

      // Base CartoDB Positron layer
      const baseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);
      layersRef.current.baseMap = baseLayer;

      // Custom positioned zoom control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // React to incident center coordinates change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !centerCoordinates) return;
    mapInstanceRef.current.flyTo([centerCoordinates[1], centerCoordinates[0]], zoomLevel, {
      duration: 1.0,
    });
  }, [centerCoordinates[0], centerCoordinates[1], zoomLevel, mapLoaded]);

  // Update layers whenever data, selections, or visibility toggle changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Toggle Base Map
      if (layersRef.current.baseMap) {
        if (visibleLayers.baseMap && !map.hasLayer(layersRef.current.baseMap)) {
          layersRef.current.baseMap.addTo(map);
        } else if (!visibleLayers.baseMap && map.hasLayer(layersRef.current.baseMap)) {
          map.removeLayer(layersRef.current.baseMap);
        }
      }

      // Clear dynamic overlay layer groups
      const overlayKeys = ['isroSatellite', 'flood', 'zones', 'roads', 'facilities', 'units', 'alerts'] as const;
      overlayKeys.forEach((key) => {
        if (layersRef.current[key]) {
          map.removeLayer(layersRef.current[key]);
          delete layersRef.current[key];
        }
      });

      // 1. ISRO Bhuvan WMS Satellite Layer
      if (visibleLayers.isroSatellite) {
        const isroWmsLayer = (L.tileLayer as any).wms(getISROWmsUrl(), {
          layers: isroStatus?.active_layer || 'india3',
          format: 'image/png',
          transparent: true,
          version: '1.1.1',
          attribution: '© ISRO / NRSC Bhuvan',
          opacity: 0.75,
          maxZoom: 19,
        });
        isroWmsLayer.addTo(map);
        layersRef.current.isroSatellite = isroWmsLayer;
      }

      // 2. Flood Extent Overlay (NDWI detection polygon corridor)
      if (visibleLayers.floodExtent && floodCorridor) {
        const floodLayer = L.geoJSON(floodCorridor as any, {
          style: {
            color: '#007cf0',
            weight: 2,
            opacity: 0.9,
            fillColor: '#00dfd8',
            fillOpacity: 0.38,
            dashArray: '4, 4',
          },
          onEachFeature: (feature, layer) => {
            layer.bindTooltip(
              `<div class="font-mono text-xs p-1">
                <strong class="text-ink">NDWI Inundation Extent</strong><br/>
                <span class="text-mute">Detected: Sentinel-2 Multispectral</span><br/>
                <span class="text-error font-medium">Inundation: River Overtopping</span>
              </div>`,
              { sticky: true }
            );
          },
        }).addTo(map);
        layersRef.current.flood = floodLayer;
      }

      // 3. Risk Zones (Wards)
      if (visibleLayers.riskZones && zones.length > 0) {
        const zoneFeatures = {
          type: 'FeatureCollection',
          features: zones.map((z) => ({
            type: 'Feature',
            properties: z,
            geometry: z.geometry,
          })),
        };

        const zoneLayer = L.geoJSON(zoneFeatures as any, {
          style: (feature: any) => {
            const props: WardZone = feature.properties;
            const isSelected = selectedZone?.zone_id === props.zone_id;

            let fillColor = '#fafafa';
            let strokeColor = '#8f8f8f';
            let fillOpacity = 0.15;

            if (props.severity === 'CRITICAL') {
              fillColor = '#ee0000';
              strokeColor = '#c50000';
              fillOpacity = isSelected ? 0.45 : 0.32;
            } else if (props.severity === 'HIGH') {
              fillColor = '#f5a623';
              strokeColor = '#ab570a';
              fillOpacity = isSelected ? 0.35 : 0.22;
            } else if (props.severity === 'MODERATE') {
              fillColor = '#f5a623';
              strokeColor = '#f5a623';
              fillOpacity = isSelected ? 0.22 : 0.12;
            } else {
              fillColor = '#0070f3';
              strokeColor = '#0070f3';
              fillOpacity = isSelected ? 0.15 : 0.08;
            }

            return {
              color: isSelected ? '#171717' : strokeColor,
              weight: isSelected ? 3.5 : 1.75,
              opacity: isSelected ? 1 : 0.85,
              fillColor,
              fillOpacity,
              dashArray: isSelected ? undefined : '3, 3',
            };
          },
          onEachFeature: (feature: any, layer: any) => {
            const z: WardZone = feature.properties;
            layer.on({
              click: () => onSelectZone(z),
              mouseover: () => {
                layer.setStyle({ weight: 3, opacity: 1 });
              },
              mouseout: () => {
                const isSelected = selectedZone?.zone_id === z.zone_id;
                layer.setStyle({
                  weight: isSelected ? 3.5 : 1.75,
                  opacity: isSelected ? 1 : 0.85,
                });
              },
            });

            layer.bindTooltip(
              `<div class="p-1 font-sans">
                <div class="text-xs font-mono font-semibold uppercase text-ink">${z.zone_name}</div>
                <div class="text-xs text-body mt-0.5">
                  Severity: <strong class="${z.severity === 'CRITICAL' ? 'text-error' : z.severity === 'HIGH' ? 'text-warning-deep' : 'text-link'}">${z.severity}</strong> (${z.severity_score}/10)
                </div>
                <div class="text-xs text-mute mt-0.5">
                  Flooded Area: ${z.submerged_area_sq_km.toFixed(2)} km² (${z.submerged_percent.toFixed(1)}%)
                </div>
                <div class="text-[11px] text-body mt-1 font-mono">Click to inspect zone details</div>
              </div>`,
              { sticky: true }
            );
          },
        }).addTo(map);

        layersRef.current.zones = zoneLayer;
      }

      // 4. Roads & Evacuation Corridors
      if (visibleLayers.roads && roads.length > 0) {
        const roadGroup = L.layerGroup();
        roads.forEach((road) => {
          const latLngs = road.coordinates.map((c) => [c[1], c[0]]);
          const isClosed = road.status === 'SUBMERGED_CLOSED';
          const isWaterlogged = road.status === 'WATERLOGGED';

          const polyline = L.polyline(latLngs as any, {
            color: isClosed ? '#ee0000' : isWaterlogged ? '#f5a623' : '#0070f3',
            weight: isClosed ? 5 : 3.5,
            opacity: 0.9,
            dashArray: isClosed ? '6, 6' : undefined,
          });

          polyline.bindTooltip(
            `<div class="p-1 text-xs">
              <strong class="text-ink">${road.name}</strong><br/>
              <span class="${isClosed ? 'text-error font-bold' : isWaterlogged ? 'text-warning-deep font-semibold' : 'text-link'}">
                ${road.status.replace('_', ' ')} ${road.water_depth_cm ? `(${road.water_depth_cm}cm)` : ''}
              </span>
              ${road.is_evacuation_route ? '<div class="text-[10px] text-mute font-mono">Designated Evacuation Corridor</div>' : ''}
            </div>`
          );

          polyline.addTo(roadGroup);
        });
        roadGroup.addTo(map);
        layersRef.current.roads = roadGroup;
      }

      // 5. Critical Facilities (Hospitals & Shelters)
      if (visibleLayers.facilities) {
        const facilityGroup = L.layerGroup();

        // Hospitals
        hospitals.forEach((hosp) => {
          const isIngress = hosp.status === 'WATER_INGRESS' || hosp.status === 'CRITICAL';
          const icon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div class="relative group cursor-pointer">
                <div class="w-7 h-7 rounded-full bg-white border-2 ${isIngress ? 'border-red-600 animate-pulse' : 'border-neutral-900'} shadow-md flex items-center justify-center text-xs">
                  🏥
                </div>
                ${isIngress ? '<span class="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span></span>' : ''}
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([hosp.coordinates[1], hosp.coordinates[0]], { icon });
          marker.bindPopup(`
            <div class="p-2 font-sans max-w-xs">
              <div class="text-xs font-mono uppercase text-mute">Medical Facility</div>
              <div class="text-sm font-semibold text-ink mt-0.5">${hosp.name}</div>
              <div class="mt-1 flex items-center gap-1.5">
                <span class="px-1.5 py-0.5 text-[10px] font-mono rounded ${isIngress ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">
                  ${hosp.status}
                </span>
                <span class="text-xs text-mute">Beds: ${hosp.bed_capacity} (ICU: ${hosp.icu_beds})</span>
              </div>
            </div>
          `);
          marker.addTo(facilityGroup);
        });

        // Shelters
        shelters.forEach((shelter) => {
          const isNearCap = shelter.status === 'NEAR_CAPACITY' || shelter.status === 'FULL';
          const icon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div class="relative group cursor-pointer">
                <div class="w-7 h-7 rounded-full bg-white border-2 ${isNearCap ? 'border-amber-600' : 'border-blue-600'} shadow-md flex items-center justify-center text-xs">
                  ⛺
                </div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([shelter.coordinates[1], shelter.coordinates[0]], { icon });
          marker.bindPopup(`
            <div class="p-2 font-sans max-w-xs">
              <div class="text-xs font-mono uppercase text-mute">Evacuation Relief Shelter</div>
              <div class="text-sm font-semibold text-ink mt-0.5">${shelter.name}</div>
              <div class="mt-1 text-xs text-body">
                Occupancy: <strong>${shelter.current_occupancy}</strong> / ${shelter.occupancy_capacity}
                <div class="w-full bg-neutral-200 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div class="h-full ${isNearCap ? 'bg-amber-600' : 'bg-blue-600'}" style="width: ${(shelter.current_occupancy / shelter.occupancy_capacity) * 100}%"></div>
                </div>
              </div>
              <div class="mt-1.5 text-[11px] text-mute flex items-center gap-2">
                <span>⚡ Generator: ${shelter.has_generator ? 'Yes' : 'No'}</span>
                <span>💧 Potable: ${(shelter.potable_water_liters / 1000).toFixed(1)}kL</span>
              </div>
            </div>
          `);
          marker.addTo(facilityGroup);
        });

        facilityGroup.addTo(map);
        layersRef.current.facilities = facilityGroup;
      }

      // 6. Emergency Units & Rescue Assets
      if (visibleLayers.units && units.length > 0) {
        const unitGroup = L.layerGroup();
        units.forEach((unit) => {
          const isBoat = unit.type === 'RESCUE_BOAT';
          const isTeam = unit.type === 'NDRF_TEAM';
          const iconSymbol = isBoat ? '🚤' : isTeam ? '🦺' : '🚑';

          const icon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div class="relative group cursor-pointer">
                <div class="w-6 h-6 rounded-full bg-neutral-900 text-white border border-neutral-700 shadow flex items-center justify-center text-[10px]">
                  ${iconSymbol}
                </div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker([unit.coordinates[1], unit.coordinates[0]], { icon });
          marker.bindTooltip(
            `<div class="p-1 font-mono text-xs">
              <strong class="text-ink">${unit.callsign}</strong> (${unit.status})<br/>
              <span class="text-mute">${unit.assigned_mission ?? 'Staged on standby'}</span>
            </div>`
          );
          marker.addTo(unitGroup);
        });
        unitGroup.addTo(map);
        layersRef.current.units = unitGroup;
      }

      // 7. Active Incident Alerts Pins
      if (alerts.length > 0) {
        const alertGroup = L.layerGroup();
        alerts.forEach((alert) => {
          if (!alert.coordinates) return;
          const isCritical = alert.severity === 'CRITICAL';

          const icon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div class="relative cursor-pointer">
                <div class="w-6 h-6 rounded-full ${isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-neutral-900'} shadow-lg flex items-center justify-center text-xs font-bold ring-2 ring-white">
                  !
                </div>
                ${isCritical ? '<span class="absolute -inset-1 rounded-full bg-red-500 opacity-50 animate-ping"></span>' : ''}
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker([alert.coordinates[1], alert.coordinates[0]], { icon });
          marker.bindPopup(`
            <div class="p-2 font-sans max-w-xs">
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.2 text-[10px] font-mono rounded ${isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}">
                  ${alert.severity}
                </span>
                <span class="text-[10px] text-mute font-mono">${alert.timestamp}</span>
              </div>
              <div class="text-sm font-semibold text-ink mt-1">${alert.title}</div>
              <p class="text-xs text-body mt-1 leading-normal">${alert.description}</p>
              ${alert.action_required ? `<div class="mt-2 text-[11px] p-1.5 bg-neutral-100 rounded text-neutral-800 font-mono"><strong>Action:</strong> ${alert.action_required}</div>` : ''}
            </div>
          `);
          marker.addTo(alertGroup);
        });
        alertGroup.addTo(map);
        layersRef.current.alerts = alertGroup;
      }
    });
  }, [
    mapLoaded,
    zones,
    hospitals,
    shelters,
    units,
    roads,
    alerts,
    selectedZone,
    visibleLayers,
    floodCorridor,
    isroStatus,
  ]);

  // Handle fly-to coordinate focus
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !focusedCoordinates) return;
    mapInstanceRef.current.flyTo([focusedCoordinates[1], focusedCoordinates[0]], 14.5, {
      duration: 1.2,
    });
  }, [focusedCoordinates, mapLoaded]);

  // Recenter helper
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const lat = centerCoordinates ? centerCoordinates[1] : 23.038;
    const lon = centerCoordinates ? centerCoordinates[0] : 72.575;
    mapInstanceRef.current.flyTo([lat, lon], zoomLevel, { duration: 0.8 });
  };

  return (
    <div className="relative w-full h-[620px] lg:h-[720px] rounded-lg border border-hairline overflow-hidden bg-canvas shadow-sm">
      {/* Map Target Div */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-canvas/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-mono text-mute uppercase tracking-wider">
            Initializing GIS Cartographic Canvas...
          </p>
        </div>
      )}

      {/* Top Left: Quick GIS Legend & Controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2 max-w-[310px]">
        {/* Layer Toggles */}
        <div className="bg-canvas-elevated/95 backdrop-blur border border-hairline rounded-md p-2.5 shadow-sm text-xs space-y-1.5 font-mono">
          <div className="text-[11px] uppercase tracking-wider text-mute font-semibold flex items-center justify-between">
            <span>GIS Map Layers</span>
            <button
              onClick={handleRecenter}
              title="Reset View"
              className="text-[10px] text-link hover:underline cursor-pointer"
            >
              Recenter
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
            {/* Base Map Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-body hover:text-ink">
              <input
                type="checkbox"
                checked={visibleLayers.baseMap}
                onChange={(e) =>
                  setVisibleLayers((prev) => ({ ...prev, baseMap: e.target.checked }))
                }
                className="rounded text-primary focus:ring-link h-3 w-3"
              />
              <span>Carto Base</span>
            </label>

            {/* ISRO Bhuvan Satellite Layer Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-body hover:text-ink font-semibold">
              <input
                type="checkbox"
                checked={visibleLayers.isroSatellite}
                onChange={(e) =>
                  setVisibleLayers((prev) => ({ ...prev, isroSatellite: e.target.checked }))
                }
                className="rounded text-primary focus:ring-link h-3 w-3"
              />
              <span className="text-link">ISRO Satellite</span>
            </label>

            {/* Flood Extent */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-body hover:text-ink">
              <input
                type="checkbox"
                checked={visibleLayers.floodExtent}
                onChange={(e) =>
                  setVisibleLayers((prev) => ({ ...prev, floodExtent: e.target.checked }))
                }
                className="rounded text-primary focus:ring-link h-3 w-3"
              />
              <span>Flood Mask</span>
            </label>

            {/* Risk Zones */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-body hover:text-ink">
              <input
                type="checkbox"
                checked={visibleLayers.riskZones}
                onChange={(e) =>
                  setVisibleLayers((prev) => ({ ...prev, riskZones: e.target.checked }))
                }
                className="rounded text-primary focus:ring-link h-3 w-3"
              />
              <span>Risk Zones</span>
            </label>

            {/* Critical Facilities */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-body hover:text-ink">
              <input
                type="checkbox"
                checked={visibleLayers.facilities}
                onChange={(e) =>
                  setVisibleLayers((prev) => ({ ...prev, facilities: e.target.checked }))
                }
                className="rounded text-primary focus:ring-link h-3 w-3"
              />
              <span>Facilities</span>
            </label>

            {/* Egress Roads */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-body hover:text-ink">
              <input
                type="checkbox"
                checked={visibleLayers.roads}
                onChange={(e) =>
                  setVisibleLayers((prev) => ({ ...prev, roads: e.target.checked }))
                }
                className="rounded text-primary focus:ring-link h-3 w-3"
              />
              <span>Egress Roads</span>
            </label>

            {/* Emergency Units */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-body hover:text-ink col-span-2">
              <input
                type="checkbox"
                checked={visibleLayers.units}
                onChange={(e) =>
                  setVisibleLayers((prev) => ({ ...prev, units: e.target.checked }))
                }
                className="rounded text-primary focus:ring-link h-3 w-3"
              />
              <span>Emergency Units / Boats</span>
            </label>
          </div>
        </div>

        {/* Severity Legend */}
        <div className="bg-canvas-elevated/90 backdrop-blur border border-hairline rounded-md px-2.5 py-2 shadow-sm text-[11px] font-mono flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-ink">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block"></span> Critical
          </span>
          <span className="flex items-center gap-1 text-ink">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span> High
          </span>
          <span className="flex items-center gap-1 text-ink">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-300 inline-block"></span> Mod
          </span>
          <span className="flex items-center gap-1 text-ink">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block"></span> Flood
          </span>
        </div>

        {/* ISRO Telemetry Status Widget */}
        <div className="bg-canvas-elevated/95 backdrop-blur border border-hairline rounded-md p-2 shadow-sm text-xs font-mono space-y-1">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-mute font-semibold">
              ISRO Bhuvan EO
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                isroStatus?.is_authenticated
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {isroStatus?.data_classification ?? 'ISRO WMS'}
            </span>
          </div>
          <div className="text-[10px] text-body flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="truncate">Layer: {isroStatus?.active_layer ?? 'india3'}</span>
          </div>
          <div className="text-[9px] text-mute flex items-center justify-between pt-0.5 border-t border-hairline">
            <span>Area: {incidentName}</span>
            <span>{isRealBackendDataset ? '✓ LIVE' : '⚠ DEMO'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Floating Bar: Active Zone Hint */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none flex justify-center">
        <div className="bg-canvas-elevated/95 backdrop-blur border border-hairline rounded-full px-4 py-1.5 shadow-sm text-xs font-mono text-body flex items-center gap-2 pointer-events-auto">
          {selectedZone ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>
                Selected: <strong>{selectedZone.zone_name}</strong> ·{' '}
                <span className="text-mute">{selectedZone.submerged_percent.toFixed(1)}% Submerged</span>
              </span>
            </>
          ) : (
            <>
              <span className="text-mute">💡 Click any zone on the map to inspect granular impact and response gaps</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
