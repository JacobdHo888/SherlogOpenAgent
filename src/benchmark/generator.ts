import { EvidenceRow, IncidentAlert } from '../types/investigation';
import { BenchmarkCase, BenchmarkIncidentType } from './types';

const SERVICES = [
  'billing-processor',
  'identity-service',
  'order-pipeline',
  'inventory-api',
  'recommendation-worker',
  'search-indexer',
  'notification-dispatcher',
  'session-broker',
];

const ENVIRONMENTS = ['prod-us-east-1', 'prod-eu-west-1', 'prod-us-west-2', 'prod-ap-southeast-1'];

interface IncidentArchetype {
  type: BenchmarkIncidentType;
  titleTemplate: (svc: string, param: string) => string;
  symptomTemplate: (svc: string) => string;
  generateParams: (rand: () => number) => {
    culpritFile: string;
    culpritDiff: string;
    metricName: string;
    metricValue: string;
    errorSnippet: string;
    redHerringTitle: string;
    redHerringContent: string;
    groundTruthSummary: string;
  };
}

const ARCHETYPES: IncidentArchetype[] = [
  // 1. Deploy Config Change
  {
    type: 'deploy_config_change',
    titleTemplate: (svc) => `HTTP 500 Spike on ${svc} Post-Deployment`,
    symptomTemplate: (svc) =>
      `Error rate surged to 28-35% on ${svc} following rolling rollout. Database connection acquisition timed out under load.`,
    generateParams: (rand) => {
      const oldVal = 40 + Math.floor(rand() * 40);
      const newVal = 3 + Math.floor(rand() * 4);
      return {
        culpritFile: 'config/database.yaml',
        culpritDiff: `pool:\n-  max_connections: ${oldVal}\n+  max_connections: ${newVal}`,
        metricName: 'hikari_active_connections',
        metricValue: `${newVal}/${newVal} (100% capacity, wait queue > 300 threads)`,
        errorSnippet: `SQLTimeoutException: Connection acquisition timed out after 2000ms. Active: ${newVal}, Waiting: 142.`,
        redHerringTitle: 'Downstream payment gateway transient 504 warning',
        redHerringContent: 'Upstream gateway returned 504 on retry probe 2 minutes after errors started. Circuit breaker remained closed.',
        groundTruthSummary: `Deploy reduced DB connection pool max_connections from ${oldVal} to ${newVal} in config/database.yaml, starving worker threads.`,
      };
    },
  },

  // 2. Scheduler Change
  {
    type: 'scheduler_change',
    titleTemplate: (svc) => `Severe Latency Degradation (>4.2s p99) on ${svc}`,
    symptomTemplate: (svc) =>
      `p99 response time escalated by 800% on ${svc}. Search and read queries timing out due to background I/O congestion.`,
    generateParams: (rand) => {
      const freqMinutes = 2 + Math.floor(rand() * 4);
      return {
        culpritFile: 'k8s/cronjob-reindex.yaml',
        culpritDiff: `schedule:\n-  "0 3 * * *"\n+  "*/${freqMinutes} * * * *"`,
        metricName: 'cluster_cpu_iowait',
        metricValue: '96.4% CPU, disk write queue depth 78',
        errorSnippet: `ThreadpoolRejectionException: search queue capacity 1000 exceeded. Ingesting bulk documents every ${freqMinutes}m.`,
        redHerringTitle: 'Cosmetic frontend asset release deployed 8m earlier',
        redHerringContent: 'Frontend bundle release v1.8.2 updated navigation CSS styles and autocomplete debouncing.',
        groundTruthSummary: `CronJob schedule changed to run every ${freqMinutes} minutes instead of nightly, saturating cluster CPU and disk write queues.`,
      };
    },
  },

  // 3. Dependency Failure
  {
    type: 'dependency_failure',
    titleTemplate: (svc) => `Cascading Timeouts in ${svc} from Upstream Auth Provider`,
    symptomTemplate: (svc) =>
      `Ingress requests in ${svc} blocking indefinitely. Upstream token validation RPC latency breached timeout threshold.`,
    generateParams: (rand) => {
      const upstreamPort = 8443;
      return {
        culpritFile: 'deploy/env/upstream.env',
        culpritDiff: `RPC_TIMEOUT_MS:\n-  15000\n+  200`,
        metricName: 'upstream_rpc_timeout_rate',
        metricValue: '41.2% calls exceeding 200ms threshold',
        errorSnippet: `DeadlineExceededException: Upstream RPC token_verify failed to respond within 200ms.`,
        redHerringTitle: 'Node-level kernel filesystem inode scrub warning',
        redHerringContent: 'Scheduled inode maintenance cron logged INFO line with 0 filesystem errors.',
        groundTruthSummary: `RPC client timeout aggressively lowered to 200ms in upstream.env, causing false timeouts on regular 250ms auth calls.`,
      };
    },
  },

  // 4. Resource Exhaustion
  {
    type: 'resource_exhaustion',
    titleTemplate: (svc) => `OOMKilled Pod CrashLoop on ${svc} Nodes`,
    symptomTemplate: (svc) =>
      `Worker pods for ${svc} continuously killed with ExitCode 137. Service capacity dropped by 60%.`,
    generateParams: (rand) => {
      const memLimit = 1 + Math.floor(rand() * 2);
      return {
        culpritFile: 'k8s/deployment.yaml',
        culpritDiff: `resources:\n   limits:\n-    memory: 4Gi\n+    memory: ${memLimit}Gi`,
        metricName: 'cgroup_memory_usage',
        metricValue: `${memLimit}.0Gi / ${memLimit}Gi (OOM Invocation Count: 18)`,
        errorSnippet: `Kernel: Out of memory: Killed process 8192 (java) total-vm: 3821040kB, anon-rss: ${memLimit * 1024 * 1024}kB.`,
        redHerringTitle: 'Secondary DNS resolver UDP cache miss warning',
        redHerringContent: 'DNS lookup latency increased by 1.2ms during pod crash cascade.',
        groundTruthSummary: `Kubernetes pod memory limit reduced to ${memLimit}Gi below JVM -Xmx 3Gi heap requirement, triggering OS kernel OOMKill.`,
      };
    },
  },

  // 5. HELD-OUT UNSEEN ARCHETYPE: Clock Skew Drift
  {
    type: 'clock_skew_drift',
    titleTemplate: (svc) => `Unseen Case: Widespread JWT Authentication Validation Failures across ${svc}`,
    symptomTemplate: (svc) =>
      `HTTP 401 Unauthorized errors surged across ${svc}. Cryptographic tokens minted on worker nodes rejected as "not active yet".`,
    generateParams: (rand) => {
      const skewSeconds = 60 + Math.floor(rand() * 60);
      return {
        culpritFile: 'systemd/timesyncd.conf',
        culpritDiff: `NTP drift:\n-  offset: 0.002s\n+  offset: +${skewSeconds}.41s (UNSYNCED)`,
        metricName: 'ntp_offset_seconds',
        metricValue: `+${skewSeconds}s clock skew from UTC stratum`,
        errorSnippet: `JWTVerificationException: Token is not active yet (nbf: ${Date.now() + skewSeconds * 1000}, now: ${Date.now()}). Skew: +${skewSeconds}s.`,
        redHerringTitle: 'Routine PostgreSQL read-replica leader heartbeat failover',
        redHerringContent: 'Patroni completed scheduled switchover in 1.1s with 0 dropped client connections.',
        groundTruthSummary: `Systemd-timesyncd daemon lost NTP sync on worker node, creating a +${skewSeconds}s clock skew where minted JWT nbf claims were in the future.`,
      };
    },
  },
];

