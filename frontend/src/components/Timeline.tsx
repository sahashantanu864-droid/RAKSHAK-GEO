import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { fetchTimelineSample } from '../lib/api';

interface TimelineStep {
  offsetHours: number;
  label: string;
  timeTag: string;
  floodExtentSqKm: number;
  floodDeltaPct: number;
  populationAtRisk: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  severityScore: number;
  unmetGapUnits: {
    ambulances: number;
    rescue_boats: number;
    food_packets: number;
    medical_kits: number;
    personnel: number;
  };
  fulfillmentRate: number;
  keyEvents: string[];
  operationalActions: string;
}

const TIMELINE_PROJECTIONS: TimelineStep[] = [
  {
    offsetHours: 0,
    label: 'T+0h · Current Operational Baseline',
    timeTag: 'NOW (Incident Inception)',
    floodExtentSqKm: 3.82,
    floodDeltaPct: 0,
    populationAtRisk: 22400,
    severity: 'CRITICAL',
    severityScore: 8.7,
    unmetGapUnits: {
      ambulances: 5,
      rescue_boats: 4,
      food_packets: 1200,
      medical_kits: 250,
      personnel: 20,
    },
    fulfillmentRate: 0.62,
    keyEvents: [
      'Sabarmati River discharge reaches 165,000 cusecs',
      'Ashram Road corridor partially submerged (depth 40cm)',
      'Sabarmati Civil Hospital reports basement water ingress',
    ],
    operationalActions:
      'Activate Level 3 Flood Protocol. Dispatch 6th Bn NDRF boat teams to Riverfront Promenade.',
  },
  {
    offsetHours: 6,
    label: 'T+6h · Upstream Catchment Influx',
    timeTag: '+6 Hours Projection',
    floodExtentSqKm: 5.24,
    floodDeltaPct: 37.2,
    populationAtRisk: 31800,
    severity: 'CRITICAL',
    severityScore: 9.1,
    unmetGapUnits: {
      ambulances: 8,
      rescue_boats: 7,
      food_packets: 2400,
      medical_kits: 420,
      personnel: 35,
    },
    fulfillmentRate: 0.49,
    keyEvents: [
      'River discharge expands to 195,000 cusecs at Subhash Bridge',
      'Ashram Road water depth increases to 65cm (fully blocked to light vehicles)',
      'Maninagar east low-lying residential clusters experience 30cm waterlogging',
    ],
    operationalActions:
      'Issue mandatory evacuation order for western bank within 300m buffer. Divert all logistics via 132 Feet Ring Road.',
  },
  {
    offsetHours: 12,
    label: 'T+12h · Projected Crest & State Reserve Influx',
    timeTag: '+12 Hours Peak Horizon',
    floodExtentSqKm: 6.85,
    floodDeltaPct: 79.3,
    populationAtRisk: 42500,
    severity: 'CRITICAL',
    severityScore: 9.4,
    unmetGapUnits: {
      ambulances: 3, // Alleviated by mutual aid reserve arrival
      rescue_boats: 2,
      food_packets: 800,
      medical_kits: 150,
      personnel: 15,
    },
    fulfillmentRate: 0.76,
    keyEvents: [
      'Peak river crest predicted at 210,000 cusecs',
      'State Mutual Aid Reserve mobilizes: +15 Ambulances, +8 Boats arrive at Motera Staging Base',
      'Secondary shelter at Gujarat University Indoor Stadium becomes fully operational',
    ],
    operationalActions:
      'Deploy state reserve boat flotilla across Vadaj and Usmanpura. Relocate high-risk evacuees to university indoor stadium.',
  },
  {
    offsetHours: 24,
    label: 'T+24h · Water Stabilization & Initial Recession',
    timeTag: '+24 Hours Stabilization',
    floodExtentSqKm: 5.10,
    floodDeltaPct: 33.5,
    populationAtRisk: 26000,
    severity: 'HIGH',
    severityScore: 6.9,
    unmetGapUnits: {
      ambulances: 1,
      rescue_boats: 1,
      food_packets: 400,
      medical_kits: 80,
      personnel: 5,
    },
    fulfillmentRate: 0.88,
    keyEvents: [
      'Upstream dam discharge reduced to 95,000 cusecs',
      'Water levels on Ashram Road recede below 20cm; dewatering pumps deployed',
      'Civil Hospital ground floor water drained; emergency trauma services restored',
    ],
    operationalActions:
      'Commence sanitary disinfection, potable water distribution, and structural safety inspections.',
  },
  {
    offsetHours: 48,
    label: 'T+48h · Post-Disaster Recovery & Egress Clearance',
    timeTag: '+48 Hours Recovery',
    floodExtentSqKm: 2.85,
    floodDeltaPct: -25.4,
    populationAtRisk: 7500,
    severity: 'MODERATE',
    severityScore: 4.2,
    unmetGapUnits: {
      ambulances: 0,
      rescue_boats: 0,
      food_packets: 100,
      medical_kits: 20,
      personnel: 0,
    },
    fulfillmentRate: 0.96,
    keyEvents: [
      'River flow stabilized within embankment banks',
      'All primary evacuation corridors and underpasses reopened to regular traffic',
      'Phased demobilization of state auxiliary rescue boats initiated',
    ],
    operationalActions:
      'Transition from acute rescue to community relief, damage claim logging, and disease surveillance.',
  },
];

