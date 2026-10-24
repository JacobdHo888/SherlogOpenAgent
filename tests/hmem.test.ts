import { HMemEngine, PAST_INCIDENT_CORPUS } from '../src/engine/hmem';

export async function runHMemTests(): Promise<{ passed: boolean; message: string; details: any[] }> {
  const engine = new HMemEngine();
  const details: any[] = [];

  // Test 1: Recall for DB Connection Pool exhaustion (Checkout incident)
  const checkoutQuery = {
    service: 'checkout-api',
    symptomDescription: 'HTTP 500 spike during cart checkout. HikariCP connection acquisition timeout after 2000ms.',
    errorRate: '34.2%',
    p99Latency: '8420ms',
  };

  const { matches: checkoutMatches, engineLog } = await engine.recallSimilarIncidents(checkoutQuery);

  const test1Passed =
    checkoutMatches.length > 0 &&
    checkoutMatches[0].pastIncidentId === 'INC-HIST-4102' &&
    checkoutMatches[0].rootCauseCategory === 'resource_exhaustion' &&
    checkoutMatches[0].similarityScore >= 0.7;

  details.push({
    test: 'H-MEM Recall: Checkout DB Pool Incident',
    passed: test1Passed,
    topMatch: checkoutMatches[0]?.pastIncidentId,
    score: checkoutMatches[0]?.similarityScore,
    modelLogged: engineLog.model,
    provider: engineLog.provider,
  });

  // Test 2: Recall for Search Indexer Cron Overlap
  const searchIndexerQuery = {
    service: 'catalog-search-service',
    symptomDescription: 'Elasticsearch high latency p99 > 4000ms. Search threadpool rejected executions due to bulk indexing.',
    errorRate: '19.8%',
  };

  const { matches: searchMatches } = await engine.recallSimilarIncidents(searchIndexerQuery);

  const test2Passed =
    searchMatches.length > 0 &&
    searchMatches[0].pastIncidentId === 'INC-HIST-3891' &&
    searchMatches[0].rootCauseCategory === 'scheduler_collision';

  details.push({
    test: 'H-MEM Recall: Elasticsearch Indexer Cron Overlap',
    passed: test2Passed,
    topMatch: searchMatches[0]?.pastIncidentId,
    score: searchMatches[0]?.similarityScore,
  });

  // Test 3: Indexing new incident into episodic memory
  const initialSize = engine.getCorpusSize();
  engine.indexPastIncident({
    incidentId: 'INC-HIST-NEW-99',
    title: 'Kafka Partition Rebalance Storm',
    service: 'kafka-consumer',
    archetype: 'config_drift',
    symptomKeywords: ['kafka', 'rebalance', 'consumer lag'],
    signatureVector: [0.5, 0.5, 0.2, 0.9, 0.4],
    resolvedAt: '2026-01-01T00:00:00Z',
    rootCauseSummary: 'Heartbeat timeout configured too low',
    remedyAction: 'Bump max.poll.interval.ms to 300000',
    lessonsLearned: 'Keep rebalance timeouts high in consumer groups',
    resolutionTimeMins: 15,
    relevantConfigs: ['consumer.properties'],
  });

  const test3Passed = engine.getCorpusSize() === initialSize + 1;
  details.push({
    test: 'H-MEM Corpus Indexing',
    passed: test3Passed,
    newSize: engine.getCorpusSize(),
  });

  const allPassed = test1Passed && test2Passed && test3Passed;

  return {
    passed: allPassed,
    message: allPassed ? 'All H-MEM Engine tests passed successfully.' : 'One or more H-MEM tests failed.',
    details,
  };
}

const isCliRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === 'string' &&
  import.meta.url.endsWith(process.argv[1]);

if (isCliRun) {
  runHMemTests().then((res) => {
    console.log(JSON.stringify(res, null, 2));
    if (!res.passed && typeof process !== 'undefined') process.exit(1);
  });
}

