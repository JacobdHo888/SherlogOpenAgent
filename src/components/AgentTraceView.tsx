import React from 'react';
import {
  Compass,
  Search,
  CheckSquare,
  ShieldAlert,
  BrainCircuit,
  CornerDownRight,
  Terminal,
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
  const getAgentBadge = (agent: string) => {
    switch (agent) {
      case 'planner':
        return {
          icon: <Compass className="w-3.5 h-3.5 text-amber-400" />,
          label: 'PLANNER',
          border: 'border-amber-500/40 text-amber-300 bg-amber-950/20',
        };
      case 'investigator':
        return {
          icon: <Search className="w-3.5 h-3.5 text-amber-300" />,
          label: 'INVESTIGATOR',
          border: 'border-zinc-700 text-[#e6e4df] bg-[#1a1c22]',
        };
      case 'evaluator':
        return {
          icon: <CheckSquare className="w-3.5 h-3.5 text-amber-400" />,
          label: 'EVALUATOR',
          border: 'border-amber-600/50 text-amber-300 bg-amber-950/30',
        };
      case 'risk_domain':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
          label: 'RISK / NEMOTRON',
          border: 'border-amber-500 text-amber-300 bg-[#221c12]',
        };
      case 'hmem_engine':
        return {
          icon: <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />,
          label: 'H-MEM ENGINE',
          border: 'border-zinc-700 text-zinc-300 bg-[#16181e]',
        };
      default:
        return {
          icon: <Terminal className="w-3.5 h-3.5 text-zinc-400" />,
          label: 'AGENT',
          border: 'border-zinc-800 text-zinc-400 bg-zinc-900',
        };
    }
  };

  const isNemotron = (model: string) => model.toLowerCase().includes('nemotron');

  return (
    <div className="bg-[#14161b] border border-[#272a33] rounded text-[#f2efe9] flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="p-3.5 border-b border-[#23262f] flex items-center justify-between bg-[#111216] font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-[#f2efe9] uppercase tracking-wider">
            Agent Dispatch & Reasoning Trace
          </h2>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#9c9990]">
          <span>Nightshift:</span>
          <span className="font-bold text-amber-400">{modelLogs.length} calls</span>
        </div>
      </div>

      {/* Trace Log Body */}
      <div className="p-3.5 flex-1 overflow-y-auto space-y-3 font-mono max-h-[640px]">
        {traces.length === 0 ? (
          <div className="py-16 text-center text-[#67655e] text-xs space-y-2">
            <p className="uppercase tracking-widest text-[11px]">[ DISPATCH CONSOLE IDLE ]</p>
            <p className="text-[#9c9990] font-sans">
              Click <strong className="text-amber-400">"START INVESTIGATION"</strong> to launch the Planner, Zetaris Investigator, Evaluator, and Nemotron Challenger loop.
            </p>
          </div>
        ) : (
          traces.map((trace) => {
            const agentMeta = getAgentBadge(trace.agent);
            const nemotron = isNemotron(trace.modelUsed);

            return (
              <div
                key={trace.id}
                className={`p-3 rounded border text-xs transition-opacity duration-300 animate-in fade-in ${
                  trace.isCritiqueIteration
                    ? 'bg-[#1b1712] border-amber-800/60'
                    : 'bg-[#0f1013] border-[#22252e]'
                }`}
              >
                {/* Agent + Model info bar */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 ${agentMeta.border}`}
                    >
                      {agentMeta.icon}
                      <span>{agentMeta.label}</span>
                    </span>

                    <span className="text-[#363942]">/</span>
                    <span className="text-[#c7c4bc] font-semibold text-[11px]">{trace.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 rounded border ${
                        nemotron
                          ? 'bg-amber-950/40 border-amber-600/70 text-amber-300 font-bold'
                          : 'bg-[#16181e] border-[#272a33] text-[#9c9990]'
                      }`}
                    >
                      {nemotron ? 'NEMOTRON-340B' : trace.modelUsed}
                    </span>
                    <span className="text-[#67655e]">{trace.durationMs}ms</span>
                  </div>
                </div>

                {/* Cognitive thought */}
                <p className="text-[#d8d5ce] leading-relaxed text-[11.5px] font-sans pl-2 border-l border-[#272a33] mb-2">
                  {trace.thought}
                </p>

                {/* Action summary */}
                <div className="flex items-start gap-1.5 text-[#9c9990] text-[11px] bg-[#14161b] p-1.5 rounded border border-[#20222a]">
                  <CornerDownRight className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[#c7c4bc] truncate">{trace.actionTaken}</span>
                </div>

                {/* Critique alert if this loopbacked */}
                {trace.critiqueFeedback && (
                  <div className="mt-2 p-2 bg-[#20150e] border border-amber-700/60 rounded text-[11px] text-amber-300">
                    <span className="font-bold">[EVALUATOR CRITIQUE]: </span>
                    <span className="text-[#f2efe9]">{trace.critiqueFeedback}</span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Live indicator */}
        {isInvestigating && (
          <div className="p-3 rounded bg-[#16181e] border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="font-mono">
              <span>METERLESS NIGHTSHIFT ROUTING ACTIVE...</span>
              <div className="text-[10px] text-[#9c9990]">Awaiting next agent decision cycle</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Audit Stats */}
      <div className="p-2.5 border-t border-[#23262f] bg-[#111216] text-[11px] font-mono text-[#9c9990] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-[#67655e]" />
          <span>Status: {status.toUpperCase()}</span>
        </div>
        <div>
          Tokens:{' '}
          <span className="text-[#f2efe9] font-bold">
            {modelLogs.reduce((acc, m) => acc + m.promptTokens + m.completionTokens, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
