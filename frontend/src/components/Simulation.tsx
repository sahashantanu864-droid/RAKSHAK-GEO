import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { runWhatIfSimulation } from '../lib/api';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

type ResourceInput = {
  label: string;
  resourceId: string;
  defaultValue: number;
};

const RESOURCE_INPUTS: ResourceInput[] = [
  { label: 'Ambulances', resourceId: 'ambulance', defaultValue: 5 },
  { label: 'Rescue Boats', resourceId: 'rescue_boat', defaultValue: 10 },
  { label: 'Medical Kits', resourceId: 'medical_kit', defaultValue: 200 },
  { label: 'Food Packets', resourceId: 'food_packet', defaultValue: 500 },
];

export const Simulation: React.FC = () => {
  const [basePayload, setBasePayload] = useState<any>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/what-if/sample-payload`)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setBasePayload(data);
        // Pre-seed defaults from sample payload if stockpile_items exists
        const defaults: Record<string, number> = {};
        RESOURCE_INPUTS.forEach((r) => {
          defaults[r.resourceId] = r.defaultValue;
        });
        setOverrides(defaults);
      })
      .catch((err) => setError(err.message))
      .finally(() => setFetching(false));
  }, []);

  const handleSimulate = async () => {
    if (!basePayload) return;
    setLoading(true);
    setError('');
    try {
      // Build the simulation payload by deep-merging overrides
      const payload = {
        ...basePayload,
        stockpile_overrides: Object.entries(overrides).map(([resource_id, available_quantity]) => ({
          resource_id,
          available_quantity,
        })),
      };
      const data = await runWhatIfSimulation(payload);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fulfillmentColor = (shift: number) =>
    shift >= 0 ? { color: '#0070f3' } : { color: '#ee0000' };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-mono uppercase tracking-widest text-mute mb-2">Decision Engine</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink mb-2" style={{ letterSpacing: '-0.04em' }}>
          What-If Simulation
        </h1>
        <p className="text-body max-w-2xl text-sm leading-relaxed">
          Modify resource stockpile constraints or zone conditions and immediately see how the deterministic allocation solver shifts — without touching the baseline.
        </p>
      </header>

      {error && (
        <div className="border border-hairline rounded-md p-4 bg-canvas-elevated">
          <p className="text-sm" style={{ color: '#c50000' }}>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {fetching ? (
        <div className="text-sm text-mute animate-pulse">Loading sample payload from backend...</div>
      ) : !basePayload ? (
        <div className="border border-hairline rounded-md p-6 bg-canvas-elevated text-body text-sm">
          Could not load sample payload. Ensure the FastAPI backend is running on{' '}
          <code className="font-mono text-xs bg-hairline-soft px-1.5 py-0.5 rounded">http://127.0.0.1:8000</code>.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Control panel */}
          <div className="col-span-1 lg:col-span-4 space-y-4">
            <Card>
              <p className="text-xs font-mono uppercase tracking-widest text-mute mb-4">Stockpile Overrides</p>
              <div className="space-y-4">
                {RESOURCE_INPUTS.map(({ label, resourceId }) => (
                  <Input
                    key={resourceId}
                    label={label}
                    type="number"
                    min={0}
                    value={overrides[resourceId] ?? ''}
                    onChange={(e) =>
                      setOverrides((prev) => ({
                        ...prev,
                        [resourceId]: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-hairline">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleSimulate}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      Simulating…
                    </span>
                  ) : (
                    'Run Simulation'
                  )}
                </Button>
              </div>
            </Card>

            {result && (
              <Card>
                <p className="text-xs font-mono uppercase tracking-widest text-mute mb-2">Overall Shift</p>
                <p
                  className="text-3xl font-semibold"
                  style={fulfillmentColor(result.overall_fulfillment_shift)}
                >
                  {result.overall_fulfillment_shift > 0 ? '+' : ''}
                  {(result.overall_fulfillment_shift * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-body mt-2 leading-relaxed">{result.narrative_verdict}</p>
              </Card>
            )}
          </div>

          {/* Results panel */}
          <div className="col-span-1 lg:col-span-8">
            {result ? (
              <Card className="h-full">
                <div className="flex items-center justify-between border-b border-hairline pb-4 mb-6">
                  <h3 className="font-semibold text-ink">Resource Deltas</h3>
                  <span
                    className="px-2 py-0.5 text-xs font-mono rounded border border-hairline"
                    style={{
                      background: result.overall_fulfillment_shift >= 0 ? '#d3e5ff' : '#ffefcf',
                      color: result.overall_fulfillment_shift >= 0 ? '#0761d1' : '#ab570a',
                    }}
                  >
                    {result.overall_fulfillment_shift >= 0 ? '↑ Improved' : '↓ Reduced'} coverage
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-hairline">
                        <th className="py-2 px-3 text-xs font-mono uppercase tracking-wider text-mute font-medium">Resource</th>
                        <th className="py-2 px-3 text-xs font-mono uppercase tracking-wider text-mute font-medium">Baseline</th>
                        <th className="py-2 px-3 text-xs font-mono uppercase tracking-wider text-mute font-medium">Simulated</th>
                        <th className="py-2 px-3 text-xs font-mono uppercase tracking-wider text-mute font-medium">Shift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparative_resource_deltas?.map((delta: any) => (
                        <tr key={delta.resource_id} className="border-b border-hairline-soft last:border-0">
                          <td className="py-3 px-3 font-mono text-xs text-ink">{delta.resource_id}</td>
                          <td className="py-3 px-3 text-body">{delta.baseline_stockpile ?? '—'}</td>
                          <td className="py-3 px-3 font-medium text-ink">{delta.simulated_stockpile ?? '—'}</td>
                          <td
                            className="py-3 px-3 font-semibold"
                            style={fulfillmentColor(delta.fulfillment_rate_shift ?? 0)}
                          >
                            {delta.fulfillment_rate_shift > 0 ? '+' : ''}
                            {((delta.fulfillment_rate_shift ?? 0) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {result.comparative_zone_deltas?.length > 0 && (
                  <>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-mute mt-6 mb-3 pt-4 border-t border-hairline">Zone-Level Changes</h4>
                    <div className="space-y-2">
                      {result.comparative_zone_deltas.map((zone: any) => (
                        <div
                          key={zone.zone_id}
                          className="flex items-center justify-between px-3 py-2 rounded border border-hairline-soft bg-canvas text-sm"
                        >
                          <span className="font-mono text-xs text-ink">{zone.zone_id}</span>
                          <span
                            className="font-medium text-xs"
                            style={fulfillmentColor(zone.fulfillment_shift ?? 0)}
                          >
                            {zone.fulfillment_shift > 0 ? '+' : ''}
                            {((zone.fulfillment_shift ?? 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            ) : (
              <div className="h-64 border border-dashed border-hairline rounded-md flex flex-col items-center justify-center text-center p-8 bg-canvas">
                <p className="text-mute text-sm">
                  Adjust the stockpile parameters and click <strong className="text-body">Run Simulation</strong> to see comparative deltas.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
