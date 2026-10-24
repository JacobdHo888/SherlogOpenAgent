import React from 'react';
import { Scale, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { RubricScorecard } from '../types/investigation';

interface EvaluatorScorecardViewProps {
  rubric: RubricScorecard | null;
}

export const EvaluatorScorecardView: React.FC<EvaluatorScorecardViewProps> = ({ rubric }) => {
  if (!rubric) {
    return (
      <div className="bg-[#14161b] border border-[#272a33] rounded p-4 text-center text-[#67655e] text-xs font-mono">
        [ EVALUATOR RUBRIC PENDING INVESTIGATION TRACE ]
      </div>
    );
  }

  const meters = [
    {
      label: 'Citation Validity',
      score: rubric.citationValidityScore,
      subtext: `${rubric.citationsChecked.validEvidenceIds}/${rubric.citationsChecked.totalCited} IDs verified in Zetaris`,
      passed: rubric.citationValidityScore >= 90,
    },
    {
      label: 'Temporal Consistency',
      score: rubric.temporalConsistencyScore,
      subtext: 'Cause strictly precedes alert',
      passed: rubric.temporalConsistencyScore >= 90,
    },
    {
      label: 'Alternatives Considered',
      score: rubric.alternativesConsideredScore,
      subtext: 'Red herrings probed & ruled out',
      passed: rubric.alternativesConsideredScore >= 80,
    },
    {
      label: 'Calibrated Confidence',
      score: rubric.calibratedConfidenceScore,
      subtext: 'High-margin separation',
      passed: rubric.calibratedConfidenceScore >= 80,
    },
  ];

  return (
    <div className="bg-[#14161b] border border-[#272a33] rounded text-[#f2efe9] p-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#23262f] gap-2 font-mono">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-[#f2efe9] uppercase tracking-wider">
            Evaluator Audit & Rubric Scorecard
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#9c9990]">Forensic Score:</span>
          {/* Green strictly for validated claims */}
          <span
            className={`px-2 py-0.5 rounded font-bold border ${
              rubric.passed
                ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-400'
                : 'bg-amber-950/60 border-amber-600/70 text-amber-400'
            }`}
          >
            {rubric.overallScore}% {rubric.passed ? 'VALIDATED' : 'REVISION FLAG'}
          </span>
        </div>
      </div>

      {/* 4 Labeled Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {meters.map((meter, i) => (
          <div key={i} className="bg-[#0f1013] border border-[#22252e] rounded p-3 font-mono space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#c7c4bc] font-medium text-[11px] truncate">{meter.label}</span>
              {meter.passed ? (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-0.5">
                  <Check className="w-3 h-3 text-emerald-400" />
                  {meter.score}%
                </span>
              ) : (
                <span className="text-amber-400 text-xs font-bold">
                  {meter.score}%
                </span>
              )}
            </div>

            {/* Meter Bar */}
            <div className="h-1.5 w-full bg-[#1c1e26] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  meter.passed ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${meter.score}%` }}
              />
            </div>

            <div className="text-[10px] text-[#9c9990] truncate pt-0.5">
              {meter.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Critique or Validation Confirmation note */}
      {rubric.critiques.length > 0 ? (
        <div className="mt-3 p-2.5 bg-[#20150e] border border-amber-700/60 rounded text-xs text-amber-300 font-mono">
          <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>CRITIQUE ITEMS IDENTIFIED:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[#d8d5ce] text-[11px] font-sans">
            {rubric.critiques.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-3 p-2 bg-[#0d1612] border border-emerald-900/60 rounded text-[11px] text-emerald-300 font-mono flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            [AUDIT PASS]: 100% evidence citations verified in Zetaris store. Chronological causal order validated.
          </span>
        </div>
      )}
    </div>
  );
};
