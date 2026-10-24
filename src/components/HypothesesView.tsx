import React from 'react';
import { CheckCircle2, AlertOctagon, ExternalLink, Wrench, ShieldAlert } from 'lucide-react';
import { Hypothesis } from '../types/investigation';

interface HypothesesViewProps {
  hypotheses: Hypothesis[];
  selectedEvidenceId: string | null;
  onInspectEvidence: (evidenceId: string) => void;
}

export const HypothesesView: React.FC<HypothesesViewProps> = ({
  hypotheses,
  selectedEvidenceId,
  onInspectEvidence,
}) => {
  if (hypotheses.length === 0) {
    return (
      <div className="bg-[#14161b] border border-[#272a33] rounded p-6 text-center text-[#67655e] text-xs font-mono">
        [ NO ROOT-CAUSE HYPOTHESES SYNTHESIZED YET ]
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
            RANKED ROOT-CAUSE HYPOTHESES
          </span>
          <span className="text-[#363942]">/</span>
          <span className="text-[11px] text-[#9c9990]">NVIDIA Nemotron 340B Calibrated</span>
        </div>
        <span className="text-[11px] text-[#67655e]">{hypotheses.length} candidate theories</span>
      </div>

      <div className="space-y-3">
        {hypotheses.map((hyp) => {
          const isTop = hyp.rank === 1 && !hyp.isRedHerring;
          const confPct = Math.round(hyp.calibratedConfidence * 100);

          return (
            <div
              key={hyp.id}
              className={`rounded border p-4 sm:p-5 transition-all text-xs relative ${
                hyp.isRedHerring
                  ? 'bg-[#121317] border-[#22242c] opacity-85'
                  : isTop
                  ? 'bg-[#14181a] border-emerald-600/60 shadow-md ring-1 ring-emerald-600/20'
                  : 'bg-[#14161b] border-[#272a33]'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span className="bg-[#1a1c22] border border-[#2e313b] text-[#f2efe9] px-2 py-0.5 rounded font-bold">
                      CASE HYPOTHESIS #{hyp.rank}
                    </span>

                    {/* Validated (green only) vs Challenged Red Herring */}
                    {hyp.isRedHerring ? (
                      <span className="bg-[#1f1614] border border-[#482823] text-[#c7887e] px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3 text-[#c7887e]" />
                        CHALLENGED · DECEPTIVE RED HERRING
                      </span>
                    ) : (
                      <span className="bg-[#0e1d17] border border-emerald-600/70 text-emerald-400 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        VALIDATED ROOT CAUSE
                      </span>
                    )}

                    <span className="text-[#363942]">/</span>
                    <span className="text-[#9c9990] uppercase">{hyp.category.replace('_', ' ')}</span>
                  </div>

                  {/* Heading in clean serif */}
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#f2efe9] leading-snug">
                    {hyp.title}
                  </h3>
                </div>

                {/* Calibrated Confidence Bar */}
                <div className="bg-[#0e0f13] border border-[#22252e] rounded px-3 py-2 font-mono shrink-0 self-start sm:self-auto min-w-[140px]">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#9c9990]">Confidence</span>
                    <span
                      className={`font-bold ${
                        hyp.isRedHerring
                          ? 'text-[#67655e]'
                          : isTop
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {confPct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1c1e26] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        hyp.isRedHerring
                          ? 'bg-[#3e424e]'
                          : isTop
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${confPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Forensic Details & "The Why" */}
              <div className="space-y-2.5 pt-3 border-t border-[#20222a]">
                {/* The Why Explanation */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-1">
                    [ Causal Explanation & Forensic Proof ]
                  </div>
                  <p className="text-[#e2dfd7] leading-relaxed font-sans text-xs bg-[#0f1013] p-3 rounded border border-[#20222a]">
                    {hyp.whyExplanation}
                  </p>
                </div>

                {/* Red Herring Disqualification by Nemotron */}
                {hyp.redHerringReasoning && (
                  <div className="bg-[#171212] border border-[#442320] rounded p-3 text-[11.5px] font-mono space-y-1 text-[#c7887e]">
                    <div className="font-bold flex items-center gap-1.5 text-amber-400">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nemotron Red-Herring Critique:</span>
                    </div>
                    <p className="text-[#c7c4bc] font-sans leading-relaxed">
                      {hyp.redHerringReasoning}
                    </p>
                  </div>
                )}

                {/* Counter Evidence Considered */}
                {hyp.counterEvidenceConsidered && !hyp.isRedHerring && (
                  <div className="bg-[#0f1013] border border-[#20222a] rounded p-2.5 text-[11.5px] text-[#9c9990] font-mono">
                    <span className="text-[#f2efe9] font-medium">Alternative Checked: </span>
                    <span className="text-[#c7c4bc] font-sans">{hyp.counterEvidenceConsidered}</span>
                  </div>
                )}

                {/* Linked Evidence Chips (Clicking highlights timeline + opens row inspector) */}
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                  <span className="text-[#9c9990] text-[11px]">Cited Zetaris Evidence:</span>
                  {hyp.citedEvidenceIds.map((id) => {
                    const isSelected = selectedEvidenceId === id;
                    return (
                      <button
                        key={id}
                        onClick={() => onInspectEvidence(id)}
                        className={`px-2 py-0.5 rounded border transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold ring-2 ring-amber-500/30'
                            : 'bg-[#181a20] hover:bg-[#22252e] border-amber-500/40 text-amber-400 hover:text-amber-300'
                        }`}
                        title="Click to locate on evidence timeline and inspect raw source row"
                      >
                        <span>[{id}]</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </button>
                    );
                  })}
                </div>

                {/* Remediation Action */}
                {hyp.recommendedFix && (
                  <div className="flex items-start gap-2 pt-1 text-[11.5px] font-sans text-[#c7c4bc]">
                    <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-400 font-mono text-xs">REMEDIATION ACTION: </strong>
                      <span>{hyp.recommendedFix}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
