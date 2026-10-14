import React, { useState, useRef, useEffect } from 'react';
import type { FloodIncident } from '../lib/types';

interface IncidentSelectorProps {
  incidents: FloodIncident[];
  activeIncident: FloodIncident;
  onSelect: (incident: FloodIncident) => void;
}

const STATUS_LABELS: Record<FloodIncident['status'], string> = {
  ACTIVE_FLOOD: 'ACTIVE FLOOD',
  WARNING: 'WARNING',
  MONITORING: 'MONITORING',
  RECOVERY: 'RECOVERY',
};

const STATUS_COLORS: Record<FloodIncident['status'], string> = {
  ACTIVE_FLOOD: 'bg-red-600 text-white',
  WARNING: 'bg-amber-500 text-neutral-900',
  MONITORING: 'bg-blue-600 text-white',
  RECOVERY: 'bg-emerald-600 text-white',
};

const SEVERITY_DOT: Record<FloodIncident['severity'], string> = {
  CRITICAL: 'bg-red-600',
  HIGH: 'bg-amber-500',
  MODERATE: 'bg-yellow-400',
  LOW: 'bg-blue-500',
};

export const IncidentSelector: React.FC<IncidentSelectorProps> = ({
  incidents,
  activeIncident,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = incidents.filter(
    (inc) =>
      inc.name.toLowerCase().includes(search.toLowerCase()) ||
      inc.region.toLowerCase().includes(search.toLowerCase()) ||
      inc.state.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (inc: FloodIncident) => {
    onSelect(inc);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`group flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-lg border transition-all cursor-pointer select-none text-left ${
          open
            ? 'border-primary bg-canvas-elevated shadow-sm'
            : 'border-hairline bg-canvas hover:border-neutral-400 hover:bg-canvas-elevated'
        }`}
        title="Switch Active Incident"
      >
        {/* Status dot */}
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            activeIncident.status === 'ACTIVE_FLOOD'
              ? 'bg-red-600 animate-pulse'
              : activeIncident.status === 'WARNING'
              ? 'bg-amber-500'
              : activeIncident.status === 'MONITORING'
              ? 'bg-blue-500'
              : 'bg-emerald-500'
          }`}
        />

        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-widest text-mute leading-none mb-0.5">
            Active Incident
          </span>
          <span className="text-sm font-semibold text-ink leading-tight truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[240px]">
            {activeIncident.name}
          </span>
          <span className="text-[11px] text-body font-mono leading-none mt-0.5 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[240px]">
            {activeIncident.region} · {activeIncident.state}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 ml-1 flex-shrink-0">
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest ${STATUS_COLORS[activeIncident.status]}`}
          >
            {STATUS_LABELS[activeIncident.status]}
          </span>
          {!activeIncident.is_real_backend_dataset && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest bg-neutral-200 text-neutral-600 border border-neutral-300">
              DEMO
            </span>
          )}
        </div>

        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-mute flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Popover */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-[2000] w-[420px] max-w-[calc(100vw-2rem)] bg-canvas-elevated border border-hairline rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-3 pt-3 pb-2 border-b border-hairline">
            <div className="text-[11px] font-mono uppercase tracking-widest text-mute mb-2">
              Select Active Incident / Operation Area
            </div>
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mute pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search incidents, regions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-canvas border border-hairline rounded-md text-ink placeholder:text-mute focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Incident List */}
          <div className="max-h-[360px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-xs font-mono text-mute">
                No incidents match "{search}"
              </div>
            )}
            {filtered.map((inc) => {
              const isActive = inc.incident_id === activeIncident.incident_id;
              return (
                <button
                  key={inc.incident_id}
                  onClick={() => handleSelect(inc)}
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary/8 border-l-2 border-primary'
                      : 'hover:bg-canvas border-l-2 border-transparent'
                  }`}
                >
                  {/* Severity dot */}
                  <div className="flex-shrink-0 mt-1">
                    <span
                      className={`w-2.5 h-2.5 rounded-full block ${SEVERITY_DOT[inc.severity]} ${
                        inc.status === 'ACTIVE_FLOOD' ? 'animate-pulse' : ''
                      }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold leading-tight ${isActive ? 'text-primary' : 'text-ink'}`}>
                        {inc.name}
                      </span>
                      {isActive && (
                        <span className="px-1 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest bg-primary text-on-primary">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-body font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{inc.region}</span>
                      <span className="text-mute">·</span>
                      <span>{inc.state}, {inc.country}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest ${STATUS_COLORS[inc.status]}`}
                      >
                        {STATUS_LABELS[inc.status]}
                      </span>
                      <span className="text-[10px] font-mono text-mute">
                        Severity: {inc.severity} ({inc.severity_score}/10)
                      </span>
                      {inc.is_real_backend_dataset ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
                          LIVE DATA
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest bg-neutral-100 text-neutral-500 border border-neutral-200">
                          DEMO DATA
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-mute mt-1">
                      {inc.data_source}
                    </div>
                  </div>

                  {/* Check icon when active */}
                  {isActive && (
                    <svg
                      className="w-4 h-4 text-primary flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-hairline bg-canvas flex items-center justify-between">
            <span className="text-[10px] font-mono text-mute">
              {incidents.length} incident{incidents.length !== 1 ? 's' : ''} tracked ·{' '}
              {incidents.filter((i) => i.is_real_backend_dataset).length} live backend dataset(s)
            </span>
            <button
              onClick={() => {
                setOpen(false);
                setSearch('');
              }}
              className="text-[10px] font-mono text-mute hover:text-ink transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
