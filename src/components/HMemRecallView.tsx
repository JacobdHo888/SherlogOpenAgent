import React from 'react';
import { BrainCircuit, Check, BookOpen } from 'lucide-react';
import { HMemMatch } from '../types/investigation';

interface HMemRecallViewProps {
  matches: HMemMatch[];
}

export const HMemRecallView: React.FC<HMemRecallViewProps> = ({ matches }) => {
  return (
    <div className="bg-[#14161b] border border-[#272a33] rounded text-[#f2efe9] p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#23262f] font-mono">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-[#f2efe9] uppercase tracking-wider">
            Meterless H-MEM Engine · Historical Incident Memory
          </h2>
          <span className="text-[#363942]">/</span>
          <span className="text-[11px] text-[#9c9990]">meterless/h-mem-v2</span>
        </div>

        <span className="text-[11px] text-[#67655e]">
          {matches.length} prior post-mortems matched
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="py-6 text-center text-[#67655e] text-xs font-mono">
          [ H-MEM EPISODIC MEMORY WILL RECALL SIMILAR INCIDENTS ON RUN ]
        </div>
      ) : (
        <div className="space-y-3 font-mono text-xs">
          {matches.map((item) => {
            const simPct = Math.round(item.similarityScore * 100);
            return (
              <div
                key={item.pastIncidentId}
                className="p-3.5 rounded bg-[#0f1013] border border-[#22252e] space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">
                      [{item.pastIncidentId}]
                    </span>
                    <span className="text-[#363942]">/</span>
                    <span className="font-serif font-bold text-[#f2efe9] text-sm">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-600/50 text-amber-300 font-bold">
                      {simPct}% SEMANTIC SIMILARITY
                    </span>
                    <span className="text-[#67655e]">MTTR: {item.resolutionTimeMins}m</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#1a1c22]">
                  <div className="space-y-1">
                    <div className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      <span>PAST REMEDIATION PLAYBOOK:</span>
                    </div>
                    <p className="text-[#c7c4bc] bg-[#14161b] p-2.5 rounded border border-[#20222a] font-sans leading-relaxed text-[11.5px]">
                      {item.remedyAction}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>INSTITUTIONAL LESSON LEARNED:</span>
                    </div>
                    <p className="text-[#c7c4bc] bg-[#14161b] p-2.5 rounded border border-[#20222a] font-sans leading-relaxed text-[11.5px]">
                      {item.lessonsLearned}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
