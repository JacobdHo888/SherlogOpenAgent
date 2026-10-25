import fs from 'fs';
import path from 'path';
import { defaultBenchmarkRunner } from './runner';

async function main() {
  console.log('\n=============================================================');
  console.log('   SHERLOG MULTI-INCIDENT BENCHMARK EVALUATOR');
  console.log('   Testing 10 Randomized Incidents (including Unseen Held-out)');
  console.log('=============================================================\n');

  const startTime = Date.now();
  const suiteResult = await defaultBenchmarkRunner.runBenchmark(10, (done, total, currentId) => {
    process.stdout.write(`\rEvaluating case [${done}/${total}]: ${currentId}...`);
  });

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\nBenchmark completed in ${totalTime}s!\n`);

  console.log(`- Top-1 Accuracy:            ${suiteResult.top1AccuracyPct}%`);
  console.log(`- Top-3 Accuracy:            ${suiteResult.top3AccuracyPct}%`);
  console.log(`- Citation Validity Rate:    ${suiteResult.citationValidityPct}%`);
  console.log(`- Average Time to Answer:    ${suiteResult.avgDurationMs}ms`);
  console.log(`- Evaluator Retries:         ${suiteResult.totalEvaluatorRetries}`);
  console.log(`- Human Escalation Flags:    ${suiteResult.humanEscalationCount}`);
  console.log(`- Held-Out Unseen Case Pass: ${suiteResult.heldOutPerformance.top1Matched ? 'YES' : 'NO'}\n`);

  // 1. Write results.json
  const jsonPath = path.resolve(process.cwd(), 'results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(suiteResult, null, 2), 'utf-8');
  console.log(`✓ Exported: ${jsonPath}`);

  // 2. Write results.md
  const mdContent = defaultBenchmarkRunner.generateResultsMarkdown(suiteResult);
  const mdPath = path.resolve(process.cwd(), 'results.md');
  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`✓ Exported: ${mdPath}\n`);
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
