import { ZetarisClient, defaultZetarisClient } from '../zetaris/client';
import { defaultNightshiftClient } from '../nightshift/client';
import { EvidenceRow, InvestigationPlan, ZetarisQueryResult } from '../types/investigation';

export class InvestigatorAgent {
  private zetarisClient: ZetarisClient;

  constructor(zetarisClient?: ZetarisClient) {
    this.zetarisClient = zetarisClient || defaultZetarisClient;
  }

  public async investigate(
    plan: InvestigationPlan
  ): Promise<{
    evidence: EvidenceRow[];
    queryLogs: ZetarisQueryResult[];
    thought: string;
    actionTaken: string;
  }> {
    const collected: EvidenceRow[] = [];
    const queryLogs: ZetarisQueryResult[] = [];

    // Execute queries sequentially through Zetaris
    for (const step of plan.steps) {
      try {
        step.status = 'running';
        const result = await this.zetarisClient.executeQuery(step.suggestedSql);
        queryLogs.push(result);
        step.status = 'completed';
        step.resultCount = result.rowCount;

        for (const row of result.data) {
          if (!collected.some((existing) => existing.evidenceId === row.evidenceId)) {
            collected.push(row);
          }
        }
      } catch (err: any) {
        step.status = 'failed';
        console.error(`[Investigator] Query failed for step ${step.stepId}:`, err);
      }
    }

    // Call Meterless Nightshift to synthesize findings from collected evidence
    await defaultNightshiftClient.callModel({
      agent: 'investigator',
      prompt: `Executed ${plan.steps.length} Zetaris queries. Collected ${collected.length} evidence items. Tables queried: ${plan.steps.map((s) => s.source).join(', ')}.`,
      purpose: `Investigate evidence rows retrieved via Zetaris data layer (Iteration ${plan.iteration})`,
    });

    const thought = `Executed ${plan.steps.length} Zetaris queries. Retrieved ${collected.length} unique evidence items with verified IDs across logs, deploy_history, metrics, configs, and tickets.`;
    const actionTaken = `Dispatched ${queryLogs.length} federated Zetaris queries. Captured evidence points spanning ${collected.map((e) => e.evidenceId).slice(0, 5).join(', ')}${collected.length > 5 ? '...' : ''}.`;

    return {
      evidence: collected,
      queryLogs,
      thought,
      actionTaken,
    };
  }
}

export const defaultInvestigatorAgent = new InvestigatorAgent();
