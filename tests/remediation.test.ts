import { RemediationAgent } from '../src/agents/remediation';
import { SEEDED_INCIDENTS } from '../src/data/incidents';
import { Hypothesis } from '../src/types/investigation';

export async function runRemediationTests(): Promise<{ passed: boolean; message: string; details: any[] }> {
  const agent = new RemediationAgent();
  const details: any[] = [];

  // Bundle 1: Checkout 500s (INC-8921)
  const checkoutBundle = SEEDED_INCIDENTS['INC-8921'];
  const checkoutEvidence = checkoutBundle.evidence;
  const checkoutValidIds = new Set(checkoutEvidence.map((e) => e.evidenceId.toUpperCase()));

  const checkoutHypothesis: Hypothesis = {
    id: 'hyp-test-1',
    rank: 1,
    title: 'HikariCP Connection Pool Exhaustion via Deploy Config Change',
    category: 'configuration',
    confidence: 0.95,
    calibratedConfidence: 0.95,
    primaryCause: 'Deploy reduced pool to 5',
    whyExplanation: 'Active connections locked at 5/5 under traffic',
    citedEvidenceIds: ['EV-DEP-101', 'EV-CFG-102', 'EV-LOG-103', 'EV-MET-104'],
    temporalOrderValid: true,
    isRedHerring: false,
    recommendedFix: 'Revert pool size to 50',
  };

  // Test 1: Verify all cited IDs in generated recommendations exist in the active evidence pool
  const { recommendations: recs1 } = await agent.proposeRemediation(
    checkoutBundle.incident,
    checkoutHypothesis,
    checkoutEvidence
  );

  let allCitationsValid = recs1.length > 0;
  const unverifiedIds: string[] = [];

  for (const rec of recs1) {
    for (const citedId of rec.citedEvidenceIds) {
      if (!checkoutValidIds.has(citedId.toUpperCase())) {
        allCitationsValid = false;
        unverifiedIds.push(citedId);
      }
    }
  }

  const test1Passed = allCitationsValid && unverifiedIds.length === 0;
  details.push({
    test: 'Remediation: All cited IDs in proposed fixes strictly exist in data source',
    passed: test1Passed,
    recommendationsCount: recs1.length,
    unverifiedIds,
  });

  // Test 2: Search latency incident (INC-6402) citations verification
  const searchBundle = SEEDED_INCIDENTS['INC-6402'];
  const searchEvidence = searchBundle.evidence;
  const searchValidIds = new Set(searchEvidence.map((e) => e.evidenceId.toUpperCase()));

  const searchHypothesis: Hypothesis = {
    id: 'hyp-test-2',
    rank: 1,
    title: 'Aggressive CronJob Schedule Triggering Overlapping Bulk Reindexing',
    category: 'configuration',
    confidence: 0.92,
    calibratedConfidence: 0.92,
    primaryCause: 'Schedule changed to every 5 minutes',
    whyExplanation: 'Overlapping jobs saturated ES data nodes',
    citedEvidenceIds: ['EV-CFG-201', 'EV-LOG-203', 'EV-LOG-204', 'EV-MET-202'],
    temporalOrderValid: true,
    isRedHerring: false,
    recommendedFix: 'Revert cron to nightly',
  };

  const { recommendations: recs2 } = await agent.proposeRemediation(
    searchBundle.incident,
    searchHypothesis,
    searchEvidence
  );

  let searchCitationsValid = recs2.length > 0;
  for (const rec of recs2) {
    for (const citedId of rec.citedEvidenceIds) {
      if (!searchValidIds.has(citedId.toUpperCase())) {
        searchCitationsValid = false;
      }
    }
  }

  details.push({
    test: 'Remediation: Search Incident (INC-6402) recommendation citations verified',
    passed: searchCitationsValid,
    recommendationsCount: recs2.length,
  });

  // Test 3: Incident Report Markdown generation
  const reportDraft = agent.generateIncidentReportDraft(
    checkoutBundle.incident,
    checkoutHypothesis,
    recs1,
    checkoutEvidence,
    {
      citationValidityScore: 100,
      temporalConsistencyScore: 100,
      alternativesConsideredScore: 95,
      calibratedConfidenceScore: 95,
      overallScore: 97,
      passed: true,
      citationsChecked: { totalCited: 4, validEvidenceIds: 4, phantomIdsFound: [] },
      temporalChecks: { precedesAlert: true, precedesSymptom: true, causalTimelineValid: true, details: 'Valid' },
      critiques: [],
    }
  );

  const test3Passed =
    reportDraft.markdownContent.includes('# INCIDENT POST-MORTEM & REMEDIATION REPORT') &&
    reportDraft.markdownContent.includes('Executive Summary') &&
    reportDraft.markdownContent.includes('Root Cause Analysis') &&
    reportDraft.markdownContent.includes('Recommended Remediation & Prevention Actions') &&
    reportDraft.recommendedFixes.length > 0;

  details.push({
    test: 'Remediation: Incident report draft includes summary, timeline, fixes, and markdown export',
    passed: test3Passed,
    hasMarkdown: reportDraft.markdownContent.length > 200,
  });

  const allPassed = test1Passed && searchCitationsValid && test3Passed;

  return {
    passed: allPassed,
    message: allPassed
      ? 'All Remediation Agent citation and report tests passed successfully.'
      : 'One or more Remediation tests failed.',
    details,
  };
}

const isCliRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === 'string' &&
  import.meta.url.endsWith(process.argv[1]);

if (isCliRun) {
  runRemediationTests().then((res) => {
    console.log(JSON.stringify(res, null, 2));
    if (!res.passed && typeof process !== 'undefined') process.exit(1);
  });
}
