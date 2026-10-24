import { EvidenceRow, ZetarisSourceType } from '../types/investigation';
import { SEEDED_INCIDENTS } from './incidents';

export class SampleDataStore {
  private rows: EvidenceRow[] = [];

  constructor() {
    this.resetToSeeded();
  }

  public resetToSeeded(): void {
    this.rows = [];
    for (const bundle of Object.values(SEEDED_INCIDENTS)) {
      this.rows.push(...bundle.evidence);
    }
  }

  public setEvidenceForIncident(evidence: EvidenceRow[]): void {
    // Keep baseline seeded evidence + ensure active incident evidence is present
    const existingIds = new Set(this.rows.map((r) => r.evidenceId));
    for (const item of evidence) {
      if (!existingIds.has(item.evidenceId)) {
        this.rows.push(item);
      }
    }
  }

  public getAll(): EvidenceRow[] {
    return [...this.rows];
  }

  public getById(id: string): EvidenceRow | undefined {
    return this.rows.find((r) => r.evidenceId.toLowerCase() === id.toLowerCase());
  }

  public query(params: {
    source?: ZetarisSourceType;
    service?: string;
    fromTime?: string;
    toTime?: string;
    searchText?: string;
    limit?: number;
  }): EvidenceRow[] {
    let result = [...this.rows];

    if (params.source) {
      result = result.filter((r) => r.source === params.source);
    }

    if (params.service) {
      const s = params.service.toLowerCase();
      result = result.filter((r) => r.service.toLowerCase().includes(s));
    }

    if (params.fromTime) {
      const fromMs = new Date(params.fromTime).getTime();
      result = result.filter((r) => new Date(r.timestamp).getTime() >= fromMs);
    }

    if (params.toTime) {
      const toMs = new Date(params.toTime).getTime();
      result = result.filter((r) => new Date(r.timestamp).getTime() <= toMs);
    }

    if (params.searchText) {
      const term = params.searchText.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.content.toLowerCase().includes(term) ||
          JSON.stringify(r.structuredData).toLowerCase().includes(term)
      );
    }

    // Sort chronologically
    result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (params.limit && params.limit > 0) {
      result = result.slice(0, params.limit);
    }

    return result;
  }
}

export const globalSampleStore = new SampleDataStore();
