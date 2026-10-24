import React, { useState } from 'react';
import {
  FileCode,
  GitCommit,
  Activity,
  Ticket,
  ScrollText,
  X,
  CheckCircle2,
  AlertOctagon,
  Server,
  Clock,
  Layers,
} from 'lucide-react';
import { EvidenceRow, ZetarisSourceType } from '../types/investigation';

interface EvidenceSectionProps {
  evidence: EvidenceRow[];
  selectedEvidenceId: string | null;
  onSelectEvidence: (id: string | null) => void;
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
  evidence,
  selectedEvidenceId,
  onSelectEvidence,
}) => {
  const [filter, setFilter] = useState<'all' | ZetarisSourceType>('all');

  const filtered = filter === 'all' ? evidence : evidence.filter((e) => e.source === filter);

  // Selected evidence for side drawer
  const selectedRow = evidence.find((e) => e.evidenceId === selectedEvidenceId) || null;

  const getSourceIcon = (source: ZetarisSourceType) => {
    switch (source) {
      case 'deploy_history':
        return <GitCommit className="w-4 h-4 text-amber-400" />;
      case 'config_repo':
        return <FileCode className="w-4 h-4 text-amber-300" />;
      case 'metrics':
        return <Activity className="w-4 h-4 text-red-400" />;
      case 'tickets':
        return <Ticket className="w-4 h-4 text-[#c7c4bc]" />;
      case 'logs':
      default:
        return <ScrollText className="w-4 h-4 text-red-400" />;
    }
  };

  const getSourceLabel = (source: ZetarisSourceType) => {
    switch (source) {
      case 'deploy_history':
        return 'Deploy';
      case 'config_repo':
        return 'Config';
      case 'metrics':
        return 'Metric';
      case 'tickets':
        return 'Ticket';
      case 'logs':
      default:
        return 'Log';
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex items-center rounded border border-[#272a33] bg-[#14161b] p-0.5 text-xs font-mono">
          {(['all', 'deploy_history', 'config_repo', 'logs', 'metrics', 'tickets'] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded transition-colors ${
                  filter === tab
                    ? 'bg-[#272a33] text-amber-300 font-bold'
                    : 'text-[#9c9990] hover:text-[#f2efe9]'
                }`}
              >
                {tab === 'all'
                  ? 'All'
                  : tab === 'deploy_history'
                  ? 'Deploys'
                  : tab === 'config_repo'
                  ? 'Configs'
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            )
          )}
        </div>

        <div className="text-xs text-[#9c9990] font-mono">
          Showing {filtered.length} of {evidence.length} items
        </div>
      </div>

      {/* Main Grid: Timeline + Side Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Timeline Stream (8 cols if drawer open, 12 cols if closed) */}
        <div
          className={`${
            selectedRow ? 'lg:col-span-7 xl:col-span-7' : 'lg:col-span-12'
          } space-y-3 transition-all`}
        >
          {filtered.length === 0 ? (
            <div className="bg-[#14161b] border border-[#272a33] rounded-lg p-12 text-center text-[#9c9990] text-sm">
              No evidence rows matching this filter.
            </div>
          ) : (
            <div className="relative pl-6 space-y-3">
              {/* Connective line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-[#272a33]" />

              {filtered.map((item) => {
                const isSelected = selectedEvidenceId === item.evidenceId;

                return (
                  <div
                    key={item.evidenceId}
                    onClick={() => onSelectEvidence(isSelected ? null : item.evidenceId)}
                    className={`relative p-4 rounded-lg border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-[#1a1c24] border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-[#14161b] hover:bg-[#181a20] border-[#272a33] hover:border-[#383c48]'
                    }`}
                  >
                    {/* Node marker */}
                    <div
                      className={`absolute -left-[30px] top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-[#14161b] ${
                        isSelected ? 'border-amber-400' : 'border-[#414552]'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-amber-400' : 'bg-[#67655e]'
                        }`}
                      />
                    </div>

                    {/* Row Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-[#0e0f13] border border-[#272a33]">
                          {getSourceIcon(item.source)}
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isSelected ? 'text-amber-300' : 'text-amber-400'
                          }`}
                        >
                          [{item.evidenceId}]
                        </span>
                        <span className="text-[#363942]">·</span>
                        <span className="text-[#c7c4bc] font-medium font-mono">
                          {getSourceLabel(item.source)}
                        </span>
                        <span className="text-[#363942]">·</span>
                        <span className="text-[#9c9990] font-mono">{item.service}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.isGroundTruthCausal && (
                          <span className="bg-emerald-950/70 text-emerald-400 border border-emerald-700/60 text-[11px] font-mono px-2 py-0.2 rounded font-bold">
                            Causal anchor
                          </span>
                        )}

                        {item.isRedHerring && (
                          <span className="bg-[#201514] text-[#c7887e] border border-[#482823] text-[11px] font-mono px-2 py-0.2 rounded">
                            Red herring
                          </span>
                        )}

                        <span className="font-mono text-[#9c9990] text-[11px]">
                          {new Date(item.timestamp).toISOString().replace('T', ' ').replace('.000Z', 'Z')}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif font-bold text-base text-[#f2efe9] mb-1.5">
                      {item.title}
                    </h3>

                    {/* Content snippet */}
                    <p className="text-xs text-[#9c9990] font-mono line-clamp-2 bg-[#0e0f13] p-2 rounded border border-[#20222a]">
                      {item.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Drawer for Raw Source Inspection */}
        {selectedRow && (
          <aside className="lg:col-span-5 xl:col-span-5 bg-[#14161b] border border-[#272a33] rounded-lg p-5 text-xs space-y-4 lg:sticky lg:top-20 shadow-xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#23262f]">
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-amber-400 text-sm">[{selectedRow.evidenceId}]</span>
                <span className="text-[#363942]">·</span>
                <span className="text-[#9c9990]">{selectedRow.service}</span>
              </div>

              <button
                onClick={() => onSelectEvidence(null)}
                className="p-1 rounded text-[#9c9990] hover:text-[#f2efe9] hover:bg-[#20222a] transition-colors"
                title="Close side drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-[#9c9990] uppercase font-mono mb-1">Event Title</div>
                <h4 className="font-serif font-bold text-sm text-[#f2efe9] leading-snug">
                  {selectedRow.title}
                </h4>
              </div>

              <div className="flex items-center gap-4 text-[11px] font-mono text-[#9c9990]">
                <div>
                  <span className="text-[#67655e]">Table: </span>
                  <span className="text-[#c7c4bc]">zetaris.{selectedRow.source}</span>
                </div>
                <div>
                  <span className="text-[#67655e]">Time: </span>
                  <span className="text-[#c7c4bc]">{selectedRow.timestamp}</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-amber-400 uppercase font-mono mb-1">
                  Raw Output / Diff:
                </div>
                <pre className="bg-[#0e0f13] p-3 rounded border border-[#23262f] font-mono text-[11px] text-[#f2efe9] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60">
                  {selectedRow.content}
                </pre>
              </div>

              <div>
                <div className="text-[10px] text-[#9c9990] uppercase font-mono mb-1">
                  Structured Attributes:
                </div>
                <pre className="bg-[#0e0f13] p-3 rounded border border-[#23262f] font-mono text-[11px] text-amber-300 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedRow.structuredData, null, 2)}
                </pre>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
