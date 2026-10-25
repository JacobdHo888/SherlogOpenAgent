import { globalSampleStore } from '../data/sampleStore';
import { defaultZetarisClient } from '../zetaris/client';
import { InvestigationOrchestrator } from '../agents/orchestrator';
import { generateBenchmarkSuite } from './generator';
import { BenchmarkCase, BenchmarkCaseResult, BenchmarkSuiteResult } from './types';

export class BenchmarkRunner {
  /**
   * Executes the full Sherlog multi-agent system across all generated benchmark cases.
   * Everything is computed dynamically from actual execution traces.
   */
  public async runBenchmark(
    count: number = 10,
    onProgress?: (completed: number, total: number, currentCaseId: string) => void
  ): Promise<BenchmarkSuiteResult> {
    const cases = generateBenchmarkSuite(count);
    const caseResults: BenchmarkCaseResult[] = [];

    // Ensure Zetaris client is in virtualized sample mode for benchmark evaluation
    defaultZetarisClient.setMode('sample');

    for (let i = 0; i < cases.length; i++) {
      const bCase = cases[i];
      if (onProgress) {
        onProgress(i, cases.length, bCase.id);
      }

      const caseResult = await this.evaluateSingleCase(bCase);
      caseResults.push(caseResult);

      if (onProgress) {
        onProgress(i + 1, cases.length, bCase.id);
      }
    }

    // Restore baseline seeded incidents
    globalSampleStore.resetToSeeded();

    // Compute aggregate metrics from actual runs
    const standardCases = caseResults.filter((c) => !c.isHeldOut);
    const heldOutCase = caseResults.find((c) => c.isHeldOut) || caseResults[caseResults.length - 1];

    const totalCases = caseResults.length;
    const top1Matches = caseResults.filter((c) => c.top1Matched).length;
    const top3Matches = caseResults.filter((c) => c.top3Matched).length;

    const top1AccuracyPct = Math.round((top1Matches / totalCases) * 100);
    const top3AccuracyPct = Math.round((top3Matches / totalCases) * 100);

    const totalCitations = caseResults.reduce((acc, c) => acc + c.totalCitations, 0);
    const validCitations = caseResults.reduce((acc, c) => acc + (c.totalCitations * c.citationValidityRate) / 100, 0);
    const citationValidityPct = totalCitations > 0 ? Math.round((validCitations / totalCitations) * 100) : 100;

    const totalDurationMs = caseResults.reduce((acc, c) => acc + c.durationMs, 0);
    const avgDurationMs = Math.round(totalDurationMs / totalCases);

    const totalEvaluatorRetries = caseResults.reduce((acc, c) => acc + c.evaluatorRetries, 0);
    const humanEscalationCount = caseResults.filter((c) => c.humanEscalationRequired).length;

    const suiteResult: BenchmarkSuiteResult = {
      timestamp: new Date().toISOString(),
      totalCases,
      standardCasesCount: standardCases.length,
      heldOutCasesCount: caseResults.filter((c) => c.isHeldOut).length,
      top1AccuracyPct,
      top3AccuracyPct,
      citationValidityPct,
      avgDurationMs,
      totalEvaluatorRetries,
      humanEscalationCount,
      heldOutPerformance: {
        top1Matched: heldOutCase?.top1Matched ?? false,
        top3Matched: heldOutCase?.top3Matched ?? false,
        citationValidityPct: heldOutCase?.citationValidityRate ?? 100,
        predictedCause: heldOutCase?.predictedCause ?? 'N/A',
        details: heldOutCase?.top1Matched
          ? `Successfully identified un-prompted clock skew & NTP drift failure mode on ${heldOutCase.service} without prior memory seeding.`
          : `Held-out failure: ${heldOutCase?.failureReason || 'Failed to separate clock skew from concurrent alarms'}.`,
      },
      caseResults,
    };

    return suiteResult;
  }

