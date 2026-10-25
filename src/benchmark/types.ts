import { EvidenceRow, IncidentAlert } from '../types/investigation';

export type BenchmarkIncidentType =
  | 'deploy_config_change'
  | 'scheduler_change'
  | 'dependency_failure'
  | 'resource_exhaustion'
  | 'clock_skew_drift'; // Held-out incident type

export interface BenchmarkCase {
  id: string;
  incident: IncidentAlert;
  evidence: EvidenceRow[];
  groundTruthType: BenchmarkIncidentType;
  groundTruthCause: string;
  isHeldOut: boolean;
  noiseLevel: 'low' | 'medium' | 'high';
}

export interface BenchmarkCaseResult {
  caseId: string;
  incidentTitle: string;
  service: string;
  groundTruthType: BenchmarkIncidentType;
  groundTruthCause: string;
  isHeldOut: boolean;
  top1Matched: boolean;
  top3Matched: boolean;
  predictedCause: string;
  topConfidence: number;
  citationValidityRate: number;
  totalCitations: number;
  durationMs: number;
  evaluatorRetries: number;
  humanEscalationRequired: boolean;
  failureReason?: string;
  citedEvidenceIds: string[];
}

export interface BenchmarkSuiteResult {
  timestamp: string;
  totalCases: number;
  standardCasesCount: number;
  heldOutCasesCount: number;
  top1AccuracyPct: number;
  top3AccuracyPct: number;
  citationValidityPct: number;
  avgDurationMs: number;
  totalEvaluatorRetries: number;
  humanEscalationCount: number;
  heldOutPerformance: {
    top1Matched: boolean;
    top3Matched: boolean;
    citationValidityPct: number;
    predictedCause: string;
    details: string;
  };
  caseResults: BenchmarkCaseResult[];
}
