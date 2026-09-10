import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { fetchTimeline } from '../lib/api';

type TimelinePoint = {
  timestamp: string;
  global_response_gap_severity: number;
  flood_extent: { area: number; area_unit: string };
  aggregated_gaps: Record<string, number>;
};

const SeverityBadge: React.FC<{ severity: number }> = ({ severity }) => {
  const color =
    severity === 0
      ? { background: '#d3e5ff', color: '#0761d1', label: 'Nominal' }
      : severity <= 2
      ? { background: '#ffefcf', color: '#ab570a', label: 'Moderate' }
      : { background: '#fee2e2', color: '#c50000', label: 'Critical' };

  return (
    <span
      className="px-2 py-0.5 text-xs font-mono rounded"
      style={{ background: color.background, color: color.color }}
    >
      {color.label} ({severity})
    </span>
  );
};

export const Timeline: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTimeline()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="border border-hairline rounded-md p-4 bg-canvas-elevated">
        <p className="text-sm" style={{ color: '#c50000' }}>
          <strong>Error:</strong> {error}. Ensure backend is running on{' '}
          <code className="font-mono text-xs bg-hairline-soft px-1.5 py-0.5 rounded">http://127.0.0.1:8000</code>.
        </p>
      </div>
    );
  }

  const observations: TimelinePoint[] = data?.observations ?? data?.time_points ?? [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-mono uppercase tracking-widest text-mute mb-2">Temporal Model</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2" style={{ letterSpacing: '-0.04em' }}>
          Future Response Gap Timeline
        </h1>
        <p className="text-body max-w-2xl text-sm leading-relaxed">
          Chronological snapshots of flood extents and predicted resource gaps across defined observation windows.
        </p>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-md border border-hairline bg-canvas-elevated animate-pulse" />
          ))}
        </div>
      ) : observations.length === 0 ? (
        <Card>
          <p className="text-body text-sm">
            No timeline observations found. The backend returned an empty dataset — check the
            <code className="font-mono text-xs bg-hairline-soft px-1.5 py-0.5 mx-1 rounded">/api/v1/future-gap/sample-payload</code>
            endpoint.
          </p>
          <details className="mt-4">
            <summary className="text-xs text-mute cursor-pointer">Raw response</summary>
            <pre className="mt-2 text-xs text-body bg-canvas p-3 rounded border border-hairline overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-5 top-0 bottom-0 w-px bg-hairline"
            aria-hidden="true"
          />

          <div className="space-y-6 pl-14">
            {observations.map((point, index) => {
              const ts = new Date(point.timestamp);
              const isFirst = index === 0;
              return (
                <div key={point.timestamp} className="relative">
                  {/* Dot */}
                  <div
                    className="absolute -left-9 flex items-center justify-center w-8 h-8 rounded-full border-2 border-canvas bg-canvas-elevated shadow-sm"
                    style={{ borderColor: point.global_response_gap_severity > 0 ? '#ee0000' : '#0070f3' }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: point.global_response_gap_severity > 0 ? '#ee0000' : '#0070f3' }}
                    />
                  </div>

                  <Card elevated={isFirst} className={isFirst ? 'border-ink' : ''}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <p className="text-xs font-mono text-mute">
                          {ts.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                          {ts.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                        </p>
                        <h3 className="font-semibold text-ink mt-0.5">Observation T+{index * 6}h</h3>
                      </div>
                      <SeverityBadge severity={point.global_response_gap_severity} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-mono uppercase tracking-wider text-mute mb-1">Flood Area</p>
                        <p className="font-semibold text-ink">
                          {point.flood_extent?.area?.toFixed(2) ?? '—'}{' '}
                          <span className="text-xs text-mute font-normal">{point.flood_extent?.area_unit}</span>
                        </p>
                      </div>

                      {Object.entries(point.aggregated_gaps ?? {}).map(([resource, gap]) => (
                        <div key={resource}>
                          <p className="text-xs font-mono uppercase tracking-wider text-mute mb-1">{resource}</p>
                          <p
                            className="font-semibold"
                            style={{ color: (gap as number) > 0 ? '#ab570a' : '#0070f3' }}
                          >
                            {(gap as number) > 0 ? `+${gap}` : gap}{' '}
                            <span className="text-xs font-normal text-mute">needed</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