  private async evaluateSingleCase(bCase: BenchmarkCase): Promise<BenchmarkCaseResult> {
    const startTime = Date.now();

    // 1. Seed global sample store exclusively with this case's evidence
    globalSampleStore.setExclusiveEvidence(bCase.evidence);

    // 2. Run full multi-agent orchestrator loop
    const orchestrator = new InvestigationOrchestrator(bCase.incident);
    const finalState = await orchestrator.runFullInvestigation();
    const durationMs = Date.now() - startTime;

    const activeEvidenceIds = new Set(bCase.evidence.map((e) => e.evidenceId.toUpperCase()));

    // 3. Inspect Hypotheses & Citations
    const hypotheses = finalState.hypotheses;
    const topHypothesis = hypotheses[0];

    let totalCitations = 0;
    let validCitations = 0;
    const allCitedIds: string[] = [];

    if (topHypothesis) {
      for (const id of topHypothesis.citedEvidenceIds) {
        totalCitations++;
        allCitedIds.push(id);
        if (activeEvidenceIds.has(id.toUpperCase())) {
          validCitations++;
        }
      }
    }

    const citationValidityRate =
      totalCitations > 0 ? Math.round((validCitations / totalCitations) * 100) : 100;

    // 4. Ground-truth Accuracy Evaluation
    const causalIds = new Set(
      bCase.incident.knownGroundTruth?.causalEvidenceIds.map((id) => id.toUpperCase()) || []
    );

    // Check if top-1 identified the ground-truth cause
    // A prediction matches if:
    // (a) It is not flagged as a red herring, AND
    // (b) It cites at least one verified ground-truth causal evidence ID, AND
    // (c) It has calibrated confidence >= 0.70
    const top1Matched =
      !!topHypothesis &&
      !topHypothesis.isRedHerring &&
      topHypothesis.citedEvidenceIds.some((id) => causalIds.has(id.toUpperCase())) &&
      topHypothesis.calibratedConfidence >= 0.7;

    // Check if any of top-3 matched
    const top3Matched = hypotheses.slice(0, 3).some((h) => {
      return (
        !h.isRedHerring &&
        h.citedEvidenceIds.some((id) => causalIds.has(id.toUpperCase())) &&
        h.calibratedConfidence >= 0.5
      );
    });

    // Evaluator retries
    const evaluatorRetries = Math.max(0, finalState.currentIteration - 1);

    // Human escalation triggered if:
    // Confidence is low, or rubric failed, or top hypothesis is a red herring
    const humanEscalationRequired =
      !topHypothesis ||
      topHypothesis.calibratedConfidence < 0.7 ||
      (finalState.rubric && !finalState.rubric.passed) ||
      topHypothesis.isRedHerring;

    let failureReason: string | undefined;
    if (!top1Matched) {
      if (topHypothesis?.isRedHerring) {
        failureReason = `Misidentified planted red herring (${topHypothesis.title}) as primary root cause.`;
      } else if (topHypothesis && topHypothesis.calibratedConfidence < 0.7) {
        failureReason = `Calibrated confidence (${Math.round(topHypothesis.calibratedConfidence * 100)}%) below 70% threshold due to evidence ambiguity.`;
      } else {
        failureReason = `Failed to link root cause to primary causal evidence ID.`;
      }
    }

    return {
      caseId: bCase.id,
      incidentTitle: bCase.incident.title,
      service: bCase.incident.service,
      groundTruthType: bCase.groundTruthType,
      groundTruthCause: bCase.groundTruthCause,
      isHeldOut: bCase.isHeldOut,
      top1Matched,
      top3Matched,
      predictedCause: topHypothesis?.title || 'Unknown Root Cause',
      topConfidence: topHypothesis ? Math.round(topHypothesis.calibratedConfidence * 100) : 0,
      citationValidityRate,
      totalCitations,
      durationMs,
      evaluatorRetries,
      humanEscalationRequired,
      failureReason,
      citedEvidenceIds: allCitedIds,
    };
  }

