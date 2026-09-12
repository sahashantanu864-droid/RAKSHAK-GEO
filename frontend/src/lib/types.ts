/**
 * RAKSHAK-GEO / CityShield GIS
 * Core Domain & Operational Types for Frontend Command Center
 */

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'UNAFFECTED';

export type ResourceCounts = {
  ambulances: number;
  rescue_boats: number;
  food_packets: number;
  medical_kits: number;
  personnel: number;
};

export type WardZone = {
  zone_id: string;
  zone_name: string;
  total_area_sq_km: number;
  submerged_area_sq_km: number;
  submerged_percent: number;
  population: number;
  population_at_risk: number;
  severity: SeverityLevel;
  severity_score: number; // 0.0 - 10.0
  priority: number; // 1 - 10
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
  demand: ResourceCounts;
  local_capacity: ResourceCounts;
  unmet_gap: ResourceCounts;
  inundated_buildings_count: number;
  critical_facilities: string[];
  last_updated: string;
};

export type HospitalMarker = {
  hospital_id: string;
  name: string;
  city_id: string;
  zone_id: string;
  bed_capacity: number;
  icu_beds: number;
  has_emergency_ward: boolean;
  status: 'OPERATIONAL' | 'WATER_INGRESS' | 'EVACUATING' | 'CRITICAL';
  coordinates: [number, number]; // [lon, lat]
};

export type ShelterMarker = {
  shelter_id: string;
  name: string;
  city_id: string;
  zone_id: string;
  occupancy_capacity: number;
  current_occupancy: number;
  has_generator: boolean;
  potable_water_liters: number;
  status: 'OPEN' | 'NEAR_CAPACITY' | 'FULL';
  coordinates: [number, number]; // [lon, lat]
};

export type EmergencyUnitMarker = {
  unit_id: string;
  callsign: string;
  type: 'AMBULANCE' | 'RESCUE_BOAT' | 'NDRF_TEAM' | 'SUPPLY_TRUCK';
  status: 'STATIONED' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE';
  zone_id: string;
  assigned_mission?: string;
  coordinates: [number, number]; // [lon, lat]
};

export type RoadSegmentMarker = {
  road_id: string;
  name: string;
  road_type: string;
  is_evacuation_route: boolean;
  status: 'OPEN' | 'WATERLOGGED' | 'SUBMERGED_CLOSED' | 'CONGESTED';
  water_depth_cm?: number;
  coordinates: [number, number][]; // LineString coords [lon, lat]
};

export type IncidentAlert = {
  id: string;
  title: string;
  severity: SeverityLevel;
  category: 'BREACH' | 'RESCUE' | 'ROAD_BLOCK' | 'HOSPITAL' | 'SHELTER' | 'RESOURCE_SHORTAGE';
  zone_id: string;
  zone_name: string;
  timestamp: string;
  description: string;
  coordinates?: [number, number];
  action_required?: string;
};

export type OperationalSummary = {
  incident_id: string;
  city_name: string;
  timestamp: string;
  critical_zones_count: number;
  total_zones_count: number;
  population_at_risk: number;
  total_population: number;
  active_shelters_count: number;
  total_shelters_count: number;
  total_shelter_capacity: number;
  current_shelter_occupancy: number;
  depot_resources: ResourceCounts;
  allocated_resources: ResourceCounts;
  total_unmet_gaps: ResourceCounts;
  flood_extent_sq_km: number;
};

export type FloodIncident = {
  incident_id: string;
  name: string;
  short_label: string;
  region: string;
  state: string;
  country: string;
  status: 'ACTIVE_FLOOD' | 'MONITORING' | 'RECOVERY' | 'WARNING';
  severity: SeverityLevel;
  severity_score: number;
  center_coordinates: [number, number]; // [lon, lat]
  zoom_level: number;
  is_real_backend_dataset: boolean;
  data_source: string;
  summary: OperationalSummary;
  zones: WardZone[];
  flood_corridor: any;
  hospitals: HospitalMarker[];
  shelters: ShelterMarker[];
  units: EmergencyUnitMarker[];
  roads: RoadSegmentMarker[];
  alerts: IncidentAlert[];
};

export type ISROServiceStatus = {
  service: string;
  provider: string;
  portal_url: string;
  wms_endpoint: string;
  active_layer: string;
  is_authenticated: boolean;
  attribution: string;
  data_classification: string;
  supported_layers: {
    id: string;
    name: string;
    type: string;
    wms_url: string;
    layer_name: string;
  }[];
  security_note: string;
};
