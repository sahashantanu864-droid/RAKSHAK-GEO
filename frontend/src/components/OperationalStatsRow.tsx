import React from 'react';
import type { OperationalSummary } from '../lib/types';
import { Card } from './ui/Card';

interface OperationalStatsRowProps {
  summary: OperationalSummary;
  backendOnline: boolean;
}

export const OperationalStatsRow: React.FC<OperationalStatsRowProps> = ({
  summary,
  backendOnline,
}) => {
  const shelterOccupancyRate = Math.round(
    (summary.current_shelter_occupancy / (summary.total_shelter_capacity || 1)) * 100
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Critical Zones */}
      <Card className="relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-mute mb-2">
          <span>Critical Impact Zones</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-600 font-bold border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            ACTIVE FLOOD
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-ink tracking-tight font-sans">
            {summary.critical_zones_count}
          </span>
          <span className="text-sm font-mono text-mute">
            / {summary.total_zones_count} Wards Monitored
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-body border-t border-hairline pt-2 font-mono">
          <span className="text-mute">Detected Inundation:</span>
          <span className="font-semibold text-ink">{summary.flood_extent_sq_km.toFixed(2)} km²</span>
        </div>
      </Card>

      {/* 2. Population at Risk */}
      <Card className="relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-mute mb-2">
          <span>Population at Risk</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
            HIGH EXPOSURE
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-ink tracking-tight font-sans">
            {summary.population_at_risk.toLocaleString()}
          </span>
          <span className="text-sm font-mono text-mute">
            / {(summary.total_population / 1000).toFixed(0)}k Residents
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-body border-t border-hairline pt-2 font-mono">
          <span className="text-mute">Exposure Rate:</span>
          <span className="font-semibold text-amber-700">
            {((summary.population_at_risk / summary.total_population) * 100).toFixed(1)}% of Sector
          </span>
        </div>
      </Card>

      {/* 3. Emergency Shelters */}
      <Card className="relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-mute mb-2">
          <span>Evacuation Shelters</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-link border border-blue-500/20">
            {summary.active_shelters_count} OPERATIONAL
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-ink tracking-tight font-sans">
            {summary.current_shelter_occupancy.toLocaleString()}
          </span>
          <span className="text-sm font-mono text-mute">
            / {summary.total_shelter_capacity.toLocaleString()} Cap ({shelterOccupancyRate}%)
          </span>
        </div>
        {/* Occupancy bar */}
        <div className="mt-3 pt-2 border-t border-hairline">
          <div className="w-full bg-hairline-soft h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                shelterOccupancyRate > 85 ? 'bg-red-600' : shelterOccupancyRate > 65 ? 'bg-amber-500' : 'bg-link'
              }`}
              style={{ width: `${Math.min(shelterOccupancyRate, 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 4. Emergency Stockpiles & Logistics */}
      <Card className="relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-mute mb-2">
          <span>Available Depots</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-hairline">
            {backendOnline ? 'LIVE INVENTORY' : 'SEED DATA'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
          <div className="bg-canvas border border-hairline-soft rounded p-1.5">
            <div className="text-lg font-bold text-ink font-mono">{summary.depot_resources.ambulances}</div>
            <div className="text-[10px] font-mono text-mute uppercase">Amb</div>
          </div>
          <div className="bg-canvas border border-hairline-soft rounded p-1.5">
            <div className="text-lg font-bold text-ink font-mono">{summary.depot_resources.rescue_boats}</div>
            <div className="text-[10px] font-mono text-mute uppercase">Boats</div>
          </div>
          <div className="bg-canvas border border-hairline-soft rounded p-1.5">
            <div className="text-lg font-bold text-ink font-mono">{summary.depot_resources.personnel}</div>
            <div className="text-[10px] font-mono text-mute uppercase">Rescuers</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-body border-t border-hairline pt-1.5 font-mono">
          <span className="text-mute">Unmet Net Gaps:</span>
          <span className="text-red-600 font-semibold">
            {summary.total_unmet_gaps.ambulances} Amb · {summary.total_unmet_gaps.rescue_boats} Boats
          </span>
        </div>
      </Card>
    </div>
  );
};
