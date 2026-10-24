import { EvidenceRow, IncidentAlert } from '../types/investigation';

export interface SeededIncidentBundle {
  incident: IncidentAlert;
  evidence: EvidenceRow[];
  groundTruthExplanation: string;
}

export const SEEDED_INCIDENTS: Record<string, SeededIncidentBundle> = {
  'INC-8921': {
    incident: {
      id: 'INC-8921',
      title: 'Checkout Service 500 Internal Server Errors & Spike in Cart Abandonment',
      service: 'checkout-api',
      environment: 'production-us-east',
      severity: 'P1',
      startedAt: '2026-10-24T14:18:00.000Z',
      symptomDescription: 'HTTP 500 rate spiked to 34.2% on POST /v2/checkout/complete. Customers reporting transaction failures during payment authorization step. DB timeouts rising.',
      initialMetrics: {
        errorRate: '34.2%',
        p99Latency: '8,420 ms',
        affectedUsers: '~4,200',
      },
      knownGroundTruth: {
        cause: 'Deploy release checkout-v3.18.2 changed database connection pool config max_connections from 50 to 5, starving connection threads under normal 1,200 req/sec checkout traffic.',
        redHerrings: [
          'External Payment Gateway (PayStream API) latency blip at 14:19:30Z (transient network packet loss lasting 20 seconds, was not the root cause)',
          'High memory alert on Redis session cache node-04 at 14:20:00Z',
        ],
        causalEvidenceIds: ['EV-DEP-101', 'EV-CFG-102', 'EV-LOG-103', 'EV-MET-104'],
      },
    },
    groundTruthExplanation:
      'Release checkout-v3.18.2 deployed at 14:10:00Z silently reduced DB connection pool max_connections from 50 to 5 in config/database.yaml. Under sustained 1,200 RPS, active connection queue filled in 8 minutes, causing HikariCP/ActiveRecord timeout exceptions (500s). PayStream API latency blip was a red herring occurring after errors started.',
    evidence: [
      {
        evidenceId: 'EV-DEP-101',
        source: 'deploy_history',
        timestamp: '2026-10-24T14:10:00.000Z',
        service: 'checkout-api',
        severity: 'INFO',
        title: 'Deployment Completed: checkout-api v3.18.2',
        content: 'Deployed image registry.internal/checkout:sha-7f9b1c2. Commit message: "refactor: optimize DB client connection defaults and telemetry". Author: dev-ops-bot.',
        structuredData: {
          commit: '7f9b1c2',
          previousVersion: 'v3.18.1',
          deployedVersion: 'v3.18.2',
          pipelineId: 'pipe-88912',
        },
        isGroundTruthCausal: true,
      },
      {
        evidenceId: 'EV-CFG-102',
        source: 'config_repo',
        timestamp: '2026-10-24T14:08:15.000Z',
        service: 'checkout-api',
        severity: 'WARN',
        title: 'Git diff in config/database.yaml (commit 7f9b1c2)',
        content: 'diff --git a/config/database.yaml\n-  pool:\n-    max_connections: 50\n-    min_idle: 10\n+  pool:\n+    max_connections: 5\n+    min_idle: 2\n+    connection_timeout_ms: 2000',
        structuredData: {
          file: 'config/database.yaml',
          keyChanged: 'pool.max_connections',
          oldVal: 50,
          newVal: 5,
        },
        isGroundTruthCausal: true,
      },
      {
        evidenceId: 'EV-MET-104',
        source: 'metrics',
        timestamp: '2026-10-24T14:16:30.000Z',
        service: 'checkout-api',
        severity: 'CRITICAL',
        title: 'HikariCP Active Connection Pool Saturation',
        content: 'Pool pool_checkout_pg: active_connections reached 5.0 (100% capacity). Pending connection acquisition wait queue jumped from 0 to 482 threads. Wait time exceeded 2000ms threshold.',
        structuredData: {
          metric: 'db_pool_active_connections',
          current: 5,
          max: 5,
          queuedRequests: 482,
          avgAcquireTimeMs: 2340,
        },
        isGroundTruthCausal: true,
      },
      {
        evidenceId: 'EV-LOG-103',
        source: 'logs',
        timestamp: '2026-10-24T14:17:45.000Z',
        service: 'checkout-api',
        severity: 'ERROR',
        title: 'Database connection acquisition timeout (HikariPool-1)',
        content: '[ERROR] 14:17:45.102 [http-nio-8080-exec-19] com.zaxxer.hikari.pool.HikariPool - HikariPool-1 - Connection is not available, request timed out after 2001ms. (total=5, active=5, idle=0, waiting=112)',
        structuredData: {
          exception: 'SQLTimeoutException',
          poolName: 'HikariPool-1',
          waitingThreads: 112,
        },
        isGroundTruthCausal: true,
      },
      // RED HERRING 1: Payment gateway blip
      {
        evidenceId: 'EV-LOG-105',
        source: 'logs',
        timestamp: '2026-10-24T14:19:30.000Z',
        service: 'payment-gateway-proxy',
        severity: 'WARN',
        title: 'Upstream HTTP timeout to PayStream API sandbox/prod endpoint',
        content: '[WARN] PayStream API call /v1/charges returned HTTP 504 Gateway Timeout on 3 retry requests over 18 seconds. Circuit breaker remained CLOSED.',
        structuredData: {
          upstream: 'paystream-api',
          durationMs: 4500,
          status: 504,
          transient: true,
        },
        isRedHerring: true,
      },
      // RED HERRING 2: Redis memory alert
      {
        evidenceId: 'EV-MET-106',
        source: 'metrics',
        timestamp: '2026-10-24T14:20:00.000Z',
        service: 'redis-session',
        severity: 'WARN',
        title: 'Redis Node 04 memory usage reached 78.4%',
        content: 'Redis memory utilization crossed warning threshold (75%). Eviction policy volatile-lru triggered. 0 keys evicted.',
        structuredData: {
          usedMemoryPct: 78.4,
          evictions: 0,
        },
        isRedHerring: true,
      },
      // Supplementary context
      {
        evidenceId: 'EV-TCK-107',
        source: 'tickets',
        timestamp: '2026-10-24T14:22:10.000Z',
        service: 'customer-support',
        severity: 'CRITICAL',
        title: 'Ticket #CS-4491: Users cannot submit orders at checkout',
        content: 'Customer Support Escalation: Over 40 incoming chat requests stating "Order button gives Oops Something went wrong error". Cart values > $120,000 affected.',
        structuredData: {
          ticketId: 'CS-4491',
          urgency: 'high',
        },
      },
      {
        evidenceId: 'EV-LOG-108',
        source: 'logs',
        timestamp: '2026-10-24T14:18:10.000Z',
        service: 'checkout-api',
        severity: 'ERROR',
        title: 'Controller uncaught exception rendering 500 to client',
        content: '[FATAL] CheckoutController: Failed to complete transaction for cart_id=crt_992144. Cause: Could not get JDBC Connection; nested exception is org.postgresql.util.PSQLException: Connection pool exhausted.',
        structuredData: {
          cartId: 'crt_992144',
          httpStatus: 500,
        },
        isGroundTruthCausal: true,
      },
    ],
  },

  'INC-6402': {
    incident: {
      id: 'INC-6402',
      title: 'ElasticSearch Catalog Search High Latency (>4,500ms p99) & Search Timeouts',
      service: 'catalog-search-service',
      environment: 'production-eu-west',
      severity: 'P1',
      startedAt: '2026-10-24T11:35:00.000Z',
      symptomDescription: 'Product search API latency degraded severely. p99 response time escalated from 85ms to 4,800ms. Search results dropping with HTTP 408 / 504 on store front-end.',
      initialMetrics: {
        errorRate: '19.8%',
        p99Latency: '4,820 ms',
        affectedUsers: '~8,900',
      },
      knownGroundTruth: {
        cause: 'A Kubernetes CronJob config update in catalog-indexer-cron.yaml changed schedule from nightly ("0 2 * * *") to every 5 minutes ("*/5 * * * *"), triggering constant heavy bulk re-indexing that saturated ES cluster CPU and I/O.',
        redHerrings: [
          'Frontend release web-v2.4.1 deployed at 11:25:00Z (10 minutes before the alert; frontend UI changes to search bar autocomplete, completely innocent)',
        ],
        causalEvidenceIds: ['EV-CFG-201', 'EV-MET-202', 'EV-LOG-203', 'EV-LOG-204'],
      },
    },
    groundTruthExplanation:
      'Config change PR #492 in catalog-indexer-cron.yaml mistakenly altered the reindexing schedule from 0 2 * * * (nightly) to */5 * * * * (every 5 minutes). At 11:30:00Z and 11:35:00Z, concurrent bulk index jobs choked Elasticsearch IOPS and CPU, pushing p99 latency to 4.8s. The frontend release web-v2.4.1 10 minutes prior was purely cosmetic and a classic red herring.',
    evidence: [
      // RED HERRING: Frontend deploy
      {
        evidenceId: 'EV-DEP-205',
        source: 'deploy_history',
        timestamp: '2026-10-24T11:25:00.000Z',
        service: 'web-storefront',
        severity: 'INFO',
        title: 'Deployment: web-storefront release v2.4.1',
        content: 'Deployed web-storefront:v2.4.1. Release notes: "Refactor search input component debouncing and update top header banner styles".',
        structuredData: {
          service: 'web-storefront',
          version: 'v2.4.1',
          changedFiles: ['src/components/SearchBar.tsx', 'src/styles/header.css'],
        },
        isRedHerring: true,
      },
      // CAUSAL: Cronjob config update
      {
        evidenceId: 'EV-CFG-201',
        source: 'config_repo',
        timestamp: '2026-10-24T11:15:30.000Z',
        service: 'catalog-indexer',
        severity: 'WARN',
        title: 'Config Commit: k8s/catalog-indexer-cron.yaml (PR #492)',
        content: 'diff --git a/k8s/catalog-indexer-cron.yaml\n-  schedule: "0 2 * * *" # Nightly at 2am UTC\n+  schedule: "*/5 * * * *" # Test cron schedule mistakenly committed\n   concurrencyPolicy: Allow\n   resources:\n     limits: { cpu: "8000m", memory: "16Gi" }',
        structuredData: {
          file: 'k8s/catalog-indexer-cron.yaml',
          oldSchedule: '0 2 * * *',
          newSchedule: '*/5 * * * *',
          commit: 'c90a1b8',
        },
        isGroundTruthCausal: true,
      },
      // CAUSAL: Indexer pods firing every 5 mins
      {
        evidenceId: 'EV-LOG-203',
        source: 'logs',
        timestamp: '2026-10-24T11:30:01.000Z',
        service: 'catalog-indexer',
        severity: 'INFO',
        title: 'CronJob triggered: catalog-full-reindex-28491030',
        content: 'Starting bulk catalog reindex. Ingesting 2,400,000 product documents to index "catalog_products_v3". Elasticsearch bulk request size: 50MB batches.',
        structuredData: {
          jobId: 'catalog-full-reindex-28491030',
          batchSize: '50MB',
          docCount: 2400000,
        },
        isGroundTruthCausal: true,
      },
      {
        evidenceId: 'EV-LOG-204',
        source: 'logs',
        timestamp: '2026-10-24T11:35:01.000Z',
        service: 'catalog-indexer',
        severity: 'WARN',
        title: 'CronJob overlap triggered: catalog-full-reindex-28491035',
        content: 'Concurrency policy is Allow. Previous job 28491030 still active (42% done). Spawning second parallel bulk indexing worker pod.',
        structuredData: {
          jobId: 'catalog-full-reindex-28491035',
          overlappingJobs: 2,
        },
        isGroundTruthCausal: true,
      },
      // CAUSAL: Elasticsearch metrics
      {
        evidenceId: 'EV-MET-202',
        source: 'metrics',
        timestamp: '2026-10-24T11:33:00.000Z',
        service: 'elasticsearch-cluster',
        severity: 'CRITICAL',
        title: 'Elasticsearch Data Nodes CPU & Disk I/O Saturation',
        content: 'Cluster CPU utilization spiked to 98.6%. Disk write queue depth hit 82. Search threadpool rejected executions: 1,420 queries rejected.',
        structuredData: {
          cpuPct: 98.6,
          diskQueue: 82,
          rejectedThreads: 1420,
          searchLatencyP99Ms: 4820,
        },
        isGroundTruthCausal: true,
      },
      {
        evidenceId: 'EV-TCK-206',
        source: 'tickets',
        timestamp: '2026-10-24T11:38:00.000Z',
        service: 'catalog-search-service',
        severity: 'CRITICAL',
        title: 'PagerDuty Alert: P1 Catalog Search High Latency Breached SLA',
        content: 'Alert rule "Search p99 > 1000ms for 5m" triggered. Escalated to on-call search reliability engineer.',
        structuredData: {
          alertId: 'PD-9941',
          rule: 'search_p99_sla_breach',
        },
      },
    ],
  },

  'INC-3190': {
    incident: {
      id: 'INC-3190',
      title: 'Cascading JWT Authentication Failures Across API Gateway (Holdout Incident)',
      service: 'api-gateway',
      environment: 'production-us-west',
      severity: 'P1',
      startedAt: '2026-10-24T09:12:00.000Z',
      symptomDescription: '401 Unauthorized errors surged to 42% on all ingress API routes. Valid client bearer tokens rejected with "Token not yet valid" and "Token expired" errors.',
      initialMetrics: {
        errorRate: '42.1%',
        p99Latency: '410 ms',
        affectedUsers: '~14,000',
      },
      knownGroundTruth: {
        cause: 'NTP daemon systemd-timesyncd crashed on worker node auth-worker-03, causing a 94-second forward clock drift. Tokens minted on this node failed nbf/exp checks on gateway instances.',
        redHerrings: [
          'Database primary-replica failover alert logged 15 minutes earlier (clean switchover with zero data loss or dropped client sessions)',
        ],
        causalEvidenceIds: ['EV-LOG-301', 'EV-MET-302', 'EV-LOG-303'],
      },
    },
    groundTruthExplanation:
      'Worker node auth-worker-03 experienced an NTP clock drift of +94 seconds after systemd-timesyncd socket hang. JWTs issued by this instance had iat and nbf timestamps 94s in the future, causing API gateway verifiers to reject them. The DB replica failover at 08:57:00Z was an unrelated scheduled test.',
    evidence: [
      // RED HERRING: DB Failover
      {
        evidenceId: 'EV-LOG-304',
        source: 'logs',
        timestamp: '2026-10-24T08:57:00.000Z',
        service: 'postgres-auth-db',
        severity: 'WARN',
        title: 'Database replica promoted to primary (Routine maintenance)',
        content: 'Patroni leader switchover from node-01 to node-02 completed in 1.4s. 0 client transactions lost.',
        structuredData: {
          event: 'patroni_switchover',
          durationSec: 1.4,
        },
        isRedHerring: true,
      },
      // CAUSAL: NTP Clock drift
      {
        evidenceId: 'EV-LOG-301',
        source: 'logs',
        timestamp: '2026-10-24T09:05:12.000Z',
        service: 'auth-worker-03',
        severity: 'CRITICAL',
        title: 'systemd-timesyncd: NTP synchronization lost, drift accumulated',
        content: 'Network time synchronization failed: Server 169.254.169.123 unreachable. Local clock skewed +94.238 seconds relative to UTC stratum.',
        structuredData: {
          daemon: 'systemd-timesyncd',
          offsetSeconds: 94.238,
          status: 'UNSYNCED',
        },
        isGroundTruthCausal: true,
      },
      {
        evidenceId: 'EV-MET-302',
        source: 'metrics',
        timestamp: '2026-10-24T09:10:00.000Z',
        service: 'api-gateway',
        severity: 'ERROR',
        title: 'JWT Token Validation Error Breakdown',
        content: 'JWT verification error breakdown: 88% due to "token not active yet (nbf claim > current_time)", 12% due to "token expired". 0% signature tampering.',
        structuredData: {
          nbfErrorPct: 88,
          tamperedPct: 0,
        },
        isGroundTruthCausal: true,
      },
      {
        evidenceId: 'EV-LOG-303',
        source: 'logs',
        timestamp: '2026-10-24T09:11:45.000Z',
        service: 'api-gateway',
        severity: 'ERROR',
        title: 'Kong Gateway JWT verification failure log',
        content: '[error] 29#0: *881249 jwt: token is not valid yet (nbf: 1792833130, now: 1792833036, diff: +94s), client: 10.0.4.18, request: "GET /api/v1/user/profile"',
        structuredData: {
          clientIp: '10.0.4.18',
          diffSeconds: 94,
        },
        isGroundTruthCausal: true,
      },
    ],
  },
};
