export type AgentType = 'planner' | 'investigator' | 'evaluator' | 'risk_domain' | 'hmem_engine' | 'remediation';

export type AIModelId =
  | 'nvidia/nemotron-4-340b-instruct'
  | 'meterless/nightshift-router-v1'
  | 'meterless/h-mem-v2'
  | 'meta-llama/llama-3.1-70b-instruct';

export interface ModelCallLog {
  id: string;
  timestamp: string;
  agent: AgentType;
  model: string;
  provider: 'Meterless Nightshift' | 'Meterless Engine (H-MEM)';
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  status: 'success' | 'retry' | 'fallback' | 'failed';
  purpose: string;
}

export type ZetarisSourceType = 'logs' | 'deploy_history' | 'metrics' | 'tickets' | 'config_repo';

export interface EvidenceRow {
  evidenceId: string; // e.g. EV-LOG-101, EV-DEP-202
  source: ZetarisSourceType;
  timestamp: string;
  service: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  title: string;
  content: string;
  structuredData: Record<string, any>;
  isGroundTruthCausal?: boolean;
  isRedHerring?: boolean;
}

export interface ZetarisQueryResult {
  queryId: string;
  sql: string;
  targetTable: string;
  executionTimeMs: number;
  rowCount: number;
  data: EvidenceRow[];
  timestamp: string;
  sourceEndpoint: string;
  mode: 'live-docker' | 'sample-virtualized';
}

export interface PlanStep {
  stepId: string;
  source: ZetarisSourceType;
  objective: string;
  suggestedSql: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed';
  resultCount?: number;
}

export interface InvestigationPlan {
  rationale: string;
  targetServices: string[];
  timeWindow: {
    from: string;
    to: string;
  };
  steps: PlanStep[];
  iteration: number;
}

export interface Hypothesis {
  id: string;
  rank: number;
  title: string;
  category: 'configuration' | 'deployment' | 'infrastructure' | 'external_dependency' | 'code_bug';
  confidence: number; // 0 to 1
  calibratedConfidence: number;
  primaryCause: string;
  whyExplanation: string; // The core "Explain Why" answer
  citedEvidenceIds: string[]; // e.g. ["EV-DEP-101", "EV-CFG-204"]
  temporalOrderValid: boolean;
  isRedHerring: boolean;
  redHerringReasoning?: string;
  counterEvidenceConsidered?: string;
  recommendedFix: string;
}

export interface RubricScorecard {
  citationValidityScore: number; // 0 - 100%
  temporalConsistencyScore: number; // 0 - 100%
  alternativesConsideredScore: number; // 0 - 100%
  calibratedConfidenceScore: number; // 0 - 100%
  overallScore: number; // 0 - 100%
  passed: boolean;
  citationsChecked: {
    totalCited: number;
    validEvidenceIds: number;
    phantomIdsFound: string[];
  };
  temporalChecks: {
    precedesAlert: boolean;
    precedesSymptom: boolean;
    causalTimelineValid: boolean;
    details: string;
  };
  critiques: string[];
}

export interface HMemMatch {
  pastIncidentId: string;
  title: string;
  resolvedAt: string;
  rootCauseCategory: string;
  similarityScore: number; // 0 - 1
  lessonsLearned: string;
  resolutionTimeMins: number;
  remedyAction: string;
  relevantConfigs: string[];
}

export interface AgentTraceStep {
  id: string;
  agent: AgentType;
  agentLabel: string;
  timestamp: string;
  modelUsed: string;
  title: string;
  thought: string;
  actionTaken: string;
  evidenceProducedCount?: number;
  critiqueFeedback?: string;
  durationMs: number;
  isCritiqueIteration?: boolean;
}

export interface IncidentAlert {
  id: string;
  title: string;
  service: string;
  environment: string;
  severity: 'P1' | 'P2' | 'P3';
  startedAt: string;
  symptomDescription: string;
  initialMetrics: {
    errorRate: string;
    p99Latency: string;
    affectedUsers: string;
  };
  knownGroundTruth?: {
    cause: string;
    redHerrings: string[];
    causalEvidenceIds: string[];
  };
}

export interface RemediationRecommendation {
  id: string;
  title: string;
  action: string;
  whyExplanation: string;
  riskLevel: 'low' | 'medium' | 'high';
  verificationStep: string;
  citedEvidenceIds: string[];
  rollbackPlan?: string;
  commandSnippet?: string;
}

export interface IncidentReportDraft {
  title: string;
  generatedAt: string;
  summary: string;
  impact: string;
  timeline: { timestamp: string; event: string; evidenceId?: string }[];
  rootCause: string;
  evidenceCited: string[];
  recommendedFixes: RemediationRecommendation[];
  followUps: string[];
  markdownContent: string;
}

export interface FullInvestigationState {
  incident: IncidentAlert;
  status: 'idle' | 'planning' | 'investigating' | 'evaluating' | 'challenging' | 'completed' | 'failed';
  currentIteration: number;
  maxIterations: number;
  plan: InvestigationPlan | null;
  collectedEvidence: EvidenceRow[];
  queryLogs: ZetarisQueryResult[];
  modelLogs: ModelCallLog[];
  traces: AgentTraceStep[];
  hmemMatches: HMemMatch[];
  hypotheses: Hypothesis[];
  rubric: RubricScorecard | null;
  recommendations: RemediationRecommendation[];
  incidentReport: IncidentReportDraft | null;
  error?: string;
}
