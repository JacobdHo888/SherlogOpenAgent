import { ZetarisClient } from '../src/zetaris/client';
import { globalSampleStore } from '../src/data/sampleStore';

export async function runZetarisTests(): Promise<{ passed: boolean; message: string; details: any[] }> {
  // Ensure store is reset to baseline
  globalSampleStore.resetToSeeded();
  const client = new ZetarisClient({ mode: 'sample' });
  const details: any[] = [];

  // Test 1: Query deploy history table
  const deployQuery = "SELECT * FROM zetaris.deploy_history WHERE service = 'checkout-api' LIMIT 5";
  const res1 = await client.executeQuery(deployQuery);

  const test1Passed =
    res1.rowCount > 0 &&
    res1.targetTable === 'deploy_history' &&
    res1.data.some((row) => row.evidenceId === 'EV-DEP-101') &&
    res1.mode === 'sample-virtualized';

  details.push({
    test: 'Zetaris: Query deploy_history table with service filter',
    passed: test1Passed,
    rowCount: res1.rowCount,
    foundEvId: res1.data[0]?.evidenceId,
    mode: res1.mode,
  });

  // Test 2: Query config_repo table
  const configQuery = "SELECT * FROM zetaris.config_repo WHERE service = 'catalog-indexer' LIMIT 5";
  const res2 = await client.executeQuery(configQuery);

  const test2Passed =
    res2.rowCount > 0 &&
    res2.targetTable === 'config_repo' &&
    res2.data.some((row) => row.evidenceId === 'EV-CFG-201');

  details.push({
    test: 'Zetaris: Query config_repo table for git diff evidence',
    passed: test2Passed,
    rowCount: res2.rowCount,
    foundEvId: res2.data[0]?.evidenceId,
  });

  // Test 3: Query logs with full-text search filter
  const logQuery = "SELECT * FROM zetaris.logs WHERE service = 'checkout-api' AND title LIKE '%HikariPool%' LIMIT 5";
  const res3 = await client.executeQuery(logQuery);

  const test3Passed =
    res3.rowCount > 0 &&
    res3.targetTable === 'logs' &&
    res3.data.some((row) => row.evidenceId === 'EV-LOG-103');

  details.push({
    test: 'Zetaris: Query logs with LIKE search filter',
    passed: test3Passed,
    rowCount: res3.rowCount,
    foundEvId: res3.data[0]?.evidenceId,
  });

  const allPassed = test1Passed && test2Passed && test3Passed;

  return {
    passed: allPassed,
    message: allPassed ? 'All Zetaris data layer tests passed successfully.' : 'One or more Zetaris tests failed.',
    details,
  };
}

const isCliRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === 'string' &&
  import.meta.url.endsWith(process.argv[1]);

if (isCliRun) {
  runZetarisTests().then((res) => {
    console.log(JSON.stringify(res, null, 2));
    if (!res.passed && typeof process !== 'undefined') process.exit(1);
  });
}