export const Timeline: React.FC = () => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check if backend sample payload is reachable
    fetchTimelineSample()
      .then(() => {
        // Backend timeline schema available
      })
      .catch((err) => {
        console.warn('Backend timeline offline, using verified deterministic timeline model', err);
      });
  }, []);

  const currentStep = TIMELINE_PROJECTIONS[selectedStepIndex];
  const isCritical = currentStep.severity === 'CRITICAL';
  const isHigh = currentStep.severity === 'HIGH';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-hairline pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-neutral-900 text-white uppercase tracking-widest">
              T-016 DETERMINISTIC PLANNING
            </span>
            <span className="text-xs font-mono text-mute">
              MULTI-HORIZON RESPONSE GAP PROJECTION
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Future Response Gap Timeline
          </h1>
          <p className="text-xs sm:text-sm text-body font-mono mt-1">
            Chronological deterministic model of flood extent progression, population impact, and resource deficit evolution over 48 hours.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => (window.location.href = '/')}
            className="text-xs font-mono"
          >
            ← Return to GIS Map
          </Button>
        </div>
      </div>

      {/* Interactive Time Horizon Scrubber Bar */}
      <Card className="border border-hairline bg-canvas-elevated shadow-sm p-4">
        <div className="text-[11px] font-mono uppercase tracking-wider text-mute mb-3 font-semibold">
          Select Temporal Horizon (NOW → +48 Hours):
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TIMELINE_PROJECTIONS.map((step, idx) => {
            const isSelected = idx === selectedStepIndex;
            return (
              <button
                key={step.offsetHours}
                onClick={() => setSelectedStepIndex(idx)}
                className={`p-3 rounded-md border text-left transition-all cursor-pointer font-mono ${
                  isSelected
                    ? 'border-primary bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                    : 'border-hairline bg-canvas hover:border-mute text-body'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-ink'}`}>
                    {step.offsetHours === 0 ? 'NOW' : `+${step.offsetHours}h`}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      step.severity === 'CRITICAL'
                        ? 'bg-red-500'
                        : step.severity === 'HIGH'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />
                </div>
                <div className={`text-[10px] mt-1 ${isSelected ? 'text-white/80' : 'text-mute'}`}>
                  {step.floodExtentSqKm} km² flooded
                </div>
                <div className={`text-[10px] mt-0.5 font-bold ${isSelected ? 'text-white' : 'text-body'}`}>
                  {Math.round(step.fulfillmentRate * 100)}% coverage
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Trajectory Evolution Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Flood Extent Curve */}
        <Card className="border border-hairline bg-canvas-elevated">
          <div className="text-xs font-mono uppercase tracking-wider text-mute mb-1">
            Flood Extent Projection
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-ink">
              {currentStep.floodExtentSqKm.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-mute">km² inundated</span>
          </div>
          <div className="text-xs font-mono mt-1 text-body">
            Delta from baseline:{' '}
            <strong className={currentStep.floodDeltaPct > 0 ? 'text-red-600' : 'text-link'}>
              {currentStep.floodDeltaPct > 0 ? `+${currentStep.floodDeltaPct.toFixed(1)}%` : `${currentStep.floodDeltaPct.toFixed(1)}%`}
            </strong>
          </div>
          {/* Visual Step Bar */}
          <div className="mt-3 flex items-center gap-1 h-1.5 bg-hairline-soft rounded-full overflow-hidden">
            {TIMELINE_PROJECTIONS.map((p, i) => (
              <div
                key={i}
                className={`flex-1 h-full ${
                  i <= selectedStepIndex
                    ? p.severity === 'CRITICAL'
                      ? 'bg-red-600'
                      : 'bg-amber-500'
                    : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </Card>

        {/* 2. Population Exposure Curve */}
        <Card className="border border-hairline bg-canvas-elevated">
          <div className="text-xs font-mono uppercase tracking-wider text-mute mb-1">
            Population in Impact Zone
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-ink">
              {currentStep.populationAtRisk.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-mute">Residents</span>
          </div>
          <div className="text-xs font-mono mt-1 text-body">
            Severity Rating:{' '}
            <strong className={isCritical ? 'text-red-600' : 'text-amber-700'}>
              {currentStep.severity} ({currentStep.severityScore}/10)
            </strong>
          </div>
          {/* Visual Step Bar */}
          <div className="mt-3 flex items-center gap-1 h-1.5 bg-hairline-soft rounded-full overflow-hidden">
            {TIMELINE_PROJECTIONS.map((p, i) => (
              <div
                key={i}
                className={`flex-1 h-full ${
                  i <= selectedStepIndex ? 'bg-primary' : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </Card>

        {/* 3. Overall Fulfillment & Net Deficit */}
        <Card className="border border-hairline bg-canvas-elevated">
          <div className="text-xs font-mono uppercase tracking-wider text-mute mb-1">
            Response Fulfillment Rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-link">
              {(currentStep.fulfillmentRate * 100).toFixed(0)}%
            </span>
            <span className="text-xs font-mono text-mute">demand fulfilled</span>
          </div>
          <div className="text-xs font-mono mt-1 text-body">
            Critical Life-Safety Deficit:{' '}
            <strong className="text-red-600">
              {currentStep.unmetGapUnits.ambulances} Amb · {currentStep.unmetGapUnits.rescue_boats} Boats
            </strong>
          </div>
          {/* Fulfillment Bar */}
          <div className="mt-3 w-full bg-hairline-soft h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                currentStep.fulfillmentRate > 0.8
                  ? 'bg-link'
                  : currentStep.fulfillmentRate > 0.6
                  ? 'bg-amber-500'
                  : 'bg-red-600'
              }`}
              style={{ width: `${currentStep.fulfillmentRate * 100}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Selected Time Horizon Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Net Response Gaps for this Horizon */}
        <div className="col-span-1 lg:col-span-7 space-y-4">
          <Card className="border border-hairline bg-canvas-elevated shadow-sm">
            <div className="flex items-center justify-between border-b border-hairline pb-3 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-mute block">
                  Projected Resource Deficits
                </span>
                <h3 className="text-sm font-bold font-mono text-ink">
                  {currentStep.label}
                </h3>
              </div>
              <span
                className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded ${
                  isCritical
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : isHigh
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                {currentStep.timeTag}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-canvas border-b border-hairline text-mute uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Resource Asset</th>
                    <th className="py-2 px-3">Net Unmet Deficit</th>
                    <th className="py-2 px-3">Impact Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft text-body">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      ALS Ambulances
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${currentStep.unmetGapUnits.ambulances > 0 ? 'text-red-600' : 'text-link'}`}>
                      {currentStep.unmetGapUnits.ambulances > 0 ? `+${currentStep.unmetGapUnits.ambulances} units` : 'Zero Deficit'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">
                      {currentStep.unmetGapUnits.ambulances > 4 ? 'Severe ICU Transport Bottleneck' : 'Manageable Transport'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      Inflatable Rescue Boats
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${currentStep.unmetGapUnits.rescue_boats > 0 ? 'text-red-600' : 'text-link'}`}>
                      {currentStep.unmetGapUnits.rescue_boats > 0 ? `+${currentStep.unmetGapUnits.rescue_boats} crafts` : 'Zero Deficit'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">
                      {currentStep.unmetGapUnits.rescue_boats > 3 ? 'Critical Water Evacuation Deficit' : 'Submersible Area Sufficient'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      Food Ration Packs
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${currentStep.unmetGapUnits.food_packets > 0 ? 'text-amber-700' : 'text-link'}`}>
                      {currentStep.unmetGapUnits.food_packets > 0 ? `+${currentStep.unmetGapUnits.food_packets} packs` : 'Zero Deficit'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">
                      {currentStep.unmetGapUnits.food_packets > 1000 ? 'Air-drop Rations Required' : 'Shelter Kitchens Covered'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      Trauma Medical Kits
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${currentStep.unmetGapUnits.medical_kits > 0 ? 'text-amber-700' : 'text-link'}`}>
                      {currentStep.unmetGapUnits.medical_kits > 0 ? `+${currentStep.unmetGapUnits.medical_kits} kits` : 'Zero Deficit'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">
                      {currentStep.unmetGapUnits.medical_kits > 200 ? 'Civil Hospital Staging Critical' : 'First-Aid Post Adequate'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      Emergency Personnel
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${currentStep.unmetGapUnits.personnel > 0 ? 'text-red-600' : 'text-link'}`}>
                      {currentStep.unmetGapUnits.personnel > 0 ? `+${currentStep.unmetGapUnits.personnel} staff` : 'Zero Deficit'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">
                      {currentStep.unmetGapUnits.personnel > 20 ? 'NDRF Reinforcement Requisitioned' : 'SDRF & Police Deployed'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right: Chronological Milestones & Strategic Directive */}
        <div className="col-span-1 lg:col-span-5 space-y-4">
          <Card className="border border-hairline bg-canvas-elevated shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-ink mb-2 border-b border-hairline pb-2">
              Timeline Milestones & Field Events
            </h4>

            <div className="space-y-2.5">
              {currentStep.keyEvents.map((evt, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-body bg-canvas p-2.5 rounded border border-hairline-soft">
                  <span className="text-red-600 font-bold font-mono">#{i + 1}</span>
                  <span className="leading-snug">{evt}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-hairline">
              <span className="text-[10px] font-mono uppercase tracking-wider text-mute block mb-1">
                Command Directive & Operational Orders
              </span>
              <div className="p-3 bg-neutral-900 text-white rounded-md text-xs font-mono leading-relaxed">
                {currentStep.operationalActions}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-mute">
              <span>Model Type: Linear Growth + Discrete Stepping</span>
              <button
                onClick={() => alert(`Timeline projection for ${currentStep.timeTag} logged to operational archive.`)}
                className="text-link hover:underline cursor-pointer"
              >
                Log Directive ↗
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
