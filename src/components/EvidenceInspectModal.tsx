import React from 'react';
import { X, Clock, Server, CheckCircle2, AlertOctagon, FileText } from 'lucide-react';
import { EvidenceRow } from '../types/investigation';

interface EvidenceInspectModalProps {
  evidence: EvidenceRow | null;
  onClose: () => void;
}

export const EvidenceInspectModal: React.FC<EvidenceInspectModalProps> = ({ evidence, onClose }) => {
  if (!evidence) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-mono">
      <div className="bg-[#14161b] border border-[#383c48] rounded max-w-2xl w-full shadow-2xl overflow-hidden text-[#f2efe9]">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#23262f] bg-[#0f1013]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-amber-400">
              EVIDENCE FILE // [{evidence.evidenceId}]
            </span>
            <span className="text-[#363942]">/</span>
            <span className="text-xs text-[#9c9990]">zetaris.{evidence.source}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#9c9990] hover:text-[#f2efe9] hover:bg-[#20222a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#0e0f13] px-2 py-1 rounded border border-[#272a33]">
              <Server className="w-3 h-3 text-[#67655e]" />
              <span className="text-[#c7c4bc]">{evidence.service}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0e0f13] px-2 py-1 rounded border border-[#272a33]">
              <Clock className="w-3 h-3 text-[#67655e]" />
              <span className="text-[#9c9990]">{new Date(evidence.timestamp).toISOString()}</span>
            </div>

            <span
              className={`px-2 py-1 rounded border font-bold ${
                evidence.severity === 'CRITICAL' || evidence.severity === 'ERROR'
                  ? 'bg-red-950/60 border-red-700/70 text-red-400'
                  : 'bg-[#181a20] border-[#272a33] text-[#c7c4bc]'
              }`}
            >
              {evidence.severity}
            </span>

            {evidence.isGroundTruthCausal && (
              <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-2 py-1 rounded font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Validated Causal Anchor
              </span>
            )}

            {evidence.isRedHerring && (
              <span className="text-[#c7887e] bg-[#221614] border border-[#482823] px-2 py-1 rounded font-bold flex items-center gap-1">
                <AlertOctagon className="w-3 h-3 text-[#c7887e]" />
                Deceptive Red Herring
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#9c9990] mb-1">
              Observation Summary:
            </div>
            <h4 className="text-sm font-serif font-bold text-[#f2efe9] bg-[#0e0f13] p-3 rounded border border-[#22252e]">
              {evidence.title}
            </h4>
          </div>

          {/* Raw Content / Git Diff */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-amber-400 mb-1">
              Raw Evidence Telemetry / Diff Output:
            </div>
            <pre className="bg-[#0e0f13] p-3 rounded border border-[#272a33] text-[11px] text-[#f2efe9] overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {evidence.content}
            </pre>
          </div>

          {/* Structured Schema */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#9c9990] mb-1">
              Structured Zetaris Attributes:
            </div>
            <pre className="bg-[#0e0f13] p-3 rounded border border-[#22252e] text-[11px] text-amber-300 overflow-x-auto">
              {JSON.stringify(evidence.structuredData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-3 border-t border-[#23262f] bg-[#0f1013]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#20222a] hover:bg-[#2b2e38] text-[#f2efe9] rounded text-xs transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
