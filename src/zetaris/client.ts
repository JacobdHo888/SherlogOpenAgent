import { EvidenceRow, ZetarisQueryResult, ZetarisSourceType } from '../types/investigation';
import { globalSampleStore } from '../data/sampleStore';

export interface ZetarisConfig {
  endpoint: string;
  authToken?: string;
  timeoutMs: number;
  mode: 'auto' | 'live' | 'sample';
}

export class ZetarisClient {
  private config: ZetarisConfig;

  constructor(customConfig?: Partial<ZetarisConfig>) {
    this.config = {
      endpoint:
        customConfig?.endpoint ||
        (typeof process !== 'undefined' && process.env?.ZETARIS_ENDPOINT) ||
        'http://localhost:8080/v1/query',
      authToken:
        customConfig?.authToken ||
        (typeof process !== 'undefined' && process.env?.ZETARIS_AUTH_TOKEN) ||
        '',
      timeoutMs: customConfig?.timeoutMs || 4000,
      mode: customConfig?.mode || 'auto',
    };
  }

  public setMode(mode: 'auto' | 'live' | 'sample') {
    this.config.mode = mode;
  }

  public getMode(): 'auto' | 'live' | 'sample' {
    return this.config.mode;
  }

  public getEndpoint(): string {
    return this.config.endpoint;
  }

  /**
   * Execute an evidence query through the Zetaris data layer.
   * If live Docker endpoint is unavailable or sample mode is enabled,
   * falls back to the virtualized Zetaris SQL engine.
   */
  public async executeQuery(sql: string, maxRetries: number = 2): Promise<ZetarisQueryResult> {
    const startTime = Date.now();
    const queryId = `zq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const targetTable = this.extractTargetTable(sql);

    // If forced live or auto-detecting, try the live Zetaris Docker API first
    if (this.config.mode === 'live' || this.config.mode === 'auto') {
      let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

          const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
            },
            body: JSON.stringify({ query: sql, format: 'json' }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const raw = await response.json();
            const data: EvidenceRow[] = Array.isArray(raw.data) ? raw.data : raw;
            const executionTimeMs = Date.now() - startTime;
            return {
              queryId,
              sql,
              targetTable,
              executionTimeMs,
              rowCount: data.length,
              data,
              timestamp: new Date().toISOString(),
              sourceEndpoint: this.config.endpoint,
              mode: 'live-docker',
            };
          } else {
            throw new Error(`Zetaris returned status ${response.status}: ${response.statusText}`);
          }
        } catch (err: any) {
          attempt++;
          if (attempt > maxRetries) {
            // If in auto mode, gracefully fallback to virtualized Zetaris engine
            if (this.config.mode === 'auto') {
              break;
            }
            throw new Error(`Zetaris query failed after ${maxRetries} retries: ${err.message}`);
          }
          await new Promise((r) => setTimeout(r, 200 * attempt));
        }
      }
    }

    // Execute in virtualized Zetaris engine (Sample mode or fallback)
    const data = this.executeVirtualizedQuery(sql, targetTable);
    const executionTimeMs = Math.max(12, Date.now() - startTime);

    return {
      queryId,
      sql,
      targetTable,
      executionTimeMs,
      rowCount: data.length,
      data,
      timestamp: new Date().toISOString(),
      sourceEndpoint: 'zetaris://virtualized.local',
      mode: 'sample-virtualized',
    };
  }

  private extractTargetTable(sql: string): string {
    const match = sql.match(/FROM\s+(?:zetaris\.)?([a-zA-Z0-9_]+)/i);
    return match ? match[1].toLowerCase() : 'logs';
  }

  /**
   * Virtualized SQL execution against globalSampleStore
   */
  private executeVirtualizedQuery(sql: string, targetTable: string): EvidenceRow[] {
    const tableToSourceMap: Record<string, ZetarisSourceType> = {
      logs: 'logs',
      deploy_history: 'deploy_history',
      deploys: 'deploy_history',
      metrics: 'metrics',
      tickets: 'tickets',
      config_repo: 'config_repo',
      configs: 'config_repo',
    };

    const source = tableToSourceMap[targetTable] || undefined;

    // Extract basic WHERE conditions
    let service: string | undefined;
    const serviceMatch = sql.match(/service\s*=\s*'([^']+)'/i);
    if (serviceMatch) {
      service = serviceMatch[1];
    }

    let searchText: string | undefined;
    const searchMatch = sql.match(/LIKE\s*'%([^%]+)%'/i);
    if (searchMatch) {
      searchText = searchMatch[1];
    }

    let limit: number | undefined;
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      limit = parseInt(limitMatch[1], 10);
    }

    let fromTime: string | undefined;
    const fromTimeMatch = sql.match(/timestamp\s*>=\s*'([^']+)'/i);
    if (fromTimeMatch) {
      fromTime = fromTimeMatch[1];
    }

    return globalSampleStore.query({
      source,
      service,
      searchText,
      limit,
      fromTime,
    });
  }
}

export const defaultZetarisClient = new ZetarisClient();
