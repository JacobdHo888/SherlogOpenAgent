import { defaultNightshiftClient } from '../nightshift/client';
import { EvidenceRow, IncidentAlert, InvestigationPlan, PlanStep, ZetarisSourceType } from '../types/investigation';

export class PlannerAgent {
  public async plan(
    incident: IncidentAlert,
    iteration: number = 1,
    critiqueFeedback?: string,
    existingEvidence: EvidenceRow[] = []
  ): Promise<{ plan: InvestigationPlan; thought: string }> {
    const isRetry = iteration > 1 && !!critiqueFeedback;

    const prompt = `
Incident Alert:
ID: ${incident.id}
Service: ${incident.service}
Severity: ${incident.severity}
Started At: ${incident.startedAt}
Symptom: ${incident.symptomDescription}
Existing Evidence Count: ${existingEvidence.length}
${isRetry ? `EVALUATOR CRITIQUE FEEDBACK FROM PREVIOUS RUN:\n${critiqueFeedback}` : ''}

Formulate a prioritized data gathering plan across Zetaris tables:
- zetaris.logs
- zetaris.deploy_history
- zetaris.metrics
- zetaris.config_repo
- zetaris.tickets
`;

    // Call Meterless Nightshift Router
    await defaultNightshiftClient.callModel({
      agent: 'planner',
      prompt,
      purpose: isRetry ? `Revise investigation plan based on Evaluator critique (Iteration ${iteration})` : `Initial investigation planning for ${incident.id}`,
    });

    // Formulate steps
    const steps: PlanStep[] = [];
    const timeFrom = new Date(new Date(incident.startedAt).getTime() - 45 * 60 * 1000).toISOString();
    const timeTo = new Date(new Date(incident.startedAt).getTime() + 15 * 60 * 1000).toISOString();

    if (!isRetry) {
      // Step 1: Query deploy history
      steps.push({
        stepId: `plan-step-dep-${iteration}`,
        source: 'deploy_history',
        objective: `Identify any releases or rollouts for ${incident.service} or related services in the 45 mins prior to incident`,
        suggestedSql: `SELECT * FROM zetaris.deploy_history WHERE timestamp >= '${timeFrom}' AND timestamp <= '${timeTo}' ORDER BY timestamp DESC LIMIT 10`,
        priority: 'high',
        status: 'pending',
      });

      // Step 2: Query config repository for git diffs
      steps.push({
        stepId: `plan-step-cfg-${iteration}`,
        source: 'config_repo',
        objective: `Inspect configuration changes and parameter overrides committed prior to the alert`,
        suggestedSql: `SELECT * FROM zetaris.config_repo WHERE timestamp >= '${timeFrom}' AND timestamp <= '${timeTo}' LIMIT 10`,
        priority: 'high',
        status: 'pending',
      });

      // Step 3: Query error logs around incident start
      steps.push({
        stepId: `plan-step-log-${iteration}`,
        source: 'logs',
        objective: `Retrieve error, warn, and fatal log entries across affected services`,
        suggestedSql: `SELECT * FROM zetaris.logs WHERE timestamp >= '${timeFrom}' ORDER BY timestamp ASC LIMIT 25`,
        priority: 'high',
        status: 'pending',
      });

      // Step 4: Query telemetry metrics
      steps.push({
        stepId: `plan-step-met-${iteration}`,
        source: 'metrics',
        objective: `Examine connection pools, CPU, latency, and queue saturation metrics`,
        suggestedSql: `SELECT * FROM zetaris.metrics WHERE timestamp >= '${timeFrom}' LIMIT 15`,
        priority: 'medium',
        status: 'pending',
      });

      // Step 5: Query escalation tickets
      steps.push({
        stepId: `plan-step-tck-${iteration}`,
        source: 'tickets',
        objective: `Cross-reference customer impact tickets and PagerDuty escalations`,
        suggestedSql: `SELECT * FROM zetaris.tickets WHERE timestamp >= '${timeFrom}' LIMIT 5`,
        priority: 'low',
        status: 'pending',
      });
    } else {
      // Targeted queries addressing Evaluator critique
      steps.push({
        stepId: `plan-step-deep-cfg-${iteration}`,
        source: 'config_repo',
        objective: `Deep-scan config repository for subtle parameter diffs that predate error logs`,
        suggestedSql: `SELECT * FROM zetaris.config_repo WHERE timestamp >= '${timeFrom}' ORDER BY timestamp ASC LIMIT 10`,
        priority: 'high',
        status: 'pending',
      });

      steps.push({
        stepId: `plan-step-deep-log-${iteration}`,
        source: 'logs',
        objective: `Retrieve fine-grained logs specifically correlating root exception with config changes`,
        suggestedSql: `SELECT * FROM zetaris.logs WHERE severity IN ('ERROR', 'CRITICAL', 'WARN') LIMIT 20`,
        priority: 'high',
        status: 'pending',
      });
    }

    const thought = isRetry
      ? `Evaluator flagged gaps: "${critiqueFeedback}". Re-planning Zetaris queries to focus on causal sequence in config_repo and logs.`
      : `Formulated 5-stage federated query plan across Zetaris tables to correlate deploys, configs, metrics, and error logs within window [${timeFrom} to ${timeTo}].`;

    const plan: InvestigationPlan = {
      rationale: thought,
      targetServices: [incident.service],
      timeWindow: { from: timeFrom, to: timeTo },
      steps,
      iteration,
    };

    return { plan, thought };
  }
}

export const defaultPlannerAgent = new PlannerAgent();