// Simple seeded PRNG to ensure reproducibility while generating fresh instances
function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates N randomized incidents with known ground-truth root causes.
 * Ensures varying cause types, timing, noise levels, and red herrings.
 * Guarantees exactly one held-out incident type ("clock_skew_drift").
 */
export function generateBenchmarkSuite(
  count: number = 10,
  randomSeed: number = 20261024
): BenchmarkCase[] {
  const cases: BenchmarkCase[] = [];
  const rand = createPrng(randomSeed);

  // We want count - 1 standard cases, and 1 held-out case
  const standardTypes: BenchmarkIncidentType[] = [
    'deploy_config_change',
    'scheduler_change',
    'dependency_failure',
    'resource_exhaustion',
  ];

  for (let i = 0; i < count; i++) {
    const isHeldOut = i === count - 1; // Last case is always the held-out unseen type
    const archetypeType: BenchmarkIncidentType = isHeldOut
      ? 'clock_skew_drift'
      : standardTypes[i % standardTypes.length];

    const archetype = ARCHETYPES.find((a) => a.type === archetypeType)!;
    const service = SERVICES[Math.floor(rand() * SERVICES.length)];
    const env = ENVIRONMENTS[Math.floor(rand() * ENVIRONMENTS.length)];
    const caseId = `INC-BM-${100 + i + Math.floor(rand() * 900)}`;

    const params = archetype.generateParams(rand);
    const noiseLevels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const noiseLevel = noiseLevels[Math.floor(rand() * noiseLevels.length)];

    // Timing calculation: base time with sequential order
    const baseHour = 10 + Math.floor(rand() * 10);
    const baseMin = 10 + Math.floor(rand() * 30);
    const baseIso = `2026-10-24T${baseHour.toString().padStart(2, '0')}:${baseMin.toString().padStart(2, '0')}:00.000Z`;
    const baseMs = new Date(baseIso).getTime();

    const configTime = new Date(baseMs - 12 * 60 * 1000).toISOString();
    const deployTime = new Date(baseMs - 8 * 60 * 1000).toISOString();
    const metricTime = new Date(baseMs - 3 * 60 * 1000).toISOString();
    const symptomTime = new Date(baseMs - 1 * 60 * 1000).toISOString();
    const alertTime = new Date(baseMs).toISOString();
    const redHerringTime = new Date(baseMs + 2 * 60 * 1000).toISOString(); // strictly after or unrelated

    const incident: IncidentAlert = {
      id: caseId,
      title: archetype.titleTemplate(service, params.culpritFile),
      service,
      environment: env,
      severity: 'P1',
      startedAt: alertTime,
      symptomDescription: archetype.symptomTemplate(service),
      initialMetrics: {
        errorRate: `${(25 + Math.floor(rand() * 20)).toFixed(1)}%`,
        p99Latency: `${(2800 + Math.floor(rand() * 3000)).toFixed(0)} ms`,
        affectedUsers: `~${(3000 + Math.floor(rand() * 6000)).toLocaleString()}`,
      },
      knownGroundTruth: {
        cause: params.groundTruthSummary,
        redHerrings: [params.redHerringTitle],
        causalEvidenceIds: [`EV-CFG-${caseId}`, `EV-DEP-${caseId}`, `EV-MET-${caseId}`, `EV-LOG-${caseId}`],
      },
    };

    // Ground-truth Evidence Rows
    const evidence: EvidenceRow[] = [
      {
        evidenceId: `EV-CFG-${caseId}`,
        source: 'config_repo',
        timestamp: configTime,
        service,
        severity: 'WARN',
        title: `Config modification in ${params.culpritFile}`,
        content: `commit ${Math.random().toString(36).slice(2, 9)}: "update ${params.culpritFile}"\n${params.culpritDiff}`,
        structuredData: {
          file: params.culpritFile,
          diff: params.culpritDiff,
        },
        isGroundTruthCausal: true,
      },
      {
        evidenceId: `EV-DEP-${caseId}`,
        source: 'deploy_history',
        timestamp: deployTime,
        service,
        severity: 'INFO',
        title: `Rollout release for ${service}`,
        content: `Applied deploy deployment/${service} with image tag v2.${10 + i}.0. Revision 42 succeeded.`,
        structuredData: {
          release: `v2.${10 + i}.0`,
          status: 'success',
        },
        isGroundTruthCausal: true,
      },
      {
        evidenceId: `EV-MET-${caseId}`,
        source: 'metrics',
        timestamp: metricTime,
        service,
        severity: 'CRITICAL',
        title: `Telemetry saturation metric: ${params.metricName}`,
        content: `Metric ${params.metricName} breached critical threshold: ${params.metricValue}`,
        structuredData: {
          metric: params.metricName,
          value: params.metricValue,
        },
        isGroundTruthCausal: true,
      },
      {
        evidenceId: `EV-LOG-${caseId}`,
        source: 'logs',
        timestamp: symptomTime,
        service,
        severity: 'ERROR',
        title: `Exception logged in ${service} worker thread`,
        content: `[ERROR] ${params.errorSnippet}`,
        structuredData: {
          error: params.errorSnippet,
        },
        isGroundTruthCausal: true,
      },
      // Planted Red Herring
      {
        evidenceId: `EV-HERRING-${caseId}`,
        source: 'logs',
        timestamp: redHerringTime,
        service: 'ancillary-telemetry',
        severity: 'WARN',
        title: params.redHerringTitle,
        content: `[WARN] ${params.redHerringContent}`,
        structuredData: {
          coincidental: true,
        },
        isRedHerring: true,
      },
    ];

    // Add noise rows based on noiseLevel
    const noiseCount = noiseLevel === 'high' ? 4 : noiseLevel === 'medium' ? 2 : 1;
    for (let n = 0; n < noiseCount; n++) {
      evidence.push({
        evidenceId: `EV-NOISE-${caseId}-${n}`,
        source: 'logs',
        timestamp: new Date(baseMs - (15 + n * 4) * 60 * 1000).toISOString(),
        service: 'log-collector-daemon',
        severity: 'INFO',
        title: `Routine daemon telemetry flush #${n + 1}`,
        content: `Flushed ${120 + n * 45} buffered events to cold archive. Health status: OK.`,
        structuredData: { noise: true },
      });
    }

    cases.push({
      id: caseId,
      incident,
      evidence,
      groundTruthType: archetypeType,
      groundTruthCause: params.groundTruthSummary,
      isHeldOut,
      noiseLevel,
    });
  }

  return cases;
}
