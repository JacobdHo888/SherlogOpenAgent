import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Server, Clock } from 'lucide-react';
import { IncidentAlert } from '../types/investigation';

interface IncidentAlertCardProps {
  incident: IncidentAlert;
}

export const IncidentAlertCard: React.FC<IncidentAlertCardProps> = ({ incident }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[#14161b] border border-[#272a33] rounded-lg p-5 text-[#f2efe9] shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Summary Title, Service, Started Time */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Red strictly for active incident severity badge */}
            <span className="bg-red-950/70 text-red-400 border border-red-800/60 px-2 py-0.5 rounded font-mono font-semibold">
              {incident.severity} ALERT
            </span>

            <span className="font-mono text-[#9c9990]">{incident.id}</span>
            <span className="text-[#363942]">·</span>

            <div className="flex items-center gap-1.5 text-[#c7c4bc]">
              <Server className="w-3.5 h-3.5 text-[#67655e]" />
              <span className="font-medium">{incident.service}</span>
            </div>

            <span className="text-[#363942]">·</span>

            <div className="flex items-center gap-1 text-[#9c9990]">
              <Clock className="w-3.5 h-3.5 text-[#67655e]" />
              <span className="font-mono">{new Date(incident.startedAt).toUTCString()}</span>
            </div>
          </div>

          <h1 className="text-base sm:text-lg font-serif font-bold text-[#f2efe9] truncate">
            {incident.title}
          </h1>
        </div>

        {/* Right: Key 3 Metrics & Inspect Button */}
        <div className="flex items-center gap-6 shrink-0 self-start md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-[#23262f]">
          {/* Metric 1 */}
          <div>
            <div className="text-[11px] text-[#9c9990] uppercase tracking-wide">Error rate</div>
            {/* Red strictly for alert symptom spike */}
            <div className="text-sm sm:text-base font-bold font-mono text-red-400">
              {incident.initialMetrics.errorRate}
            </div>
          </div>

          {/* Metric 2 */}
          <div>
            <div className="text-[11px] text-[#9c9990] uppercase tracking-wide">p99 Latency</div>
            <div className="text-sm sm:text-base font-bold font-mono text-amber-400">
              {incident.initialMetrics.p99Latency}
            </div>
          </div>

          {/* Metric 3 */}
          <div>
            <div className="text-[11px] text-[#9c9990] uppercase tracking-wide">Affected users</div>
            <div className="text-sm sm:text-base font-bold font-mono text-[#f2efe9]">
              {incident.initialMetrics.affectedUsers}
            </div>
          </div>

          {/* Inspect Details Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded border border-[#272a33] bg-[#16181e] hover:bg-[#1f222b] text-xs text-[#c7c4bc] hover:text-[#f2efe9] flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <span>{isExpanded ? 'Hide details' : 'Inspect'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsed Description & Ground Truth Benchmark */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#23262f] space-y-3 text-xs leading-relaxed animate-in fade-in duration-150">
          <div>
            <div className="text-[#9c9990] font-medium mb-1 uppercase tracking-wider text-[10px]">
              Symptom Description
            </div>
            <p className="text-[#d8d5ce] bg-[#0e0f13] p-3 rounded border border-[#23262f] text-sm leading-relaxed">
              {incident.symptomDescription}
            </p>
          </div>

          {incident.knownGroundTruth && (
            <div className="bg-[#0e0f13] border border-[#272a33] rounded p-3 text-xs space-y-2">
              <div className="text-[#9c9990] font-medium uppercase tracking-wider text-[10px]">
                Ground Truth Benchmark (For Verification)
              </div>
              <div>
                <span className="text-emerald-400 font-semibold font-mono">True cause: </span>
                <span className="text-[#f2efe9]">{incident.knownGroundTruth.cause}</span>
              </div>
              {incident.knownGroundTruth.redHerrings.length > 0 && (
                <div>
                  <span className="text-amber-400 font-semibold font-mono">Planted red herrings: </span>
                  <ul className="list-disc list-inside text-[#c7c4bc] space-y-0.5 mt-0.5">
                    {incident.knownGroundTruth.redHerrings.map((rh, i) => (
                      <li key={i}>{rh}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
