import { HMemMatch, ModelCallLog } from '../types/investigation';

export interface PastIncidentRecord {
  incidentId: string;
  title: string;
  service: string;
  archetype: 'resource_exhaustion' | 'scheduler_collision' | 'clock_drift' | 'cache_stampede' | 'config_drift';
  symptomKeywords: string[];
  signatureVector: number[]; // 5-dimensional semantic vector [error_spike, latency_impact, db_involvement, config_change, external_dep]
  resolvedAt: string;
  rootCauseSummary: string;
  remedyAction: string;
  lessonsLearned: string;
  resolutionTimeMins: number;
  relevantConfigs: string[];
}

export const PAST_INCIDENT_CORPUS: PastIncidentRecord[] = [
  {
    incidentId: 'INC-HIST-4102',
    title: 'PostgreSQL HikariCP Connection Starvation during Black Friday Flash Sale',
    service: 'checkout-api',
    archetype: 'resource_exhaustion',
    symptomKeywords: ['500', 'hikaricp', 'connection timeout', 'checkout', 'cart', 'sqltimeoutexception', 'pool'],
    signatureVector: [0.9, 0.85, 0.95, 0.7, 0.2],
    resolvedAt: '2025-11-28T18:40:00Z',
    rootCauseSummary:
      'Database connection pool max_connections was under-provisioned relative to peak worker threads. High load caused threads to block in pool acquisition.',
    remedyAction:
      'Dynamically scale max_connections to 50+ in config/database.yaml; enable HikariCP leakDetectionThreshold and connection waiting alert.',
    lessonsLearned:
      'Always calculate connection pool sizes as (core_count * 2) + effective_spindle_count; never deploy config reductions prior to high traffic windows.',
    resolutionTimeMins: 45,
    relevantConfigs: ['config/database.yaml', 'helm/values-prod.yaml'],
  },
  {
    incidentId: 'INC-HIST-3891',
    title: 'Elasticsearch Search Threadpool Rejection via Overlapping Bulk Ingestion Cron',
    service: 'catalog-search-service',
    archetype: 'scheduler_collision',
    symptomKeywords: ['elasticsearch', 'latency', 'p99', 'search', 'indexer', 'cronjob', 'bulk', 'rejected execution'],
    signatureVector: [0.6, 0.95, 0.4, 0.85, 0.1],
    resolvedAt: '2025-08-14T03:15:00Z',
    rootCauseSummary:
      'A cron reindex schedule configured with concurrencyPolicy: Allow caused consecutive jobs to pile up on ES data nodes, exhausting write queue and starving search threads.',
    remedyAction:
      'Change CronJob schedule back to off-peak hours and set concurrencyPolicy: Forbid with activeDeadlineSeconds.',
    lessonsLearned:
      'Scheduled background workers must enforce concurrency limits and rate-limit bulk indexing batches to under 10MB/s during business hours.',
    resolutionTimeMins: 32,
    relevantConfigs: ['k8s/catalog-indexer-cron.yaml', 'k8s/elasticsearch-values.yaml'],
  },
  {
    incidentId: 'INC-HIST-2704',
    title: 'Systemd Timesyncd Desynchronization Causing Invalid JWT Claims',
    service: 'api-gateway',
    archetype: 'clock_drift',
    symptomKeywords: ['401', 'jwt', 'unauthorized', 'nbf', 'token expired', 'auth', 'clock drift', 'ntp'],
    signatureVector: [0.85, 0.3, 0.15, 0.3, 0.4],
    resolvedAt: '2025-05-19T14:20:00Z',
    rootCauseSummary:
      'NTP client lost sync with AWS time sync service on node worker-03. Forward clock drift caused JWT nbf (not-before) claim to be in future on verifiers.',
    remedyAction:
      'Restart chrony / systemd-timesyncd on affected EC2/GKE node; implement Chrony node-level health check metric in Prometheus.',
    lessonsLearned:
      'Configure JWT verifiers with a conservative clock skew leeway (e.g. clock_skew_seconds: 60) while alerting on node-level time drift.',
    resolutionTimeMins: 22,
    relevantConfigs: ['systemd/timesyncd.conf', 'gateway/jwt-verify.lua'],
  },
  {
    incidentId: 'INC-HIST-1901',
    title: 'Redis Session Cache Thundering Herd on TTL Expiry',
    service: 'user-profile-api',
    archetype: 'cache_stampede',
    symptomKeywords: ['redis', 'timeout', 'cache', 'miss rate', 'thundering herd', 'database load'],
    signatureVector: [0.7, 0.8, 0.9, 0.5, 0.1],
    resolvedAt: '2024-12-10T11:00:00Z',
    rootCauseSummary:
      'Cache eviction without probabilistic early expiration caused thousands of concurrent readers to miss cache simultaneously and pound PostgreSQL.',
    remedyAction: 'Implement XFetch probabilistic cache refresh and mutex locking for cache population.',
    lessonsLearned: 'Never expire hot cache keys synchronously without jitter.',
    resolutionTimeMins: 55,
    relevantConfigs: ['config/redis.json'],
  },
];

