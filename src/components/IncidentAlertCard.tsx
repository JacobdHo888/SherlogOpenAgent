import React, { useState } from 'react';
import { AlertCircle, Clock, Server, FileSearch, ChevronDown, ChevronUp } from 'lucide-react';
import { IncidentAlert } from '../types/investigation';

interface IncidentAlertCardProps {
  incident: IncidentAlert;
}

export const IncidentAlertCard: React.FC<IncidentAlertCardProps> = ({ incident }) => {
  const [showGroundTruth, setShowGroundTruth] = useState(false);

  return (
    <section className="bg-[#14161b] border border-[#272a33] rounded text-[#f2efe9] shadow-sm relative overflow-hidden">
      {/* Top red accent line strictly for active incident alert */}
      <div className="h-0.5 w-full bg-red-600" />

      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Case Header dossier info */}
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {/* Red SEV-1 stamp */}
              <span className="bg-red-950/80 text-red-400 border border-red-700/70 px-2 py-0.5 rounded font-bold tracking-wider">
                ACTIVE INCIDENT · {incident.severity}
              </span>

              <span className="text-amber-400 font-bold">CASE // {incident.id}</span>
              <span className="text-[#363942]">/</span>

              <div className="flex items-center gap-1 text-[#c7c4bc]">
                <Server className="w-3.5 h-3.5 text-[#67655e]" />
                <span className="font-semibold">{incident.service}</span>
              </div>

              <span className="text-[#363942]">/</span>
              <span className="text-[#9c9990]">{incident.environment}</span>

              <span className="text-[#363942]">/</span>
              <div className="flex items-center gap-1 text-[#9c9990]">
                <Clock className="w-3.5 h-3.5 text-[#67655e]" />
                <span>{new Date(incident.startedAt).toUTCString()}</span>
              </div>
            </div>

            <h1 className="text-lg sm:text-xl font-serif font-bold text-[#f2efe9] tracking-tight leading-snug">
              {incident.title}
            </h1>

            <p className="text-xs text-[#c7c4bc] leading-relaxed max-w-4xl font-sans">
              {incident.symptomDescription}
            </p>
          </div>

          {/* Right: Initial Anomaly Telemetry Meter Strip */}
          <div className="flex items-center gap-3 bg-[#0e0f13] border border-[#272a33] rounded px-4 py-2.5 self-start lg:self-auto shrink-0 font-mono text-xs">
            <div className="text-left pr-3 border-r border-[#272a33]">
              <div className="text-[10px] text-[#9c9990] uppercase tracking-wider mb-0.5">Error Rate</div>
              {/* Red strictly for anomaly spike */}
              <div className="text-base font-bold text-red-400">
                {incident.initialMetrics.errorRate}
              </div>
            </div>

            <div className="text-left px-3 border-r border-[#272a33]">
              <div className="text-[10px] text-[#9c9990] uppercase tracking-wider mb-0.5">p99 Latency</div>
              <div className="text-base font-bold text-amber-400">
                {incident.initialMetrics.p99Latency}
              </div>
            </div>

            <div className="text-left pl-3">
              <div className="text-[10px] text-[#9c9990] uppercase tracking-wider mb-0.5">Impact Scope</div>
              <div className="text-base font-bold text-[#f2efe9]">
                {incident.initialMetrics.affectedUsers}
              </div>
            </div>
          </div>
        </div>

        {/* Ground Truth Dossier Benchmark Toggle */}
        {incident.knownGroundTruth && (
          <div className="mt-3.5 pt-2.5 border-t border-[#20222a] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-[#9c9990]">
                <FileSearch className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[#c7c4bc] font-semibold">Hackathon Case Benchmark:</span>
                <span>Seeded ground truth & deceptive red herrings</span>
              </div>

              <button
                onClick={() => setShowGroundTruth(!showGroundTruth)}
                className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <span>{showGroundTruth ? 'COLLAPSE BENCHMARK' : 'INSPECT GROUND TRUTH'}</span>
                {showGroundTruth ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showGroundTruth && (
              <div className="bg-[#0f1013] border border-[#272a33] rounded p-3 text-xs font-mono space-y-2 mt-1">
                <div>
                  <span className="text-emerald-400 font-semibold">[VERIFIED CAUSE]: </span>
                  <span className="text-[#f2efe9]">{incident.knownGroundTruth.cause}</span>
                </div>
                {incident.knownGroundTruth.redHerrings.length > 0 && (
                  <div>
                    <span className="text-amber-400 font-semibold">[PLANTED RED HERRINGS]: </span>
                    <ul className="list-disc list-inside mt-0.5 text-[#c7c4bc] space-y-0.5 pl-1">
                      {incident.knownGroundTruth.redHerrings.map((rh, i) => (
                        <li key={i}>{rh}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-[#9c9990] text-[11px] pt-1 border-t border-[#1c1e24]">
                  Key causal evidence IDs:{' '}
                  {incident.knownGroundTruth.causalEvidenceIds.map((id) => (
                    <span key={id} className="text-amber-300 font-bold mr-2">
                      [{id}]
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
