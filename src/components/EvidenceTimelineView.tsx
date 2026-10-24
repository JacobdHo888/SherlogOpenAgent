import React, { useState } from 'react';
import {
  FileCode,
  GitCommit,
  Activity,
  Ticket,
  ScrollText,
  AlertOctagon,
  CheckCircle2,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { EvidenceRow, ZetarisSourceType } from '../types/investigation';

interface EvidenceTimelineViewProps {
  evidence: EvidenceRow[];
  selectedEvidenceId: string | null;
  onInspectEvidence: (evidenceId: string) => void;
}

export const EvidenceTimelineView: React.FC<EvidenceTimelineViewProps> = ({
  evidence,
  selectedEvidenceId,
  onInspectEvidence,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | ZetarisSourceType>('all');

  const filtered = activeFilter === 'all' ? evidence : evidence.filter((e) => e.source === activeFilter);

  const getSourceMeta = (source: ZetarisSourceType) => {
    switch (source) {
      case 'deploy_history':
        return {
          icon: <GitCommit className="w-3.5 h-3.5 text-amber-400" />,
          label: 'DEPLOY ROLLOUT',
          nodeBorder: 'border-amber-400 bg-amber-950/80',
        };
      case 'config_repo':
        return {
          icon: <FileCode className="w-3.5 h-3.5 text-amber-300" />,
          label: 'CONFIG DIFF',
          nodeBorder: 'border-amber-300 bg-amber-950/60',
        };
      case 'metrics':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-red-400" />,
          label: 'METRIC SATURATION',
          nodeBorder: 'border-red-400 bg-red-950/80',
        };
      case 'tickets':
        return {
          icon: <Ticket className="w-3.5 h-3.5 text-[#c7c4bc]" />,
          label: 'ALERT TICKET',
          nodeBorder: 'border-zinc-500 bg-zinc-900',
        };
      case 'logs':
      default:
        return {
          icon: <ScrollText className="w-3.5 h-3.5 text-red-400" />,
          label: 'ERROR LOG',
          nodeBorder: 'border-red-500 bg-red-950/80',
        };
    }
  };

  return (
    <div className="bg-[#14161b] border border-[#272a33] rounded text-[#f2efe9] p-4 shadow-sm">
      {/* Header with Source Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#23262f] gap-2 font-mono">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-[#f2efe9] uppercase tracking-wider">
            Causal Evidence Timeline (Zetaris Data Fabric)
          </h2>
          <span className="text-[#363942]">/</span>
          <span className="text-[11px] text-[#9c9990]">{filtered.length} correlated events</span>
        </div>

        {/* Source Filter Buttons */}
        <div className="flex items-center rounded border border-[#272a33] bg-[#0e0f13] p-0.5 text-xs">
          {(['all', 'deploy_history', 'config_repo', 'logs', 'metrics', 'tickets'] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  activeFilter === tab
                    ? 'bg-[#272a33] text-amber-300 font-bold'
                    : 'text-[#9c9990] hover:text-[#f2efe9]'
                }`}
              >
                {tab === 'all'
                  ? 'ALL'
                  : tab === 'deploy_history'
                  ? 'DEPLOYS'
                  : tab === 'config_repo'
                  ? 'CONFIGS'
                  : tab.toUpperCase()}
              </button>
            )
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-[#67655e] text-xs font-mono">
          [ NO EVIDENCE CAPTURED FOR FILTERED VIEW ]
        </div>
      ) : (
        /* Connective Cause-and-Effect Timeline Stream */
        <div className="relative pl-6 sm:pl-8 space-y-4 max-h-[460px] overflow-y-auto pr-2">
          {/* Vertical Cause-and-Effect Connective Line */}
          <div className="absolute left-[11px] sm:left-[15px] top-3 bottom-3 w-[2px] bg-[#272a33]" />

          {filtered.map((item, idx) => {
            const isSelected = selectedEvidenceId === item.evidenceId;
            const meta = getSourceMeta(item.source);

            return (
              <div
                key={item.evidenceId}
                onClick={() => onInspectEvidence(item.evidenceId)}
                className={`relative p-3 rounded border transition-all cursor-pointer font-mono text-xs group ${
                  isSelected
                    ? 'bg-[#1b1c24] border-amber-400 ring-2 ring-amber-500/30'
                    : 'bg-[#0f1013] hover:bg-[#16181f] border-[#22252e] hover:border-[#333742]'
                }`}
              >
                {/* Node icon anchored to the line */}
                <div
                  className={`absolute -left-[31px] sm:-left-[35px] top-3 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shadow-sm transition-transform group-hover:scale-110 ${meta.nodeBorder}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>

                {/* Event header row */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-xs ${
                        isSelected ? 'text-amber-300' : 'text-amber-400 group-hover:text-amber-300'
                      }`}
                    >
                      [{item.evidenceId}]
                    </span>
                    <span className="text-[#363942]">/</span>
                    <span className="text-[11px] text-[#c7c4bc] font-semibold">{meta.label}</span>
                    <span className="text-[#363942]">/</span>
                    <span className="text-[#9c9990] text-[11px]">{item.service}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    {item.isGroundTruthCausal && (
                      <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-1.5 py-0.2 rounded text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        CAUSAL ANCHOR
                      </span>
                    )}

                    {item.isRedHerring && (
                      <span className="text-[#c7887e] bg-[#221614] border border-[#482823] px-1.5 py-0.2 rounded text-[10px] font-bold flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3 text-[#c7887e]" />
                        RED HERRING
                      </span>
                    )}

                    <span className="text-[#9c9990] text-[11px]">
                      {new Date(item.timestamp).toISOString().replace('T', ' ').replace('.000Z', 'Z')}
                    </span>

                    <ExternalLink className="w-3 h-3 text-[#67655e] group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>

                {/* Event Title */}
                <div className="font-serif font-bold text-sm text-[#f2efe9] mb-1 group-hover:text-white">
                  {item.title}
                </div>

                {/* Raw Teletype snippet */}
                <div className="text-[11px] text-[#9c9990] bg-[#14161b] p-2 rounded border border-[#20222a] font-mono whitespace-pre-wrap line-clamp-2">
                  {item.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
