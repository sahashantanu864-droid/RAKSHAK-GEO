import React, { useEffect, useState } from 'react';
import type { HealthStatus } from '../lib/api';
import type { FloodIncident } from '../lib/types';
import { Button } from './ui/Button';
import { IncidentSelector } from './IncidentSelector';

interface CommandHeaderProps {
  health: HealthStatus | null;
  onRefresh: () => void;
  refreshing: boolean;
  activeIncident: FloodIncident;
  incidents: FloodIncident[];
  onSelectIncident: (incident: FloodIncident) => void;
}

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  health,
  onRefresh,
  refreshing,
  activeIncident,
  incidents,
  onSelectIncident,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentUtc, setCurrentUtc] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentUtc(now.toUTCString().slice(17, 25) + ' UTC');
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isOnline = health?.online === true;

  return (
    <div className="border-b border-hairline pb-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Tactical Incident Selector & Operation Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-neutral-900 text-white tracking-widest">
              DISASTER COMMAND
            </span>
            <span className="text-xs font-mono text-mute">
              ID: <strong>{activeIncident.incident_id}</strong>
            </span>
            {activeIncident.is_real_backend_dataset ? (
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                LIVE POSTGIS BACKEND
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-neutral-200 text-neutral-700 border border-neutral-300">
                DEMO INCIDENT DATA
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <IncidentSelector
              incidents={incidents}
              activeIncident={activeIncident}
              onSelect={onSelectIncident}
            />
          </div>

          <p className="text-xs sm:text-sm text-body font-mono mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              DATASET: <strong>{activeIncident.data_source}</strong>
            </span>
            <span className="text-hairline">|</span>
            <span>
              COORDINATES: <strong>{activeIncident.center_coordinates[1].toFixed(3)}° N, {activeIncident.center_coordinates[0].toFixed(3)}° E</strong>
            </span>
            <span className="text-hairline">|</span>
            <span>
              CLOCK: <strong className="text-ink">{currentTime} IST</strong> ({currentUtc})
            </span>
          </p>
        </div>

        {/* Right: Operational Status, Health & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tactical Status Pill */}
          <div
            className={`px-3 py-1.5 rounded-md border text-xs font-mono flex items-center gap-2 ${
              activeIncident.status === 'ACTIVE_FLOOD'
                ? 'border-red-400 bg-red-50 text-red-800'
                : activeIncident.status === 'WARNING'
                ? 'border-amber-400 bg-amber-50 text-amber-800'
                : 'border-blue-300 bg-blue-50 text-blue-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeIncident.status === 'ACTIVE_FLOOD'
                  ? 'bg-red-600 animate-ping'
                  : activeIncident.status === 'WARNING'
                  ? 'bg-amber-600'
                  : 'bg-blue-600'
              }`}
            ></span>
            <span>
              STATUS: <strong>{activeIncident.status.replace('_', ' ')} (SEV {activeIncident.severity_score}/10)</strong>
            </span>
          </div>

          {/* Real Backend Status Indicator */}
          <div
            className={`px-3 py-1.5 rounded-md border text-xs font-mono flex items-center gap-2 ${
              isOnline
                ? 'border-blue-300 bg-blue-50/70 text-link'
                : 'border-hairline bg-canvas-elevated text-mute'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-link animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            <span>
              {isOnline ? (
                <>
                  SYSTEM <strong>ONLINE</strong> {health?.latencyMs ? `(${health.latencyMs}ms)` : ''}
                </>
              ) : (
                <>
                  STANDALONE <strong>OFFLINE</strong> (SEED CACHE)
                </>
              )}
            </span>
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 border border-hairline rounded-md hover:bg-hairline-soft text-xs font-mono text-body hover:text-ink cursor-pointer flex items-center gap-1.5 transition-colors"
            title="Refresh GIS Feeds & Telemetry"
          >
            <span className={refreshing ? 'animate-spin inline-block' : ''}>↻</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Direct link to What-If & Timeline */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => (window.location.href = '/simulation')}
              className="text-xs font-mono"
            >
              What-If Simulator ↗
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => (window.location.href = '/timeline')}
              className="text-xs font-mono"
            >
              48h Timeline ↗
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
