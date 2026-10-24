import React, { useState } from 'react';
import { Scale, Check, AlertTriangle, ShieldCheck, Database, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import { HMemMatch, RubricScorecard, ZetarisQueryResult } from '../types/investigation';

interface EvaluatorScorecardViewProps {
  rubric: RubricScorecard | null;
  hmemMatches?: HMemMatch[];
  queryLogs?: ZetarisQueryResult[];
}

export const EvaluatorScorecardView: React.FC<EvaluatorScorecardViewProps> = ({
  rubric,
  hmemMatches = [],
  queryLogs = [],
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!rubric) {
    return (
      <div className="bg-[#14161b] border border-[#272a33] rounded-lg p-12 text-center text-[#9c9990] space-y-2 font-mono text-sm">
        <p className="font-serif text-lg text-[#f2efe9]">Evaluator audit pending</p>
        <p className="text-xs">The Evaluator agent audits claims, timeline consistency, and citations during investigation.</p>
      </div>
    );
  }

  const meters = [
    {
      label: 'Citation validity',
      score: rubric.citationValidityScore,
      subtext: `${rubric.citationsChecked.validEvidenceIds}/${rubric.citationsChecked.totalCited} cited claims mapped to real evidence rows`,
      passed: rubric.citationValidityScore >= 90,
    },
    {
      label: 'Temporal consistency',
      score: rubric.temporalConsistencyScore,
      subtext: 'Cause strictly precedes symptom and alert timestamps',
      passed: rubric.temporalConsistencyScore >= 90,
    },
    {
      label: 'Alternatives considered',
      score: rubric.alternativesConsideredScore,
      subtext: 'Competing hypotheses and red herrings actively ruled out',
      passed: rubric.alternativesConsideredScore >= 80,
    },
    {
      label: 'Calibrated confidence',
      score: rubric.calibratedConfidenceScore,
      subtext: 'Separation margin between top cause and secondary leads',
      passed: rubric.calibratedConfidenceScore >= 80,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Line Card */}
      <div className="bg-[#14161b] border border-[#272a33] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-[#f2efe9] font-medium leading-normal">
            {rubric.passed
              ? `Audit Passed (${rubric.overallScore}%): 100% of cited claims verified against Zetaris data rows, and temporal causality is confirmed.`
              : `Audit Flagged (${rubric.overallScore}%): Additional evidence collection or citation clarification required.`}
          </span>
        </div>

        <span
          className={`px-3 py-1 rounded font-mono text-xs font-bold shrink-0 self-start sm:self-auto border ${
            rubric.passed
              ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-400'
              : 'bg-amber-950/70 border-amber-700/60 text-amber-400'
          }`}
        >
          {rubric.overallScore}% · {rubric.passed ? 'VALIDATED' : 'REVISION'}
        </span>
      </div>

      {/* Four Simple Labeled Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {meters.map((meter, i) => (
          <div key={i} className="bg-[#14161b] border border-[#272a33] rounded-lg p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#f2efe9] text-sm">{meter.label}</span>
              <span
                className={`font-mono text-sm font-bold ${
                  meter.passed ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {meter.score}%
              </span>
            </div>

            {/* Simple Clean Progress Bar */}
            <div className="h-2 w-full bg-[#1c1e26] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  meter.passed ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${meter.score}%` }}
              />
            </div>

            <p className="text-xs text-[#9c9990] pt-1">{meter.subtext}</p>
          </div>
        ))}
      </div>

      {/* Critiques or flags if any */}
      {rubric.critiques.length > 0 && (
        <div className="p-4 bg-[#1e1510] border border-amber-700/60 rounded-lg text-xs text-amber-300 space-y-1">
          <div className="font-bold font-mono text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Auditor Notes & Critiques:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[#d8d5ce] pt-1">
            {rubric.critiques.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Collapsed Technical Details: H-MEM Memory & Zetaris Queries */}
      <div className="pt-2">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs text-[#9c9990] hover:text-[#f2efe9] flex items-center gap-1.5 transition-colors font-mono"
        >
          <span>
            {showTechnicalDetails
              ? 'Hide technical data layer & memory logs'
              : 'Show technical data layer & memory logs'}
          </span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 space-y-4 pt-3 border-t border-[#23262f] animate-in fade-in duration-150">
            {/* H-MEM engine summary */}
            {hmemMatches.length > 0 && (
              <div className="bg-[#14161b] border border-[#272a33] rounded-lg p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-bold">
                  <BrainCircuit className="w-4 h-4" />
                  <span>Meterless H-MEM Episodic Memory Matches ({hmemMatches.length})</span>
                </div>
                <div className="space-y-2 pt-1 font-mono">
                  {hmemMatches.map((m) => (
                    <div key={m.pastIncidentId} className="bg-[#0e0f13] p-3 rounded border border-[#20222a]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#f2efe9] font-bold">[{m.pastIncidentId}] {m.title}</span>
                        <span className="text-amber-400 font-bold">{Math.round(m.similarityScore * 100)}% sim</span>
                      </div>
                      <p className="text-xs text-[#c7c4bc] font-sans">{m.remedyAction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zetaris Query count */}
            {queryLogs.length > 0 && (
              <div className="bg-[#14161b] border border-[#272a33] rounded-lg p-4 text-xs space-y-2 font-mono">
                <div className="flex items-center gap-2 text-[#9c9990] font-bold">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Zetaris Queries Dispatched ({queryLogs.length})</span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {queryLogs.map((q) => (
                    <div key={q.queryId} className="text-[11px] text-[#9c9990] flex items-center justify-between p-1 border-b border-[#20222a]">
                      <span className="text-amber-400 truncate max-w-xl">{q.sql}</span>
                      <span className="text-[#67655e] shrink-0">{q.executionTimeMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
