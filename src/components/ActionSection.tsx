import React, { useState } from 'react';
import {
  Wrench,
  FileText,
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Terminal,
  ShieldCheck,
  X,
} from 'lucide-react';
import { IncidentReportDraft, RemediationRecommendation } from '../types/investigation';

interface ActionSectionProps {
  recommendations: RemediationRecommendation[];
  incidentReport: IncidentReportDraft | null;
  onInspectEvidence: (evidenceId: string) => void;
  isInvestigating: boolean;
}

export const ActionSection: React.FC<ActionSectionProps> = ({
  recommendations,
  incidentReport,
  onInspectEvidence,
  isInvestigating,
}) => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const handleCopyMarkdown = () => {
    if (!incidentReport) return;
    navigator.clipboard.writeText(incidentReport.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!incidentReport) return;
    const blob = new Blob([incidentReport.markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${incidentReport.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return 'text-emerald-400 bg-emerald-950/70 border border-emerald-700/60';
      case 'medium':
        return 'text-amber-400 bg-amber-950/70 border border-amber-700/60';
      case 'high':
        return 'text-red-400 bg-red-950/70 border border-red-700/60';
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-[#14161b] border border-[#272a33] rounded-lg p-12 text-center text-[#9c9990] space-y-2">
        <p className="font-serif text-lg text-[#f2efe9]">Remediation fixes pending</p>
        <p className="text-sm">
          {isInvestigating
            ? 'Evaluator is validating causal hypotheses. Concrete fixes will be formulated once root cause is confirmed.'
            : 'Click "Start investigation" to evaluate causes and generate concrete remediation actions.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Draft Report Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#23262f]">
        <div>
          <h2 className="text-base sm:text-lg font-serif font-bold text-[#f2efe9]">
            Validated Remediation Actions
          </h2>
          <p className="text-xs text-[#9c9990] font-mono">
            {recommendations.length} concrete fixes formulated with 100% cited evidence verification
          </p>
        </div>

        {/* Draft Incident Report Button */}
        <button
          onClick={() => setIsReportOpen(true)}
          className="px-3.5 py-1.5 rounded bg-[#1a1c24] hover:bg-[#232630] border border-amber-500/40 text-amber-400 hover:text-amber-300 font-mono text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Draft incident report</span>
        </button>
      </div>

      {/* Concrete Fix Cards */}
      <div className="space-y-4">
        {recommendations.map((rec, idx) => (
          <div
            key={rec.id}
            className="bg-[#14161b] border border-[#272a33] rounded-lg p-5 sm:p-6 space-y-4 text-sm shadow-sm"
          >
            {/* Fix Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[#9c9990] font-bold">FIX #{idx + 1}</span>
                  <span className="text-[#363942]">·</span>
                  <span className={`px-2 py-0.2 rounded font-bold uppercase ${getRiskBadge(rec.riskLevel)}`}>
                    {rec.riskLevel} risk
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#f2efe9]">
                  {rec.title}
                </h3>
              </div>
            </div>

            {/* Action Description */}
            <div className="bg-[#0e0f13] p-4 rounded-md border border-[#23262f] space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Action to Execute:
              </div>
              <p className="text-[#f2efe9] leading-relaxed text-sm">
                {rec.action}
              </p>
            </div>

            {/* Why It Addresses the Validated Cause */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#9c9990] mb-1 font-semibold">
                Why this addresses the validated cause:
              </div>
              <p className="text-[#c7c4bc] leading-relaxed text-sm">
                {rec.whyExplanation}
              </p>
            </div>

            {/* How to Verify */}
            <div className="flex items-start gap-2.5 p-3 rounded bg-[#0e0f13] border border-[#20222a]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-mono text-emerald-400 font-bold uppercase mr-1.5">
                  Verification procedure:
                </span>
                <span className="text-[#d8d5ce]">{rec.verificationStep}</span>
              </div>
            </div>

            {/* Command Snippet (if available) */}
            {rec.commandSnippet && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#9c9990]">
                  <span>Execution snippet:</span>
                  <button
                    onClick={() => handleCopySnippet(rec.id, rec.commandSnippet!)}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedSnippetId === rec.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy command</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-[#0e0f13] p-3 rounded border border-[#272a33] font-mono text-xs text-amber-300 overflow-x-auto">
                  {rec.commandSnippet}
                </pre>
              </div>
            )}

            {/* Evidence IDs it relies on */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#20222a] text-xs">
              <span className="text-[#9c9990] font-mono">Relies on verified evidence:</span>
              {rec.citedEvidenceIds.map((id) => (
                <button
                  key={id}
                  onClick={() => onInspectEvidence(id)}
                  className="font-mono text-amber-400 hover:text-amber-300 bg-[#1a1c24] hover:bg-[#22252e] border border-amber-500/30 px-2 py-0.5 rounded transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  title="Inspect raw evidence row"
                >
                  <span>[{id}]</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Incident Report Modal */}
      {isReportOpen && incidentReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
          <div className="bg-[#14161b] border border-[#383c48] rounded-lg max-w-3xl w-full shadow-2xl overflow-hidden text-[#f2efe9] flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#23262f] bg-[#0f1013]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-base text-[#f2efe9]">
                  {incidentReport.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Copy as Markdown */}
                <button
                  onClick={handleCopyMarkdown}
                  className="px-3 py-1.5 rounded bg-[#1a1c24] hover:bg-[#232630] border border-[#272a33] text-xs font-mono text-[#f2efe9] flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy as Markdown</span>
                    </>
                  )}
                </button>

                {/* Download .md */}
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Download .md</span>
                </button>

                <button
                  onClick={() => setIsReportOpen(false)}
                  className="p-1.5 rounded text-[#9c9990] hover:text-[#f2efe9] hover:bg-[#20222a] transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Markdown Document Preview */}
            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs leading-relaxed max-h-[70vh] bg-[#0c0d10]">
              <pre className="whitespace-pre-wrap text-[#d8d5ce] font-mono leading-relaxed select-text">
                {incidentReport.markdownContent}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-3.5 border-t border-[#23262f] bg-[#0f1013] text-xs text-[#9c9990]">
              <span>Ready for incident channel and engineering post-mortem repository.</span>
              <button
                onClick={() => setIsReportOpen(false)}
                className="px-4 py-1 rounded bg-[#20222a] hover:bg-[#2b2e38] text-[#f2efe9] text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
