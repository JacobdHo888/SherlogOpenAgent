import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IncidentAlertCard } from './components/IncidentAlertCard';
import { AgentTraceView } from './components/AgentTraceView';
import { HypothesesView } from './components/HypothesesView';
import { EvaluatorScorecardView } from './components/EvaluatorScorecardView';
import { EvidenceTimelineView } from './components/EvidenceTimelineView';
import { HMemRecallView } from './components/HMemRecallView';
import { ZetarisQueryExplorer } from './components/ZetarisQueryExplorer';
import { EvidenceInspectModal } from './components/EvidenceInspectModal';
import { TestRunnerModal } from './components/TestRunnerModal';
import { SEEDED_INCIDENTS } from './data/incidents';
import { generateRandomIncident } from './data/generator';
import { globalSampleStore } from './data/sampleStore';
import { defaultZetarisClient } from './zetaris/client';
import { InvestigationOrchestrator } from './agents/orchestrator';
import { EvidenceRow, FullInvestigationState, IncidentAlert } from './types/investigation';
import { Database, BrainCircuit, Activity } from 'lucide-react';

export default function App() {
  const [activeIncidentId, setActiveIncidentId] = useState<string>('INC-8921');
  const [currentIncident, setCurrentIncident] = useState<IncidentAlert>(
    SEEDED_INCIDENTS['INC-8921'].incident
  );
  const [mode, setMode] = useState<'sample' | 'live'>('sample');
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [investigationState, setInvestigationState] = useState<FullInvestigationState | null>(null);

  // Inspector & Interactive Evidence Selection
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState<boolean>(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);

  // Bottom secondary folder tab
  const [activeFolderTab, setActiveFolderTab] = useState<'zetaris' | 'hmem'>('zetaris');

  // Handle switching incident
  const handleSelectIncident = (id: string) => {
    setActiveIncidentId(id);
    const bundle = SEEDED_INCIDENTS[id];
    if (bundle) {
      setCurrentIncident(bundle.incident);
      globalSampleStore.setEvidenceForIncident(bundle.evidence);
    }
  };

  // Handle random synthetic incident generation
  const handleGenerateRandom = () => {
    const generated = generateRandomIncident();
    setCurrentIncident(generated.incident);
    setActiveIncidentId(generated.incident.id);
    globalSampleStore.setEvidenceForIncident(generated.evidenceRows);
  };

  // Run the investigation
  const runInvestigation = async () => {
    setIsInvestigating(true);
    defaultZetarisClient.setMode(mode);

    const orchestrator = new InvestigationOrchestrator(currentIncident, (updatedState) => {
      setInvestigationState({ ...updatedState });
    });

    try {
      await orchestrator.runFullInvestigation();
    } catch (e) {
      console.error('Investigation failed:', e);
    } finally {
      setIsInvestigating(false);
    }
  };

  // Handle clicking an evidence chip:
  // Highlights the node on the timeline and opens the raw source inspector
  const handleInspectEvidence = (evidenceId: string) => {
    setSelectedEvidenceId(evidenceId);
    setIsInspectModalOpen(true);
  };

  // Run initial investigation on mount for default incident
  useEffect(() => {
    const bundle = SEEDED_INCIDENTS[activeIncidentId];
    if (bundle) {
      globalSampleStore.setEvidenceForIncident(bundle.evidence);
      runInvestigation();
    }
  }, [activeIncidentId]);

  // Find evidence row for inspector modal
  const activeEvidenceRow =
    selectedEvidenceId && investigationState
      ? investigationState.collectedEvidence.find(
          (e) => e.evidenceId.toLowerCase() === selectedEvidenceId.toLowerCase()
        ) || globalSampleStore.getById(selectedEvidenceId) || null
      : null;

  return (
    <div className="min-h-screen bg-[#0e0f12] text-[#f2efe9] flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Console Navigation */}
      <Header
        activeIncidentId={activeIncidentId}
        onSelectIncident={handleSelectIncident}
        onGenerateRandom={handleGenerateRandom}
        isInvestigating={isInvestigating}
        onStartInvestigation={runInvestigation}
        onOpenTestModal={() => setIsTestModalOpen(true)}
        mode={mode}
        onToggleMode={(m) => {
          setMode(m);
          defaultZetarisClient.setMode(m);
        }}
      />

      {/* Main Workspace: 3-Zone Layout */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* Zone 1 (Top): Case Header with Title, Started Timestamp, Severity, Telemetry */}
        <IncidentAlertCard incident={currentIncident} />

        {/* Zone 2 (Left) & Zone 3 (Center/Right) Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Zone 2 (Left): Live Agent Trace (4 cols on lg, sticky on scroll) */}
          <div className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-16">
            <AgentTraceView
              traces={investigationState?.traces || []}
              modelLogs={investigationState?.modelLogs || []}
              isInvestigating={isInvestigating}
              status={investigationState?.status || 'idle'}
            />
          </div>

          {/* Zone 3 (Center / Right): Hypotheses, Scorecard, and Connected Evidence Timeline (8 cols) */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-4">
            {/* Evaluator Score Card (4 Simple Labeled Meters) */}
            <EvaluatorScorecardView rubric={investigationState?.rubric || null} />

            {/* Ranked Hypotheses Case Cards with Confidence Bar and Linked Evidence Chips */}
            <HypothesesView
              hypotheses={investigationState?.hypotheses || []}
              selectedEvidenceId={selectedEvidenceId}
              onInspectEvidence={handleInspectEvidence}
            />

            {/* Connected Cause-and-Effect Evidence Timeline */}
            <EvidenceTimelineView
              evidence={investigationState?.collectedEvidence || []}
              selectedEvidenceId={selectedEvidenceId}
              onInspectEvidence={handleInspectEvidence}
            />

            {/* Secondary Technical Dossiers (Zetaris Queries & H-MEM Past Case Memory) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-[#23262f] pb-2 font-mono text-xs">
                <span className="text-[#67655e] text-[11px] uppercase tracking-wider">
                  Deep Dossier Inspection:
                </span>
                <div className="flex items-center rounded border border-[#272a33] bg-[#0e0f13] p-0.5">
                  <button
                    onClick={() => setActiveFolderTab('zetaris')}
                    className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                      activeFolderTab === 'zetaris'
                        ? 'bg-[#272a33] text-amber-300 font-bold'
                        : 'text-[#9c9990] hover:text-[#f2efe9]'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span>Zetaris Federated Queries ({investigationState?.queryLogs.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveFolderTab('hmem')}
                    className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                      activeFolderTab === 'hmem'
                        ? 'bg-[#272a33] text-amber-300 font-bold'
                        : 'text-[#9c9990] hover:text-[#f2efe9]'
                    }`}
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                    <span>H-MEM Memory Recall ({investigationState?.hmemMatches.length || 0})</span>
                  </button>
                </div>
              </div>

              {activeFolderTab === 'zetaris' && (
                <ZetarisQueryExplorer queryLogs={investigationState?.queryLogs || []} />
              )}

              {activeFolderTab === 'hmem' && (
                <HMemRecallView matches={investigationState?.hmemMatches || []} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Evidence Raw Source Row Inspector Modal */}
      <EvidenceInspectModal
        evidence={activeEvidenceRow}
        onClose={() => setIsInspectModalOpen(false)}
      />

      {/* Automated Forensic Test Suite Modal */}
      <TestRunnerModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#1e2027] bg-[#0c0d10] py-3 text-center text-xs font-mono text-[#67655e]">
        <div className="max-w-[1560px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SHERLOG INCIDENT DOSSIER · OPEN AGENT HACKATHON 2026</span>
          <div className="flex items-center gap-2 text-[11px] text-[#9c9990]">
            <span>Zetaris Virtual Data Layer</span>
            <span className="text-[#363942]">·</span>
            <span>Meterless Nightshift (Nemotron 340B)</span>
            <span className="text-[#363942]">·</span>
            <span>H-MEM Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
