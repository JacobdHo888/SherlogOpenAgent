import React, { useState } from 'react';
import { CheckCircle2, AlertOctagon, ChevronDown, ChevronUp, Wrench, ExternalLink } from 'lucide-react';
import { Hypothesis } from '../types/investigation';

interface AnswerSectionProps {
  hypotheses: Hypothesis[];
  onInspectEvidence: (evidenceId: string) => void;
  onNavigateToEvidenceTab: () => void;
}

export const AnswerSection: React.FC<AnswerSectionProps> = ({
  hypotheses,
  onInspectEvidence,
  onNavigateToEvidenceTab,
}) => {
  const [expandedHypothesisIds, setExpandedHypothesisIds] = useState<Record<string, boolean>>({});

  if (hypotheses.length === 0) {
    return (
      <div className="bg-[#14161b] border border-[#272a33] rounded-lg p-12 text-center text-[#9c9990] space-y-2">
        <p className="font-serif text-lg text-[#f2efe9]">Investigation awaiting start</p>
        <p className="text-sm">Click "Start investigation" above to analyze the alert and formulate root causes.</p>
      </div>
    );
  }

  const topHypothesis = hypotheses.find((h) => h.rank === 1 && !h.isRedHerring) || hypotheses[0];
  const alternativeHypotheses = hypotheses.filter((h) => h.id !== topHypothesis.id);
  const topConfidencePct = Math.round(topHypothesis.calibratedConfidence * 100);

  const toggleHypothesis = (id: string) => {
    setExpandedHypothesisIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Large Hero Card for Primary Top Root Cause */}
      <div className="bg-[#14161b] border border-emerald-600/50 rounded-lg p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              {/* Green strictly for validated claims */}
              <span className="bg-emerald-950/70 text-emerald-400 border border-emerald-700/60 text-xs px-2.5 py-0.5 rounded font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                VALIDATED ROOT CAUSE
              </span>
              <span className="text-xs text-[#9c9990] font-mono">
                {topHypothesis.category.replace('_', ' ')}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#f2efe9] leading-tight">
              {topHypothesis.title}
            </h2>
          </div>

          {/* Clean Confidence Bar */}
          <div className="bg-[#0e0f13] border border-[#272a33] rounded-md px-4 py-3 min-w-[160px] shrink-0 self-start sm:self-auto font-mono">
            <div className="flex items-center justify-between text-xs text-[#9c9990] mb-1.5">
              <span>Confidence</span>
              <span className="font-bold text-emerald-400 text-sm">{topConfidencePct}%</span>
            </div>
            <div className="h-2 w-full bg-[#1c1e26] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${topConfidencePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Plain-Language Explanation (2-3 sentences) */}
        <div className="text-[#e2dfd7] text-base leading-relaxed font-sans bg-[#0e0f13] p-4 rounded-md border border-[#23262f]">
          {topHypothesis.whyExplanation}
        </div>

        {/* Cited Evidence Links */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[#9c9990] font-medium">Cited evidence:</span>
          {topHypothesis.citedEvidenceIds.map((id) => (
            <button
              key={id}
              onClick={() => onInspectEvidence(id)}
              className="font-mono text-amber-400 hover:text-amber-300 bg-[#1a1c24] hover:bg-[#22252e] border border-amber-500/30 px-2.5 py-1 rounded transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              title="Click to view evidence details"
            >
              <span>[{id}]</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          ))}
          <button
            onClick={onNavigateToEvidenceTab}
            className="text-[#9c9990] hover:text-[#f2efe9] underline underline-offset-4 ml-2 transition-colors"
          >
            View on timeline →
          </button>
        </div>

        {/* Remediation Action */}
        {topHypothesis.recommendedFix && (
          <div className="flex items-start gap-3 pt-2 text-sm text-[#c7c4bc] border-t border-[#20222a]">
            <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-amber-400 font-semibold font-mono text-xs uppercase tracking-wide mr-1.5">
                Recommended fix:
              </span>
              <span>{topHypothesis.recommendedFix}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Other Hypotheses Collapsed as One-Line Rows Below */}
      {alternativeHypotheses.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs uppercase font-mono tracking-wider text-[#9c9990]">
            Alternative Hypotheses & Red Herrings Considered ({alternativeHypotheses.length})
          </div>

          <div className="space-y-2">
            {alternativeHypotheses.map((hyp) => {
              const isExpanded = !!expandedHypothesisIds[hyp.id];
              const confPct = Math.round(hyp.calibratedConfidence * 100);

              return (
                <div
                  key={hyp.id}
                  className="bg-[#14161b] border border-[#272a33] rounded-md overflow-hidden text-sm"
                >
                  {/* One-Line Collapsed Row */}
                  <button
                    onClick={() => toggleHypothesis(hyp.id)}
                    className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[#181a20] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-[#9c9990] shrink-0">
                        #{hyp.rank}
                      </span>

                      <span className="font-medium text-[#f2efe9] truncate">
                        {hyp.title}
                      </span>

                      {hyp.isRedHerring && (
                        <span className="bg-[#201514] text-[#c7887e] border border-[#482823] text-xs px-2 py-0.2 rounded font-mono shrink-0">
                          Challenged (Red herring)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                      <span className="text-[#9c9990]">{confPct}% confidence</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#9c9990]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#9c9990]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-[#23262f] bg-[#0e0f13] space-y-3 text-xs leading-relaxed animate-in fade-in duration-150">
                      <div>
                        <div className="text-[#9c9990] font-medium mb-1">Forensic Analysis:</div>
                        <p className="text-[#c7c4bc] text-sm font-sans">{hyp.whyExplanation}</p>
                      </div>

                      {hyp.redHerringReasoning && (
                        <div className="p-3 rounded bg-[#1c1212] border border-[#442320] text-[#c7887e] space-y-1">
                          <div className="font-bold font-mono text-amber-400 flex items-center gap-1.5">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>Nemotron Disqualification:</span>
                          </div>
                          <p className="text-[#d8d5ce] font-sans">{hyp.redHerringReasoning}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
                        <span className="text-[#9c9990]">Cited:</span>
                        {hyp.citedEvidenceIds.map((id) => (
                          <button
                            key={id}
                            onClick={() => onInspectEvidence(id)}
                            className="text-amber-400 hover:text-amber-300 underline"
                          >
                            [{id}]
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
