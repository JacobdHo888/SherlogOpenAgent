import { EvaluatorAgent } from '../src/agents/evaluator';
import { SEEDED_INCIDENTS } from '../src/data/incidents';
import { Hypothesis } from '../src/types/investigation';

export async function runEvaluatorTests(): Promise<{ passed: boolean; message: string; details: any[] }> {
  const evaluator = new EvaluatorAgent();
  const details: any[] = [];
  const checkoutBundle = SEEDED_INCIDENTS['INC-8921'];

  // Test 1: Valid citations pass with 100% validity
  const validHypotheses: Hypothesis[] = [
    {
      id: 'hyp-1',
      rank: 1,
      title: 'DB Connection Pool Exhaustion',
      category: 'configuration',
      confidence: 0.95,
      calibratedConfidence: 0.95,
      primaryCause: 'Deploy reduced pool to 5',
      whyExplanation: 'Connections exhausted under load',
      citedEvidenceIds: ['EV-DEP-101', 'EV-CFG-102', 'EV-LOG-103', 'EV-MET-104'],
      temporalOrderValid: true,
      isRedHerring: false,
      recommendedFix: 'Revert pool size to 50',
    },
  ];

  const evalResult1 = await evaluator.evaluate(checkoutBundle.incident, validHypotheses, checkoutBundle.evidence);

  const test1Passed =
    evalResult1.rubric.citationValidityScore === 100 &&
    evalResult1.rubric.citationsChecked.phantomIdsFound.length === 0 &&
    evalResult1.rubric.passed === true;

  details.push({
    test: 'Evaluator: 100% Citation Validity on Ground Truth Evidence',
    passed: test1Passed,
    citationScore: evalResult1.rubric.citationValidityScore,
    overallScore: evalResult1.rubric.overallScore,
    rubricPassed: evalResult1.rubric.passed,
  });

  // Test 2: Detection of phantom / hallucinated citation IDs
  const phantomHypotheses: Hypothesis[] = [
    {
      id: 'hyp-phantom',
      rank: 1,
      title: 'Hallucinated Memory Leak Claim',
      category: 'infrastructure',
      confidence: 0.8,
      calibratedConfidence: 0.5,
      primaryCause: 'Fake leak',
      whyExplanation: 'Cited fake rows',
      citedEvidenceIds: ['EV-DEP-101', 'EV-FAKE-999', 'EV-PHANTOM-404'],
      temporalOrderValid: true,
      isRedHerring: false,
      recommendedFix: 'None',
    },
  ];

  const evalResult2 = await evaluator.evaluate(checkoutBundle.incident, phantomHypotheses, checkoutBundle.evidence);

  const test2Passed =
    evalResult2.rubric.citationsChecked.phantomIdsFound.includes('EV-FAKE-999') &&
    evalResult2.rubric.citationsChecked.phantomIdsFound.includes('EV-PHANTOM-404') &&
    evalResult2.rubric.citationValidityScore < 100 &&
    evalResult2.shouldRetry === true;

  details.push({
    test: 'Evaluator: Detect Phantom Citation IDs and Trigger Critique Loopback',
    passed: test2Passed,
    phantomFound: evalResult2.rubric.citationsChecked.phantomIdsFound,
    shouldRetry: evalResult2.shouldRetry,
  });

  // Test 3: Thin evidence threshold check (< 3 rows)
  const evalResult3 = await evaluator.evaluate(checkoutBundle.incident, validHypotheses, checkoutBundle.evidence.slice(0, 1));

  const test3Passed = evalResult3.shouldRetry === true && evalResult3.rubric.passed === false;

  details.push({
    test: 'Evaluator: Flag Thin Evidence (< 3 evidence rows)',
    passed: test3Passed,
    shouldRetry: evalResult3.shouldRetry,
    critique: evalResult3.critiqueFeedback,
  });

  const allPassed = test1Passed && test2Passed && test3Passed;

  return {
    passed: allPassed,
    message: allPassed ? 'All Evaluator tests passed successfully.' : 'One or more Evaluator tests failed.',
    details,
  };
}

const isCliRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === 'string' &&
  import.meta.url.endsWith(process.argv[1]);

if (isCliRun) {
  runEvaluatorTests().then((res) => {
    console.log(JSON.stringify(res, null, 2));
    if (!res.passed && typeof process !== 'undefined') process.exit(1);
  });
}

