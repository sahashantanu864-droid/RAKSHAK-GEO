/**
 * RAKSHAK-GEO API Integration Layer
 * Connects to FastAPI backend with dynamic environment resolution and graceful fallbacks.
 */

/**
 * Dynamically resolves backend base URL:
 * 1. Honors PUBLIC_API_URL if configured in environment/build.
 * 2. In browser production (non-localhost), uses current origin to avoid mixed-content and port hardcoding.
 * 3. In local development on localhost/127.0.0.1, defaults to http://127.0.0.1:8000.
 */
export function getBackendBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.PUBLIC_API_URL) {
    const customUrl = (import.meta as any).env.PUBLIC_API_URL;
    return customUrl.endsWith('/') ? customUrl.slice(0, -1) : customUrl;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalhost) {
      return window.location.origin;
    }
  }

  return 'http://127.0.0.1:8000';
}

export const BACKEND_URL = getBackendBaseUrl();
export const API_V1 = `${BACKEND_URL}/api/v1`;

export type HealthStatus = {
  online: boolean;
  latencyMs?: number;
  version?: string;
  app?: string;
  environment?: string;
  timestamp: string;
};

/**
 * Actively checks backend health with an abort timeout
 */
export async function checkBackendHealth(timeoutMs = 2500): Promise<HealthStatus> {
  const start = performance.now();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${getBackendBaseUrl()}/api/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(id);
    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        latencyMs,
        version: data.version ?? '1.0.0',
        app: data.app ?? 'RAKSHAK-GEO',
        environment: data.environment ?? 'production',
        timestamp: new Date().toISOString(),
      };
    }
    return { online: false, timestamp: new Date().toISOString() };
  } catch {
    clearTimeout(id);
    return { online: false, timestamp: new Date().toISOString() };
  }
}

/**
 * City GIS Data Foundation
 */
export async function fetchCitySummary(cityId = 'AHMEDABAD') {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/city-data/summary?city_id=${encodeURIComponent(cityId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch city summary`);
  return res.json();
}

export async function fetchWards(cityId = 'AHMEDABAD') {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/city-data/wards?city_id=${encodeURIComponent(cityId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch wards`);
  return res.json();
}

export async function fetchHospitals(cityId = 'AHMEDABAD') {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/city-data/hospitals?city_id=${encodeURIComponent(cityId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch hospitals`);
  return res.json();
}

export async function fetchShelters(cityId = 'AHMEDABAD') {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/city-data/shelters?city_id=${encodeURIComponent(cityId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch shelters`);
  return res.json();
}

export async function fetchRoads(cityId = 'AHMEDABAD', evacuationOnly = false) {
  const res = await fetch(
    `${getBackendBaseUrl()}/api/v1/city-data/roads?city_id=${encodeURIComponent(cityId)}&evacuation_only=${evacuationOnly}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch roads`);
  return res.json();
}

export async function fetchDepotResources(cityId = 'AHMEDABAD') {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/city-data/resources?city_id=${encodeURIComponent(cityId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch depot resources`);
  return res.json();
}

/**
 * What-If Simulation Engine
 */
export async function fetchWhatIfSamplePayload() {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/what-if/sample-payload`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch sample what-if payload`);
  return res.json();
}

export async function runWhatIfSimulation(payload: any) {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/what-if/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Simulation error (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Future Response Gap Timeline
 */
export async function fetchTimelineSample() {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/future-gap/sample-payload`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch sample timeline payload`);
  return res.json();
}

export async function runTimelineProjection(payload: any) {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/future-gap/timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Timeline projection error (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Resource Optimization Engine
 */
export async function fetchOptimizationSample() {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/optimization/sample-payload`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch sample optimization payload`);
  return res.json();
}

export async function runOptimization(payload: any) {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/optimization/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Optimization error (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * ISRO Bhuvan Earth-Observation Telemetry & Proxy
 */
export async function fetchISROStatus(): Promise<any> {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/gis/isro/status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch ISRO status`);
  return res.json();
}

export function getISROWmsUrl(): string {
  return `${getBackendBaseUrl()}/api/v1/gis/isro/wms`;
}
