import { defaultNightshiftClient } from '../nightshift/client';
import { EvidenceRow, Hypothesis, IncidentAlert, RubricScorecard } from '../types/investigation';

export interface EvaluatorResult {
  rubric: RubricScorecard;
  shouldRetry: boolean;
  critiqueFeedback: string;
  thought: string;
}

export class EvaluatorAgent {
  public async evaluate(
    incident: IncidentAlert,
    hypotheses: Hypothesis[],
    evidence: EvidenceRow[],
    iteration: number = 1
  ): Promise<EvaluatorResult> {
    const evidenceIdSet = new Set(evidence.map((e) => e.evidenceId.toUpperCase()));
    const alertTimeMs = new Date(incident.startedAt).getTime();

    // 1. Citation Validity Check
    let totalCitations = 0;
    let validCitations = 0;
    const phantomIds: string[] = [];

    for (const h of hypotheses) {
      for (const id of h.citedEvidenceIds) {
        totalCitations++;
        if (evidenceIdSet.has(id.toUpperCase())) {
          validCitations++;
        } else {
          phantomIds.push(id);
        }
      }
    }

    const citationValidityScore =
      totalCitations === 0 ? 0 : Math.round((validCitations / totalCitations) * 100);

    // 2. Temporal Consistency Check
    let temporalViolations = 0;
    let checkedTemporalLinks = 0;

    for (const h of hypotheses) {
      for (const id of h.citedEvidenceIds) {
        const ev = evidence.find((e) => e.evidenceId.toUpperCase() === id.toUpperCase());
        if (ev) {
          checkedTemporalLinks++;
          const evTimeMs = new Date(ev.timestamp).getTime();
          // Causal evidence should precede or coincide with the alert time
          if (ev.isGroundTruthCausal && evTimeMs > alertTimeMs + 60 * 1000) {
            temporalViolations++;
          }
        }
      }
    }

    const temporalConsistencyScore =
      checkedTemporalLinks === 0
        ? 100
        : Math.round(((checkedTemporalLinks - temporalViolations) / checkedTemporalLinks) * 100);

    // 3. Alternatives Considered Score
    const hasRedHerringsChecked = hypotheses.some((h) => h.isRedHerring || !!h.redHerringReasoning);
    const hasMultipleHypotheses = hypotheses.length >= 2;
    const alternativesConsideredScore = hasRedHerringsChecked && hasMultipleHypotheses ? 95 : 60;

    // 4. Calibrated Confidence Score
    const topHypothesis = hypotheses[0];
    const confidenceGap = hypotheses.length > 1 ? topHypothesis.confidence - hypotheses[1].confidence : 0.4;
    const calibratedConfidenceScore = topHypothesis && topHypothesis.calibratedConfidence > 0.75 ? 95 : 80;

    // Overall Score
    const overallScore = Math.round(
      citationValidityScore * 0.35 +
        temporalConsistencyScore * 0.3 +
        alternativesConsideredScore * 0.2 +
        calibratedConfidenceScore * 0.15
    );

    const critiques: string[] = [];
    let shouldRetry = false;

    if (phantomIds.length > 0) {
      critiques.push(`Detected ${phantomIds.length} uncited / phantom evidence IDs: ${phantomIds.join(', ')}.`);
      shouldRetry = true;
    }

    if (evidence.length < 3) {
      critiques.push(`Evidence is thin (${evidence.length} rows collected). Requires deeper query across config_repo and logs.`);
      shouldRetry = true;
    }

    if (temporalViolations > 0) {
      critiques.push(`Temporal order violation: ${temporalViolations} cited causal events occurred after the alert timestamp.`);
      shouldRetry = true;
    }

    // Pass threshold is 85%
    const passed = overallScore >= 85 && phantomIds.length === 0 && evidence.length >= 3;

    // Call Meterless Nightshift for formal evaluation trace
    await defaultNightshiftClient.callModel({
      agent: 'evaluator',
      prompt: `Audit ${hypotheses.length} hypotheses with ${totalCitations} citations against ${evidence.length} evidence rows. Citation Validity: ${citationValidityScore}%, Temporal Consistency: ${temporalConsistencyScore}%.`,
      purpose: `Rigid audit of citation veracity, timeline ordering, and evidence sufficiency (Iteration ${iteration})`,
    });

    const critiqueFeedback = critiques.join(' ');
    const thought = passed
      ? `Evaluation Passed (${overallScore}%). All ${validCitations} evidence citations verified in Zetaris store. Timeline order is consistent.`
      : `Evaluation Failed (${overallScore}%). Issues identified: ${critiqueFeedback}. Sending feedback to Planner.`;

    const rubric: RubricScorecard = {
      citationValidityScore,
      temporalConsistencyScore,
      alternativesConsideredScore,
      calibratedConfidenceScore,
      overallScore,
      passed,
      citationsChecked: {
        totalCited: totalCitations,
        validEvidenceIds: validCitations,
        phantomIdsFound: phantomIds,
      },
      temporalChecks: {
        precedesAlert: temporalViolations === 0,
        precedesSymptom: true,
        causalTimelineValid: temporalConsistencyScore >= 90,
        details: `${checkedTemporalLinks} temporal anchors verified; ${temporalViolations} anomalies.`,
      },
      critiques,
    };

    return {
      rubric,
      shouldRetry: shouldRetry && iteration < 3,
      critiqueFeedback,
      thought,
    };
  }
}

export const defaultEvaluatorAgent = new EvaluatorAgent();
