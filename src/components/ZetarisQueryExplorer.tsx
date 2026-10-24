import React, { useState } from 'react';
import { Database, ChevronDown, ChevronRight, Terminal } from 'lucide-react';
import { ZetarisQueryResult } from '../types/investigation';

interface ZetarisQueryExplorerProps {
  queryLogs: ZetarisQueryResult[];
}

export const ZetarisQueryExplorer: React.FC<ZetarisQueryExplorerProps> = ({ queryLogs }) => {
  const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);

  return (
    <div className="bg-[#14161b] border border-[#272a33] rounded text-[#f2efe9] p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#23262f] font-mono">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-[#f2efe9] uppercase tracking-wider">
            Zetaris Virtual Data Fabric · Query Dispatch Audit
          </h2>
        </div>

        <span className="text-[11px] text-[#67655e]">
          {queryLogs.length} queries executed
        </span>
      </div>

      {queryLogs.length === 0 ? (
        <div className="py-6 text-center text-[#67655e] text-xs font-mono">
          [ NO ZETARIS QUERIES EXECUTED YET ]
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 font-mono text-xs">
          {queryLogs.map((q) => {
            const isExpanded = expandedQueryId === q.queryId;
            return (
              <div
                key={q.queryId}
                className="rounded bg-[#0f1013] border border-[#22252e] p-2.5"
              >
                <div
                  onClick={() => setExpandedQueryId(isExpanded ? null : q.queryId)}
                  className="flex items-center justify-between cursor-pointer select-none gap-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#67655e] shrink-0" />
                    )}
                    <span className="text-amber-400 font-bold">[{q.targetTable.toUpperCase()}]</span>
                    <span className="text-[#c7c4bc] truncate text-[11px]">{q.sql}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-[#1a1c22] border border-[#2b2e38] text-[#e6e4df]">
                      {q.rowCount} rows
                    </span>
                    <span className="text-[#67655e]">{q.executionTimeMs}ms</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        q.mode === 'live-docker'
                          ? 'bg-amber-950/60 border border-amber-600/70 text-amber-300'
                          : 'bg-[#16181e] border-[#272a33] text-[#9c9990]'
                      }`}
                    >
                      {q.mode}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-[#1a1c22] space-y-2 text-[11px]">
                    <div>
                      <div className="text-[#9c9990] mb-0.5">Dispatched SQL:</div>
                      <div className="bg-[#14161b] p-2.5 rounded border border-[#22252e] text-amber-300 overflow-x-auto whitespace-pre-wrap">
                        {q.sql}
                      </div>
                    </div>

                    <div>
                      <div className="text-[#9c9990] mb-0.5">
                        Sample Result Rows ({q.rowCount} total):
                      </div>
                      <div className="bg-[#14161b] p-2 rounded border border-[#22252e] text-[#c7c4bc] max-h-36 overflow-y-auto space-y-1">
                        {q.data.slice(0, 4).map((row) => (
                          <div
                            key={row.evidenceId}
                            className="flex items-center justify-between text-[10.5px] border-b border-[#20222a] pb-1"
                          >
                            <span className="text-amber-400">[{row.evidenceId}]</span>
                            <span className="text-[#f2efe9] truncate mx-2">{row.title}</span>
                            <span className="text-[#67655e] shrink-0">{row.timestamp.slice(11, 19)}Z</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
