import React, { useState } from 'react';
import {
  Compass,
  Search,
  CheckSquare,
  ShieldAlert,
  BrainCircuit,
  Terminal,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AgentTraceStep, ModelCallLog } from '../types/investigation';

interface AgentTraceViewProps {
  traces: AgentTraceStep[];
  modelLogs: ModelCallLog[];
  isInvestigating: boolean;
  status: string;
}

export const AgentTraceView: React.FC<AgentTraceViewProps> = ({
  traces,
  modelLogs,
  isInvestigating,
  status,
}) => {
  const [expandedTraceIds, setExpandedTraceIds] = useState<Record<string, boolean>>({});

  const toggleTrace = (id: string) => {
    setExpandedTraceIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getAgentLabel = (agent: string) => {
    switch (agent) {
      case 'planner':
        return 'Planner';
      case 'investigator':
        return 'Investigator';
      case 'evaluator':
        return 'Evaluator';
      case 'risk_domain':
        return 'Risk Agent';
      case 'hmem_engine':
        return 'H-MEM Engine';
      case 'remediation':
        return 'Remediation';
      default:
        return 'Agent';
    }
  };

  const isNemotron = (model: string) => model.toLowerCase().includes('nemotron');

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs text-[#9c9990] font-mono pb-1">
        <div>
          <span>Executed steps: </span>
          <span className="font-bold text-[#f2efe9]">{traces.length}</span>
          <span className="text-[#363942] mx-2">·</span>
          <span>Nightshift model calls: </span>
          <span className="font-bold text-amber-400">{modelLogs.length}</span>
        </div>

        <div className="text-[11px]">
          Status: <span className="font-bold uppercase text-[#c7c4bc]">{status}</span>
        </div>
      </div>

      {traces.length === 0 ? (
        <div className="bg-[#14161b] border border-[#272a33] rounded-lg p-12 text-center text-[#9c9990] space-y-2">
          <p className="font-serif text-lg text-[#f2efe9]">Agent trace idle</p>
          <p className="text-sm">Click "Start investigation" to trigger the multi-agent reasoning loop.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {traces.map((trace) => {
            const isExpanded = !!expandedTraceIds[trace.id];
            const nemotron = isNemotron(trace.modelUsed);

            return (
              <div
                key={trace.id}
                className="bg-[#14161b] border border-[#272a33] rounded-md overflow-hidden text-sm"
              >
                {/* One line per step (Collapsed by default) */}
                <button
                  onClick={() => toggleTrace(trace.id)}
                  className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[#181a20] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-amber-400 shrink-0 w-24">
                      {getAgentLabel(trace.agent)}
                    </span>

                    <span className="text-[#f2efe9] truncate font-sans">
                      {trace.title}
                    </span>

                    {trace.isCritiqueIteration && (
                      <span className="bg-amber-950/70 text-amber-300 border border-amber-800/60 text-xs px-2 py-0.2 rounded font-mono shrink-0">
                        Critique loop
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] ${
                        nemotron
                          ? 'bg-amber-950/50 border-amber-600/60 text-amber-300 font-semibold'
                          : 'bg-[#181a20] border-[#272a33] text-[#9c9990]'
                      }`}
                    >
                      {nemotron ? 'Nemotron 340B' : trace.modelUsed}
                    </span>

                    <span className="text-[#67655e]">{trace.durationMs}ms</span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#9c9990]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#9c9990]" />
                    )}
                  </div>
                </button>

                {/* Expanded full detail panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#23262f] bg-[#0e0f13] space-y-3 text-xs leading-relaxed animate-in fade-in duration-150">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-[#9c9990] mb-1">
                        Agent Thought & Reasoning:
                      </div>
                      <p className="text-[#d8d5ce] font-sans text-sm leading-relaxed bg-[#14161b] p-3 rounded border border-[#20222a]">
                        {trace.thought}
                      </p>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-mono text-[#9c9990] mb-1">
                        Action Executed:
                      </div>
                      <p className="text-[#c7c4bc] font-mono text-xs bg-[#14161b] p-2.5 rounded border border-[#20222a]">
                        {trace.actionTaken}
                      </p>
                    </div>

                    {trace.critiqueFeedback && (
                      <div className="p-3 bg-[#1e1510] border border-amber-700/60 rounded text-amber-300 font-mono text-xs">
                        <span className="font-bold">[Evaluator Feedback]: </span>
                        <span>{trace.critiqueFeedback}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Live Loading Pulse */}
      {isInvestigating && (
        <div className="p-4 rounded-md bg-[#16181e] border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300 animate-pulse font-mono">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Active model call routing via Meterless Nightshift...</span>
        </div>
      )}
    </div>
  );
};
