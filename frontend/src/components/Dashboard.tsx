import React, { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { fetchCitySummary } from '../lib/api';

type CityData = {
  total_wards?: number;
  total_buildings?: number;
  total_hospitals?: number;
  total_shelters?: number;
  total_roads?: number;
};

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // First ping health endpoint
    fetch('http://127.0.0.1:8000/api/health')
      .then((res) => {
        setBackendOnline(res.ok);
        return fetchCitySummary();
      })
      .then(setData)
      .catch(() => {
        setBackendOnline(false);
        // Still show the UI — just without live data
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="relative py-16 md:py-24 overflow-hidden">
        {/* Mesh gradient — layered radial gradients approximating the Geist hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 20% 40%, rgba(80,227,194,0.15) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 20%, rgba(121,40,202,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 50% 80%, rgba(0,112,243,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 border border-hairline rounded-full bg-canvas-elevated text-xs font-mono text-mute uppercase tracking-widest">
          <span
            className="w-1.5 h-1.5 rounded-full bg-success inline-block"
            style={{ backgroundColor: backendOnline === false ? '#ee0000' : '#0070f3' }}
          />
          {backendOnline === false ? 'Backend Offline' : 'RAKSHAK-GEO v1.0'}
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-ink" style={{ letterSpacing: '-0.06em' }}>
          CityShield Global
          <br />
          Intelligence
        </h1>
        <p className="text-lg text-body max-w-xl leading-relaxed">
          Real-time flood impact analysis, automated resource optimization, and predictive what-if scenarios — for emergency response coordinators.
        </p>
        <div className="flex gap-3 mt-8 flex-wrap">
          <Button variant="primary" size="lg" onClick={() => (window.location.href = '/simulation')}>
            Launch Simulator
          </Button>
          <Button variant="secondary" size="lg" onClick={() => (window.location.href = '/timeline')}>
            View Timeline
          </Button>
        </div>
      </header>

      {/* Backend status banner */}
      {backendOnline === false && (
        <div className="border border-hairline rounded-md p-4 bg-canvas-elevated">
          <p className="text-sm font-medium text-body">
            <span className="font-mono text-xs mr-2 px-1.5 py-0.5 rounded" style={{ background: '#ffefcf', color: '#ab570a' }}>
              OFFLINE
            </span>
            FastAPI backend is not running. Start it with{' '}
            <code className="font-mono text-xs bg-hairline-soft px-1.5 py-0.5 rounded">
              uvicorn app.main:app --host 127.0.0.1 --port 8000
            </code>{' '}
            from the <code className="font-mono text-xs bg-hairline-soft px-1.5 py-0.5 rounded">backend/</code> directory.
          </p>
        </div>
      )}

      {/* City Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-md border border-hairline bg-canvas-elevated animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-mute mb-4">City Overview</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Wards', value: data.total_wards },
                { label: 'Buildings', value: data.total_buildings },
                { label: 'Hospitals', value: data.total_hospitals },
                { label: 'Shelters', value: data.total_shelters },
              ].map(({ label, value }) => (
                <Card key={label}>
                  <p className="text-xs font-mono uppercase tracking-widest text-mute mb-2">{label}</p>
                  <p className="text-3xl font-semibold text-ink">{value ?? '—'}</p>
                </Card>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* Feature cards */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-mute mb-4">Operations</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card elevated className="group hover:border-ink transition-colors cursor-pointer" onClick={() => (window.location.href = '/simulation')}>
            <div className="text-2xl mb-4">⚡</div>
            <h3 className="font-semibold text-ink mb-1">What-If Simulation</h3>
            <p className="text-sm text-body leading-relaxed">
              Run counterfactual scenarios — cut stockpiles, add zones, destroy clinics — and instantly see optimized allocation shifts.
            </p>
            <p className="text-xs font-mono text-mute mt-4 group-hover:text-link transition-colors">
              /api/v1/what-if/simulate →
            </p>
          </Card>

          <Card elevated className="group hover:border-ink transition-colors cursor-pointer" onClick={() => (window.location.href = '/timeline')}>
            <div className="text-2xl mb-4">📈</div>
            <h3 className="font-semibold text-ink mb-1">Response Gap Timeline</h3>
            <p className="text-sm text-body leading-relaxed">
              Chronological view of evolving flood extents, demand projections, and resource fulfillment gaps across time horizons.
            </p>
            <p className="text-xs font-mono text-mute mt-4 group-hover:text-link transition-colors">
              /api/v1/future-gap/timeline →
            </p>
          </Card>

          <Card elevated className="hover:border-ink transition-colors">
            <div className="text-2xl mb-4">🗺️</div>
            <h3 className="font-semibold text-ink mb-1">GIS Impact Analysis</h3>
            <p className="text-sm text-body leading-relaxed">
              2D spatial intersection of flood extents against city ward boundaries, roads, and building footprints.
            </p>
            <p className="text-xs font-mono text-mute mt-4">
              /api/v1/gis/impact →
            </p>
          </Card>
        </div>
      </div>

      {/* Pipeline callout */}
      <Card className="md:col-span-2">
        <p className="text-xs font-mono uppercase tracking-widest text-mute mb-4">End-to-End Pipeline</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-body font-mono">
          {[
            'Satellite GeoTIFF',
            'NDWI Detection',
            'Water Masking',
            'GeoJSON Vector',
            'GIS Intersection',
            'Response Gap',
            'Resource Dispatch',
          ].map((step, i, arr) => (
            <React.Fragment key={step}>
              <span className="px-2.5 py-1 border border-hairline rounded bg-canvas-elevated text-xs text-ink">
                {step}
              </span>
              {i < arr.length - 1 && <span className="text-hairline">→</span>}
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
};
