import { runHMemTests } from './hmem.test';
import { runEvaluatorTests } from './evaluator.test';
import { runZetarisTests } from './zetaris.test';

export interface ComprehensiveTestReport {
  timestamp: string;
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  allPassed: boolean;
  suites: {
    name: string;
    passed: boolean;
    message: string;
    details: any[];
  }[];
}

export async function runAllTests(): Promise<ComprehensiveTestReport> {
  const suites: ComprehensiveTestReport['suites'] = [];

  // Suite 1: Meterless Engine (H-MEM)
  const hmemRes = await runHMemTests();
  suites.push({
    name: 'Meterless Engine: H-MEM (Episodic Incident Memory Recall)',
    passed: hmemRes.passed,
    message: hmemRes.message,
    details: hmemRes.details,
  });

  // Suite 2: Zetaris Data Layer
  const zetarisRes = await runZetarisTests();
  suites.push({
    name: 'Zetaris Federated Data Layer (Docker & Virtualized Engine)',
    passed: zetarisRes.passed,
    message: zetarisRes.message,
    details: zetarisRes.details,
  });

  // Suite 3: Evaluator Citation & Temporal Consistency
  const evalRes = await runEvaluatorTests();
  suites.push({
    name: 'Evaluator Agent (Citation Veracity, Timeline & Temporal Check)',
    passed: evalRes.passed,
    message: evalRes.message,
    details: evalRes.details,
  });

  const passedSuites = suites.filter((s) => s.passed).length;
  const failedSuites = suites.filter((s) => !s.passed).length;

  return {
    timestamp: new Date().toISOString(),
    totalSuites: suites.length,
    passedSuites,
    failedSuites,
    allPassed: failedSuites === 0,
    suites,
  };
}

const isCliRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === 'string' &&
  import.meta.url.endsWith(process.argv[1]);

if (isCliRun) {
  runAllTests().then((report) => {
    console.log('\n======================================================');
    console.log('   SHERLOG AUTOMATED TEST SUITE REPORT');
    console.log('======================================================\n');
    for (const s of report.suites) {
      console.log(`[${s.passed ? 'PASS' : 'FAIL'}] ${s.name}`);
      for (const d of s.details) {
        console.log(`  - ${d.test}: ${d.passed ? 'OK' : 'FAIL'}`);
      }
      console.log('');
    }
    console.log(`Total: ${report.totalSuites} | Passed: ${report.passedSuites} | Failed: ${report.failedSuites}\n`);
    if (!report.allPassed && typeof process !== 'undefined') {
      process.exit(1);
    }
  });
}