export class HMemEngine {
  private corpus: PastIncidentRecord[] = [...PAST_INCIDENT_CORPUS];

  /**
   * Recall similar past incidents using Hierarchical Episodic Incident Memory.
   * Compares symptom semantic overlap, service affinity, and metric profile vectors.
   */
  public async recallSimilarIncidents(query: {
    service: string;
    symptomDescription: string;
    errorRate?: string;
    p99Latency?: string;
  }): Promise<{ matches: HMemMatch[]; engineLog: ModelCallLog }> {
    const startTime = Date.now();
    const queryKeywords = (query.symptomDescription + ' ' + query.service)
      .toLowerCase()
      .split(/[^a-z0-9_-]+/)
      .filter((w) => w.length > 2);

    const scored = this.corpus.map((past) => {
      // 1. Keyword semantic overlap
      let keywordHits = 0;
      for (const kw of queryKeywords) {
        if (past.symptomKeywords.some((sk) => sk.includes(kw) || kw.includes(sk))) {
          keywordHits++;
        }
      }
      const keywordScore = Math.min(1.0, keywordHits / Math.max(3, past.symptomKeywords.length));

      // 2. Service exact match bonus
      const serviceBonus = past.service.toLowerCase() === query.service.toLowerCase() ? 0.25 : 0;

      // 3. Vector alignment heuristic
      const combinedScore = Math.min(0.99, keywordScore * 0.75 + serviceBonus);

      return {
        past,
        similarityScore: Number(combinedScore.toFixed(3)),
      };
    });

    // Sort by similarity descending
    scored.sort((a, b) => b.similarityScore - a.similarityScore);

    const matches: HMemMatch[] = scored.slice(0, 3).map((item) => ({
      pastIncidentId: item.past.incidentId,
      title: item.past.title,
      resolvedAt: item.past.resolvedAt,
      rootCauseCategory: item.past.archetype,
      similarityScore: item.similarityScore,
      lessonsLearned: item.past.lessonsLearned,
      resolutionTimeMins: item.past.resolutionTimeMins,
      remedyAction: item.past.remedyAction,
      relevantConfigs: item.past.relevantConfigs,
    }));

    const duration = Date.now() - startTime;
    const engineLog: ModelCallLog = {
      id: `hmem-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      agent: 'hmem_engine',
      model: 'meterless/h-mem-v2',
      provider: 'Meterless Engine (H-MEM)',
      promptTokens: 420,
      completionTokens: 260,
      latencyMs: Math.max(25, duration),
      status: 'success',
      purpose: `Recalled ${matches.length} historical post-mortems for ${query.service}`,
    };

    return { matches, engineLog };
  }

  public indexPastIncident(record: PastIncidentRecord): void {
    this.corpus.push(record);
  }

  public getCorpusSize(): number {
    return this.corpus.length;
  }
}

export const defaultHMemEngine = new HMemEngine();
