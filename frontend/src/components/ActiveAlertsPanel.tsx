import React, { useState } from 'react';
import type { IncidentAlert } from '../lib/types';
import { Card } from './ui/Card';

interface ActiveAlertsPanelProps {
  alerts: IncidentAlert[];
  onSelectAlert?: (alert: IncidentAlert) => void;
}

export const ActiveAlertsPanel: React.FC<ActiveAlertsPanelProps> = ({
  alerts,
  onSelectAlert,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'ROAD_BLOCK' | 'RESOURCE_SHORTAGE' | 'SHELTER'>('ALL');

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'ALL') return true;
    if (filter === 'CRITICAL') return alert.severity === 'CRITICAL';
    return alert.category === filter;
  });

  return (
    <Card className="border border-hairline bg-canvas-elevated shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <h3 className="text-sm font-semibold text-ink uppercase tracking-wider font-mono">
            Active Tactical Alerts
          </h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-hairline text-mute">
          {alerts.length} Reported
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto border-b border-hairline-soft text-[11px] font-mono">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-2 py-1 rounded transition-colors cursor-pointer ${
            filter === 'ALL' ? 'bg-primary text-on-primary font-semibold' : 'text-body hover:text-ink hover:bg-hairline-soft'
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('CRITICAL')}
          className={`px-2 py-1 rounded transition-colors cursor-pointer ${
            filter === 'CRITICAL'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-red-700 hover:bg-red-50'
          }`}
        >
          Critical ({alerts.filter((a) => a.severity === 'CRITICAL').length})
        </button>
        <button
          onClick={() => setFilter('ROAD_BLOCK')}
          className={`px-2 py-1 rounded transition-colors cursor-pointer ${
            filter === 'ROAD_BLOCK'
              ? 'bg-primary text-on-primary font-semibold'
              : 'text-body hover:text-ink hover:bg-hairline-soft'
          }`}
        >
          Roads
        </button>
        <button
          onClick={() => setFilter('RESOURCE_SHORTAGE')}
          className={`px-2 py-1 rounded transition-colors cursor-pointer ${
            filter === 'RESOURCE_SHORTAGE'
              ? 'bg-primary text-on-primary font-semibold'
              : 'text-body hover:text-ink hover:bg-hairline-soft'
          }`}
        >
          Shortages
        </button>
        <button
          onClick={() => setFilter('SHELTER')}
          className={`px-2 py-1 rounded transition-colors cursor-pointer ${
            filter === 'SHELTER'
              ? 'bg-primary text-on-primary font-semibold'
              : 'text-body hover:text-ink hover:bg-hairline-soft'
          }`}
        >
          Shelters
        </button>
      </div>

      {/* Alert Feed */}
      <div className="space-y-2.5 py-3 flex-1 overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-mute font-mono">
            No active alerts in this category.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';

            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert && onSelectAlert(alert)}
                className={`p-3 rounded border transition-all cursor-pointer ${
                  isCritical
                    ? 'border-red-300 bg-red-50/40 hover:bg-red-50/80'
                    : isHigh
                    ? 'border-amber-300 bg-amber-50/30 hover:bg-amber-50/70'
                    : 'border-hairline bg-canvas hover:bg-hairline-soft'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                        isCritical
                          ? 'bg-red-600 text-white'
                          : isHigh
                          ? 'bg-amber-600 text-white'
                          : 'bg-neutral-600 text-white'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-mono text-mute px-1.5 py-0.5 bg-canvas-elevated rounded border border-hairline-soft">
                      {alert.category}
                    </span>
                    <span className="text-[11px] font-mono text-body font-medium">
                      {alert.zone_name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-mute shrink-0">{alert.timestamp}</span>
                </div>

                <h4 className="text-xs font-semibold text-ink mt-1.5 leading-snug">{alert.title}</h4>
                <p className="text-[11px] text-body mt-1 leading-relaxed">{alert.description}</p>

                {alert.action_required && (
                  <div className="mt-2 text-[10px] p-1.5 bg-canvas-elevated/90 rounded border border-hairline-soft font-mono text-neutral-800 flex items-start gap-1">
                    <span className="text-link font-bold">ACTION:</span>
                    <span>{alert.action_required}</span>
                  </div>
                )}

                {alert.coordinates && (
                  <div className="mt-2 flex justify-end">
                    <span className="text-[10px] font-mono text-link hover:underline inline-flex items-center gap-1">
                      Locate on Map ↗
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
