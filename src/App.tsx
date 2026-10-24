import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IncidentAlertCard } from './components/IncidentAlertCard';
import { NavigationTabs, ActiveSection } from './components/NavigationTabs';
import { AnswerSection } from './components/AnswerSection';
import { EvidenceSection } from './components/EvidenceSection';
import { AgentTraceView } from './components/AgentTraceView';
import { EvaluatorScorecardView } from './components/EvaluatorScorecardView';
import { EvidenceInspectModal } from './components/EvidenceInspectModal';
import { TestRunnerModal } from './components/TestRunnerModal';
import { SEEDED_INCIDENTS } from './data/incidents';
import { generateRandomIncident } from './data/generator';
import { globalSampleStore } from './data/sampleStore';
import { defaultZetarisClient } from './zetaris/client';
import { InvestigationOrchestrator } from './agents/orchestrator';
import { EvidenceRow, FullInvestigationState, IncidentAlert } from './types/investigation';

export default function App() {
  const [activeIncidentId, setActiveIncidentId] = useState<string>('INC-8921');
  const [currentIncident, setCurrentIncident] = useState<IncidentAlert>(
    SEEDED_INCIDENTS['INC-8921'].incident
  );
  const [mode, setMode] = useState<'sample' | 'live'>('sample');
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [investigationState, setInvestigationState] = useState<FullInvestigationState | null>(null);

  // Active section (Answer is default, shows only ONE section at a time)
  const [activeSection, setActiveSection] = useState<ActiveSection>('answer');

  // Selected evidence for timeline & side-drawer
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [inspectModalEvidence, setInspectModalEvidence] = useState<EvidenceRow | null>(null);

  // Test suite modal
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);

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

  // Run initial investigation on mount for default incident
  useEffect(() => {
    const bundle = SEEDED_INCIDENTS[activeIncidentId];
    if (bundle) {
      globalSampleStore.setEvidenceForIncident(bundle.evidence);
      runInvestigation();
    }
  }, [activeIncidentId]);

  // Handle inspecting evidence from Answer tab
  const handleInspectEvidenceFromAnswer = (evidenceId: string) => {
    setSelectedEvidenceId(evidenceId);
    const row =
      investigationState?.collectedEvidence.find((e) => e.evidenceId === evidenceId) ||
      globalSampleStore.getById(evidenceId) ||
      null;
    setInspectModalEvidence(row);
  };

  const handleNavigateToEvidence = () => {
    setActiveSection('evidence');
  };

  return (
    <div className="min-h-screen bg-[#0e0f12] text-[#f2efe9] flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. Slim Header */}
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

      {/* Main Content Area: Spacious, Decluttered Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* 2. Compact Incident Summary */}
        <IncidentAlertCard incident={currentIncident} />

        {/* 3. Navigation Bar (Answer, Evidence, Agent trace, Audit) */}
        <NavigationTabs
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          evidenceCount={investigationState?.collectedEvidence.length || 0}
          traceCount={investigationState?.traces.length || 0}
          isInvestigating={isInvestigating}
        />

        {/* 4. Single Active View Panel */}
        <div className="pt-1">
          {activeSection === 'answer' && (
            <AnswerSection
              hypotheses={investigationState?.hypotheses || []}
              onInspectEvidence={handleInspectEvidenceFromAnswer}
              onNavigateToEvidenceTab={handleNavigateToEvidence}
            />
          )}

          {activeSection === 'evidence' && (
            <EvidenceSection
              evidence={investigationState?.collectedEvidence || []}
              selectedEvidenceId={selectedEvidenceId}
              onSelectEvidence={setSelectedEvidenceId}
            />
          )}

          {activeSection === 'trace' && (
            <AgentTraceView
              traces={investigationState?.traces || []}
              modelLogs={investigationState?.modelLogs || []}
              isInvestigating={isInvestigating}
              status={investigationState?.status || 'idle'}
            />
          )}

          {activeSection === 'audit' && (
            <EvaluatorScorecardView
              rubric={investigationState?.rubric || null}
              hmemMatches={investigationState?.hmemMatches || []}
              queryLogs={investigationState?.queryLogs || []}
            />
          )}
        </div>
      </main>

      {/* Evidence Quick-Inspect Modal (triggered from Answer tab) */}
      <EvidenceInspectModal
        evidence={inspectModalEvidence}
        onClose={() => setInspectModalEvidence(null)}
      />

      {/* Automated Verification Test Modal (from Details menu) */}
      <TestRunnerModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      {/* 5. Minimalist Quiet Footer */}
      <footer className="border-t border-[#1a1c22] bg-[#0c0d10] py-4 text-center text-xs text-[#67655e]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sherlog · Incident Investigation Agent</span>
          <div className="flex items-center gap-3 text-[11px] text-[#9c9990]">
            <span>Zetaris Data Fabric</span>
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
