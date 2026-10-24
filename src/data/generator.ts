import { EvidenceRow, IncidentAlert, ZetarisSourceType } from '../types/investigation';

export interface GeneratedIncidentSuite {
  incident: IncidentAlert;
  evidenceRows: EvidenceRow[];
  groundTruthCause: string;
}

const SERVICES = [
  'payment-processor',
  'order-fulfillment',
  'auth-service',
  'search-indexer',
  'user-profile-api',
  'notification-worker',
  'catalog-db',
  'inventory-service',
];

const ROOT_CAUSE_TEMPLATES = [
  {
    title: 'Connection Pool Starvation via Low Max Connections Config',
    category: 'configuration',
    sourceFile: 'config/connection-pool.json',
    paramChanged: 'pool.maxSize: 60 -> 4',
    culpritDeploy: 'v4.1.0-perf-tuning',
    symptom: 'Database client timeouts and HTTP 500 error cascade',
    redHerring: 'Simultaneous CPU spike on unrelated logging aggregator daemon',
  },
  {
    title: 'Misconfigured Cache TTL Leading to Thunder Herd on Redis',
    category: 'configuration',
    sourceFile: 'config/cache.yaml',
    paramChanged: 'default_ttl_seconds: 3600 -> 0',
    culpritDeploy: 'v2.8.4-cache-hotfix',
    symptom: 'Cache miss rate spiked from 1.2% to 99.4%, overwhelming backend DB',
    redHerring: 'Upstream edge CDN routine certificate renewal logged 8 minutes before alert',
  },
  {
    title: 'Kubernetes Memory Limit Set Below JVM Heap Ceiling',
    category: 'infrastructure',
    sourceFile: 'deploy/k8s/deployment.yaml',
    paramChanged: 'resources.limits.memory: 2Gi (JVM -Xmx 3Gi)',
    culpritDeploy: 'v1.19.0-k8s-cost-optimize',
    symptom: 'Kernel OOMKiller repeatedly terminating worker pods (Exit Code 137)',
    redHerring: 'External webhook provider reporting 2 retry attempts during deployment',
  },
];

export function generateRandomIncident(seedIndex: number = Math.floor(Math.random() * 1000)): GeneratedIncidentSuite {
  const template = ROOT_CAUSE_TEMPLATES[seedIndex % ROOT_CAUSE_TEMPLATES.length];
  const service = SERVICES[seedIndex % SERVICES.length];
  const incidentId = `INC-GEN-${1000 + (seedIndex % 9000)}`;

  const baseTime = new Date('2026-10-24T12:00:00.000Z');
  const alertTime = new Date(baseTime.getTime() + 18 * 60 * 1000).toISOString();
  const deployTime = new Date(baseTime.getTime() + 10 * 60 * 1000).toISOString();
  const configTime = new Date(baseTime.getTime() + 8 * 60 * 1000).toISOString();
  const symptomTime = new Date(baseTime.getTime() + 15 * 60 * 1000).toISOString();
  const redHerringTime = new Date(baseTime.getTime() + 19 * 60 * 1000).toISOString();

  const incident: IncidentAlert = {
    id: incidentId,
    title: `High Error Rate & Latency Degradation on ${service}`,
    service,
    environment: 'production-us-central',
    severity: 'P1',
    startedAt: alertTime,
    symptomDescription: `${service} reports degraded availability. ${template.symptom}. P99 latency breached SLA threshold.`,
    initialMetrics: {
      errorRate: `${(25 + (seedIndex % 20)).toFixed(1)}%`,
      p99Latency: `${(3500 + (seedIndex % 1500)).toFixed(0)} ms`,
      affectedUsers: `~${(2500 + (seedIndex % 4000)).toLocaleString()}`,
    },
    knownGroundTruth: {
      cause: `${template.title} in ${service} (${template.paramChanged})`,
      redHerrings: [template.redHerring],
      causalEvidenceIds: [`EV-GEN-CFG-${seedIndex}`, `EV-GEN-DEP-${seedIndex}`, `EV-GEN-LOG-${seedIndex}`],
    },
  };

  const evidenceRows: EvidenceRow[] = [
    {
      evidenceId: `EV-GEN-CFG-${seedIndex}`,
      source: 'config_repo',
      timestamp: configTime,
      service,
      severity: 'WARN',
      title: `Config changed in ${template.sourceFile}`,
      content: `Commit: "update performance flags for ${service}". Changes applied: ${template.paramChanged}.`,
      structuredData: {
        file: template.sourceFile,
        delta: template.paramChanged,
        author: 'infra-automation-bot',
      },
      isGroundTruthCausal: true,
    },
    {
      evidenceId: `EV-GEN-DEP-${seedIndex}`,
      source: 'deploy_history',
      timestamp: deployTime,
      service,
      severity: 'INFO',
      title: `Service release ${template.culpritDeploy}`,
      content: `Successfully rolled out image ${service}:${template.culpritDeploy} to production cluster. Pod roll completed in 120s.`,
      structuredData: {
        release: template.culpritDeploy,
        status: 'rolled_out',
      },
      isGroundTruthCausal: true,
    },
    {
      evidenceId: `EV-GEN-LOG-${seedIndex}`,
      source: 'logs',
      timestamp: symptomTime,
      service,
      severity: 'ERROR',
      title: `Primary service error: ${template.symptom}`,
      content: `[ERROR] Worker pool thread execution halted. Exception: ResourceConstraintException - details: ${template.paramChanged}. Active requests failing with status 500.`,
      structuredData: {
        errorType: 'ResourceConstraintException',
        service,
      },
      isGroundTruthCausal: true,
    },
    {
      evidenceId: `EV-GEN-MET-${seedIndex}`,
      source: 'metrics',
      timestamp: symptomTime,
      service,
      severity: 'CRITICAL',
      title: `Metric anomaly on ${service}`,
      content: `Metric spike: p99 latency crossed 4,000ms. Error count reached 480 events/sec.`,
      structuredData: {
        p99: 4200,
        rps: 1200,
      },
      isGroundTruthCausal: true,
    },
    // Red herring row (occurs after alert or unrelated)
    {
      evidenceId: `EV-GEN-HERRING-${seedIndex}`,
      source: 'logs',
      timestamp: redHerringTime,
      service: 'telemetry-collector',
      severity: 'WARN',
      title: `Red Herring: ${template.redHerring}`,
      content: `[WARN] Secondary telemetry log event: ${template.redHerring}. This had no impact on user query execution path.`,
      structuredData: {
        unrelated: true,
      },
      isRedHerring: true,
    },
    {
      evidenceId: `EV-GEN-TCK-${seedIndex}`,
      source: 'tickets',
      timestamp: alertTime,
      service,
      severity: 'CRITICAL',
      title: `Customer Issue Ticket: Incident ${incidentId}`,
      content: `Automated PagerDuty trigger on SLA violation. Assigned to on-call secondary engineer.`,
      structuredData: {
        alertId: `PD-${seedIndex}`,
      },
    },
  ];

  return {
    incident,
    evidenceRows,
    groundTruthCause: template.title,
  };
}
