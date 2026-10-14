import React from 'react';
import type { WardZone } from '../lib/types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface ZoneDetailPanelProps {
  zone: WardZone;
  onClose: () => void;
  onLaunchSimulation?: (zoneId: string) => void;
}

export const ZoneDetailPanel: React.FC<ZoneDetailPanelProps> = ({
  zone,
  onClose,
  onLaunchSimulation,
}) => {
  const isCritical = zone.severity === 'CRITICAL';
  const isHigh = zone.severity === 'HIGH';

  return (
    <Card className="border border-hairline bg-canvas-elevated shadow-md h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-hairline pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                isCritical
                  ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                  : isHigh
                  ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                  : 'bg-blue-500/15 text-link border border-blue-500/30'
              }`}
            >
              {zone.severity} · SCORE {zone.severity_score}/10
            </span>
            <span className="text-xs font-mono text-mute">Priority #{zone.priority}</span>
          </div>
          <h3 className="text-base font-semibold text-ink leading-tight">{zone.zone_name}</h3>
          <p className="text-[11px] font-mono text-mute mt-0.5">ID: {zone.zone_id}</p>
        </div>
        <button
          onClick={onClose}
          className="text-mute hover:text-ink p-1 rounded-md hover:bg-hairline-soft cursor-pointer text-sm font-mono flex items-center justify-center"
          title="Close panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="space-y-4 py-3 flex-1 overflow-y-auto pr-1">
        {/* Spatial Inundation Summary */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-mute mb-2">
            Spatial Impact & Exposure
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-canvas p-2.5 rounded border border-hairline-soft">
              <div className="text-[11px] text-mute font-mono">Flooded Area</div>
              <div className="text-lg font-bold text-ink font-mono mt-0.5">
                {zone.submerged_area_sq_km.toFixed(2)}{' '}
                <span className="text-xs font-normal text-mute">/ {zone.total_area_sq_km.toFixed(1)} km²</span>
              </div>
              <div className="text-[11px] font-semibold text-red-600 font-mono mt-0.5">
                {zone.submerged_percent.toFixed(1)}% submerged
              </div>
            </div>

            <div className="bg-canvas p-2.5 rounded border border-hairline-soft">
              <div className="text-[11px] text-mute font-mono">Population at Risk</div>
              <div className="text-lg font-bold text-ink font-mono mt-0.5">
                {zone.population_at_risk.toLocaleString()}
              </div>
              <div className="text-[11px] text-mute font-mono mt-0.5">
                of {zone.population.toLocaleString()} residents
              </div>
            </div>
          </div>
        </div>

        {/* Building Inundation */}
        <div className="bg-canvas p-2.5 rounded border border-hairline-soft flex items-center justify-between">
          <div className="text-xs">
            <span className="text-mute font-mono">Inundated Structures:</span>{' '}
            <strong className="text-ink font-mono">{zone.inundated_buildings_count} buildings</strong>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200 text-neutral-800">
            GIS Intersected
          </span>
        </div>

        {/* Resource Allocation & Net Unmet Gaps */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-mute mb-2 flex items-center justify-between">
            <span>Response Resource Gap Analysis</span>
            <span className="text-[10px] text-mute lowercase">(max(0, demand - capacity))</span>
          </div>

          <div className="border border-hairline rounded overflow-hidden text-xs">
            <table className="w-full text-left font-mono">
              <thead className="bg-canvas text-mute text-[10px] uppercase border-b border-hairline">
                <tr>
                  <th className="py-1.5 px-2">Resource</th>
                  <th className="py-1.5 px-2">Gross Demand</th>
                  <th className="py-1.5 px-2">Local Cap</th>
                  <th className="py-1.5 px-2 text-right">Net Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft text-[11px]">
                <tr>
                  <td className="py-1.5 px-2 font-medium text-ink">Ambulances</td>
                  <td className="py-1.5 px-2 text-body">{zone.demand.ambulances}</td>
                  <td className="py-1.5 px-2 text-body">{zone.local_capacity.ambulances}</td>
                  <td className={`py-1.5 px-2 text-right font-bold ${zone.unmet_gap.ambulances > 0 ? 'text-red-600' : 'text-link'}`}>
                    {zone.unmet_gap.ambulances > 0 ? `+${zone.unmet_gap.ambulances}` : '0'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-medium text-ink">Rescue Boats</td>
                  <td className="py-1.5 px-2 text-body">{zone.demand.rescue_boats}</td>
                  <td className="py-1.5 px-2 text-body">{zone.local_capacity.rescue_boats}</td>
                  <td className={`py-1.5 px-2 text-right font-bold ${zone.unmet_gap.rescue_boats > 0 ? 'text-red-600' : 'text-link'}`}>
                    {zone.unmet_gap.rescue_boats > 0 ? `+${zone.unmet_gap.rescue_boats}` : '0'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-medium text-ink">Food Packets</td>
                  <td className="py-1.5 px-2 text-body">{zone.demand.food_packets}</td>
                  <td className="py-1.5 px-2 text-body">{zone.local_capacity.food_packets}</td>
                  <td className={`py-1.5 px-2 text-right font-bold ${zone.unmet_gap.food_packets > 0 ? 'text-amber-700' : 'text-link'}`}>
                    {zone.unmet_gap.food_packets > 0 ? `+${zone.unmet_gap.food_packets}` : '0'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-medium text-ink">Medical Kits</td>
                  <td className="py-1.5 px-2 text-body">{zone.demand.medical_kits}</td>
                  <td className="py-1.5 px-2 text-body">{zone.local_capacity.medical_kits}</td>
                  <td className={`py-1.5 px-2 text-right font-bold ${zone.unmet_gap.medical_kits > 0 ? 'text-amber-700' : 'text-link'}`}>
                    {zone.unmet_gap.medical_kits > 0 ? `+${zone.unmet_gap.medical_kits}` : '0'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-medium text-ink">Personnel</td>
                  <td className="py-1.5 px-2 text-body">{zone.demand.personnel}</td>
                  <td className="py-1.5 px-2 text-body">{zone.local_capacity.personnel}</td>
                  <td className={`py-1.5 px-2 text-right font-bold ${zone.unmet_gap.personnel > 0 ? 'text-red-600' : 'text-link'}`}>
                    {zone.unmet_gap.personnel > 0 ? `+${zone.unmet_gap.personnel}` : '0'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Facilities Affected */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-mute mb-1.5">
            Key Infrastructure & Alerts
          </div>
          <div className="space-y-1.5">
            {zone.critical_facilities.map((fac, idx) => (
              <div
                key={idx}
                className="text-xs bg-canvas p-2 rounded border border-hairline-soft text-body flex items-start gap-2"
              >
                <span className="text-amber-600 mt-0.5">•</span>
                <span>{fac}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-hairline flex items-center gap-2">
        <Button
          variant="primary"
          className="w-full text-xs font-mono py-2"
          onClick={() => {
            if (onLaunchSimulation) {
              onLaunchSimulation(zone.zone_id);
            } else {
              window.location.href = `/simulation?zone=${zone.zone_id}`;
            }
          }}
        >
          Model Reinforcement in What-If →
        </Button>
      </div>
    </Card>
  );
};
