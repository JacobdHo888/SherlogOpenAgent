import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Award,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Layers,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { defaultBenchmarkRunner } from '../benchmark/runner';
import { BenchmarkSuiteResult } from '../benchmark/types';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; currentId: string } | null>(null);
  const [result, setResult] = useState<BenchmarkSuiteResult | null>(null);
  const [incidentCount, setIncidentCount] = useState<number>(10);
  const [copiedMd, setCopiedMd] = useState(false);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  const runBenchmark = async () => {
    setIsRunning(true);
    setProgress({ done: 0, total: incidentCount, currentId: 'Initializing...' });
    try {
      const suiteResult = await defaultBenchmarkRunner.runBenchmark(
        incidentCount,
        (done, total, currentId) => {
          setProgress({ done, total, currentId });
        }
      );
      setResult(suiteResult);
    } catch (e) {
      console.error('Benchmark run failed:', e);
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    const md = defaultBenchmarkRunner.generateResultsMarkdown(result);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'results.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const md = defaultBenchmarkRunner.generateResultsMarkdown(result);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'results.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-[#14161b] border border-[#383c48] rounded-lg max-w-4xl w-full shadow-2xl overflow-hidden text-[#f2efe9] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#23262f] bg-[#0f1013]">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-serif font-bold text-base text-[#f2efe9]">
                Sherlog Generalization Benchmark Suite
              </h2>
              <p className="text-[11px] font-mono text-[#9c9990]">
                Evaluates N randomized incidents with ground truth & held-out unseen failure mode
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#9c9990] hover:text-[#f2efe9] hover:bg-[#20222a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 max-h-[75vh]">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-[#0e0f13] border border-[#272a33]">
            <div className="flex items-center gap-3">
              <label htmlFor="benchmark-count" className="text-xs font-mono text-[#9c9990]">
                Incident Count:
              </label>
              <select
                id="benchmark-count"
                value={incidentCount}
                onChange={(e) => setIncidentCount(parseInt(e.target.value, 10))}
                disabled={isRunning}
                className="bg-[#16181e] border border-[#272a33] text-[#f2efe9] text-xs font-mono rounded px-2.5 py-1"
              >
                <option value={5}>5 Incidents (Fast sample)</option>
                <option value={10}>10 Incidents (Standard suite)</option>
                <option value={15}>15 Incidents (Extended stress)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {result && (
                <>
                  <button
                    onClick={handleCopyMarkdown}
                    className="px-3 py-1.5 rounded bg-[#16181e] hover:bg-[#22252e] border border-[#272a33] text-xs font-mono text-[#c7c4bc] hover:text-[#f2efe9] flex items-center gap-1.5 transition-colors"
                  >
                    {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{copiedMd ? 'Copied MD' : 'Copy MD'}</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="px-3 py-1.5 rounded bg-[#16181e] hover:bg-[#22252e] border border-[#272a33] text-xs font-mono text-[#c7c4bc] hover:text-[#f2efe9] flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>results.md</span>
                  </button>

                  <button
                    onClick={handleDownloadJson}
                    className="px-3 py-1.5 rounded bg-[#16181e] hover:bg-[#22252e] border border-[#272a33] text-xs font-mono text-[#c7c4bc] hover:text-[#f2efe9] flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>results.json</span>
                  </button>
                </>
              )}

              <button
                onClick={runBenchmark}
                disabled={isRunning}
                className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Running Benchmark...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Benchmark</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          {isRunning && progress && (
            <div className="p-4 rounded-lg bg-[#0e0f13] border border-amber-500/30 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">
                  Evaluating case {progress.done} / {progress.total}
                </span>
                <span className="text-[#9c9990]">{progress.currentId}</span>
              </div>
              <div className="h-1.5 w-full bg-[#1c1e26] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Results Summary Grid */}
          {result && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
                {/* Top-1 Accuracy */}
                <div className="bg-[#0e0f13] p-3 rounded-lg border border-[#272a33]">
                  <div className="text-[10px] uppercase text-[#9c9990] mb-1">Top-1 Accuracy</div>
                  <div className="text-lg font-bold text-emerald-400">{result.top1AccuracyPct}%</div>
                  <div className="text-[10px] text-[#67655e]">Causal ground truth</div>
                </div>

                {/* Top-3 Accuracy */}
                <div className="bg-[#0e0f13] p-3 rounded-lg border border-[#272a33]">
                  <div className="text-[10px] uppercase text-[#9c9990] mb-1">Top-3 Accuracy</div>
                  <div className="text-lg font-bold text-emerald-400">{result.top3AccuracyPct}%</div>
                  <div className="text-[10px] text-[#67655e]">Within candidate set</div>
                </div>

                {/* Citation Validity */}
                <div className="bg-[#0e0f13] p-3 rounded-lg border border-[#272a33]">
                  <div className="text-[10px] uppercase text-[#9c9990] mb-1">Citation Validity</div>
                  <div className="text-lg font-bold text-emerald-400">{result.citationValidityPct}%</div>
                  <div className="text-[10px] text-[#67655e]">0 phantom IDs</div>
                </div>

                {/* Avg Duration */}
                <div className="bg-[#0e0f13] p-3 rounded-lg border border-[#272a33]">
                  <div className="text-[10px] uppercase text-[#9c9990] mb-1">Avg Time to Answer</div>
                  <div className="text-lg font-bold text-[#f2efe9]">
                    {(result.avgDurationMs / 1000).toFixed(2)}s
                  </div>
                  <div className="text-[10px] text-[#67655e]">End-to-end loop</div>
                </div>

                {/* Evaluator Retries */}
                <div className="bg-[#0e0f13] p-3 rounded-lg border border-[#272a33]">
                  <div className="text-[10px] uppercase text-[#9c9990] mb-1">Evaluator Retries</div>
                  <div className="text-lg font-bold text-amber-400">{result.totalEvaluatorRetries}</div>
                  <div className="text-[10px] text-[#67655e]">Critique loopbacks</div>
                </div>

                {/* Human Escalations */}
                <div className="bg-[#0e0f13] p-3 rounded-lg border border-[#272a33]">
                  <div className="text-[10px] uppercase text-[#9c9990] mb-1">Escalations</div>
                  <div className="text-lg font-bold text-[#f2efe9]">{result.humanEscalationCount}</div>
                  <div className="text-[10px] text-[#67655e]">Confidence &lt; 70%</div>
                </div>
              </div>

              {/* Special Held-Out Unseen Case Section */}
              <div className="bg-[#0e0f13] border border-[#272a33] rounded-lg p-5 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-[#f2efe9] uppercase tracking-wide">
                      Held-Out Unseen Case Performance (Zero Memory Seeding)
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                      result.heldOutPerformance.top1Matched
                        ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-400'
                        : 'bg-red-950/70 border-red-700/60 text-red-400'
                    }`}
                  >
                    {result.heldOutPerformance.top1Matched ? 'AUTONOMOUS GENERALIZATION: PASSED' : 'HELD-OUT FAILED'}
                  </span>
                </div>

                <p className="text-[#c7c4bc] font-sans text-xs leading-relaxed">
                  Failure mode: <code className="text-amber-300">clock_skew_drift</code> (Systemd timesyncd desync on worker node causing forward JWT nbf timestamps).
                  This incident archetype was strictly withheld from all prompt few-shot examples and H-MEM episodic memory seeding to verify raw investigative reasoning.
                </p>

                <div className="text-[11px] text-[#9c9990] pt-1 border-t border-[#1a1c22]">
                  Predicted Diagnosis: <strong className="text-[#f2efe9]">{result.heldOutPerformance.predictedCause}</strong> · Citation Validity: <strong className="text-emerald-400">{result.heldOutPerformance.citationValidityPct}%</strong>
                </div>
              </div>

              {/* Detailed Case-by-Case Breakdown */}
              <div className="space-y-3">
                <div className="text-xs uppercase font-mono tracking-wider text-[#9c9990]">
                  Incident-by-Incident Evaluation Breakdown ({result.caseResults.length} cases)
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {result.caseResults.map((c) => {
                    const isExpanded = expandedCaseId === c.caseId;
                    return (
                      <div
                        key={c.caseId}
                        className="bg-[#0e0f13] border border-[#22252e] rounded-md overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedCaseId(isExpanded ? null : c.caseId)}
                          className="w-full p-3 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-[#16181e] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {c.top1Matched ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                            )}
                            <span className="font-bold text-amber-400">[{c.caseId}]</span>
                            <span className="text-[#f2efe9] font-sans font-medium truncate">
                              {c.incidentTitle}
                            </span>
                            {c.isHeldOut && (
                              <span className="bg-amber-950/60 border border-amber-600/60 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0">
                                HELD-OUT
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#9c9990]">
                            <span>{c.groundTruthType}</span>
                            <span>·</span>
                            <span className="text-emerald-400 font-bold">{c.citationValidityRate}% cites</span>
                            <span>·</span>
                            <span>{c.durationMs}ms</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-4 border-t border-[#1c1e26] bg-[#14161b] space-y-2 text-xs leading-relaxed animate-in fade-in duration-150">
                            <div>
                              <span className="text-[#9c9990] uppercase text-[10px] font-bold block mb-0.5">
                                Ground Truth Cause:
                              </span>
                              <p className="text-[#f2efe9]">{c.groundTruthCause}</p>
                            </div>

                            <div>
                              <span className="text-amber-400 uppercase text-[10px] font-bold block mb-0.5">
                                Predicted Top-1 Cause:
                              </span>
                              <p className="text-[#c7c4bc]">{c.predictedCause} ({c.topConfidence}% confidence)</p>
                            </div>

                            {c.failureReason && (
                              <div className="p-2.5 rounded bg-red-950/30 border border-red-800/40 text-red-300 text-xs">
                                <strong>Failure Analysis: </strong>{c.failureReason}
                              </div>
                            )}

                            <div className="text-[11px] text-[#9c9990] pt-1">
                              Cited Evidence IDs: {c.citedEvidenceIds.map((id) => `[${id}]`).join(', ')} · Evaluator retries: {c.evaluatorRetries}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {!result && !isRunning && (
            <div className="bg-[#0e0f13] border border-[#272a33] rounded-lg p-12 text-center text-[#9c9990] space-y-2 font-mono text-sm">
              <p className="font-serif text-lg text-[#f2efe9]">Ready to evaluate Sherlog across multiple incidents</p>
              <p className="text-xs">
                Click "Run Benchmark" to test accuracy, citations, and unseen generalization across 10 randomized scenarios.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-3.5 border-t border-[#23262f] bg-[#0f1013] text-xs font-mono text-[#9c9990]">
          <span>Export results via CLI with: <code className="text-amber-400">npm run benchmark</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#20222a] hover:bg-[#2b2e38] text-[#f2efe9] rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