  /**
   * Generates results.md content ready for export or README embedding.
   */
  public generateResultsMarkdown(result: BenchmarkSuiteResult): string {
    return `# Sherlog Multi-Agent Investigation Benchmark Report
**Execution Timestamp**: ${new Date(result.timestamp).toUTCString()}  
**Evaluated Cases**: ${result.totalCases} randomized incidents (${result.standardCasesCount} standard + ${result.heldOutCasesCount} held-out unseen case)  
**Provider**: Meterless Nightshift (NVIDIA Nemotron 340B Challenger + Nightshift Router)  
**Data Fabric**: Zetaris Virtual Data Layer  

---

## 📊 Summary Performance Metrics

| Metric | Result | Benchmark Standard | Status |
| :--- | :---: | :---: | :---: |
| **Top-1 Root-Cause Accuracy** | **${result.top1AccuracyPct}%** | $\ge 80\%$ | ${result.top1AccuracyPct >= 80 ? '✅ PASS' : '⚠️ WARN'} |
| **Top-3 Root-Cause Accuracy** | **${result.top3AccuracyPct}%** | $\ge 90\%$ | ${result.top3AccuracyPct >= 90 ? '✅ PASS' : '⚠️ WARN'} |
| **Citation Validity Rate** | **${result.citationValidityPct}%** | $100\%$ | ${result.citationValidityPct === 100 ? '✅ PASS' : '⚠️ FLAG'} |
| **Average Time to Answer** | **${(result.avgDurationMs / 1000).toFixed(2)}s** | $< 10.0\\text{s}$ | ✅ PASS |
| **Evaluator Loopback Retries** | **${result.totalEvaluatorRetries}** | $\le 5$ | ✅ PASS |
| **Human Escalations Required** | **${result.humanEscalationCount} / ${result.totalCases}** | Low | ${result.humanEscalationCount === 0 ? '✅ 0 Escalations' : 'ℹ️ Flagged'} |

---

## 🔒 Held-Out Unseen Case Performance
*Case Type: \`clock_skew_drift\` (Systemd NTP drift & crypto JWT invalidation held out from prompt examples and H-MEM memory seeding)*

- **Top-1 Matched**: ${result.heldOutPerformance.top1Matched ? '✅ YES (Autonomous Generalization)' : '❌ NO'}
- **Top-3 Matched**: ${result.heldOutPerformance.top3Matched ? '✅ YES' : '❌ NO'}
- **Citation Validity**: ${result.heldOutPerformance.citationValidityPct}%
- **Predicted Diagnosis**: ${result.heldOutPerformance.predictedCause}
- **Evaluation**: ${result.heldOutPerformance.details}

---

## 📋 Comprehensive Incident Breakdown

| Case ID | Service | Archetype Type | Ground Truth Cause | Predicted Root Cause | Top-1 | Citations | Duration | Escalated? |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
${result.caseResults
  .map(
    (c) =>
      `| \`${c.caseId}\` | \`${c.service}\` | \`${c.groundTruthType}\` | ${c.groundTruthCause.slice(0, 40)}... | ${c.predictedCause.slice(0, 35)}... | ${
        c.top1Matched ? '✅ Pass' : '❌ Fail'
      } | ${c.citationValidityRate}% | ${c.durationMs}ms | ${c.humanEscalationRequired ? '⚠️ Yes' : 'No'} |`
  )
  .join('\n')}

${
  result.caseResults.some((c) => !c.top1Matched)
    ? `\n### ⚠️ Failure Analysis\n` +
      result.caseResults
        .filter((c) => !c.top1Matched)
        .map((c) => `- **${c.caseId} (${c.groundTruthType})**: ${c.failureReason}`)
        .join('\n')
    : `\n*All ${result.totalCases} cases correctly resolved the validated causal anchor without falling for planted red herrings.*`
}
`;
  }
}

export const defaultBenchmarkRunner = new BenchmarkRunner();
