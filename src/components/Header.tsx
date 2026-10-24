import React from 'react';
import { Play, Sparkles, Terminal, RefreshCw, FolderSearch, Radio } from 'lucide-react';

interface HeaderProps {
  activeIncidentId: string;
  onSelectIncident: (id: string) => void;
  onGenerateRandom: () => void;
  isInvestigating: boolean;
  onStartInvestigation: () => void;
  onOpenTestModal: () => void;
  mode: 'sample' | 'live';
  onToggleMode: (mode: 'sample' | 'live') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeIncidentId,
  onSelectIncident,
  onGenerateRandom,
  isInvestigating,
  onStartInvestigation,
  onOpenTestModal,
  mode,
  onToggleMode,
}) => {
  return (
    <header className="border-b border-[#23262f] bg-[#111216] text-[#f2efe9] sticky top-0 z-40">
      <div className="max-w-[1560px] mx-auto px-4 lg:px-6 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Dossier Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-400 font-mono text-sm font-bold shadow-inner">
              SH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-sm text-[#f2efe9] font-mono">SHERLOG</span>
                <span className="text-[11px] text-[#67655e] font-mono">· CASE INVESTIGATOR</span>
                <span className="text-[#363942]">/</span>
                <span className="text-[11px] text-amber-400 font-mono uppercase tracking-wider">
                  The Agent That Can Explain Why
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#9c9990] font-mono">
                <span>Zetaris Data Layer</span>
                <span className="text-[#414552]">·</span>
                <span>Meterless Nightshift</span>
                <span className="text-[#414552]">·</span>
                <span>NVIDIA Nemotron 340B</span>
              </div>
            </div>
          </div>

          {/* Operational Controls & Case Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sample Mode Dossier Badge */}
            <div className="flex items-center rounded border border-[#272a33] bg-[#16181e] p-0.5 text-xs font-mono">
              <button
                onClick={() => onToggleMode('sample')}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  mode === 'sample'
                    ? 'bg-[#272a33] text-amber-300 font-semibold'
                    : 'text-[#9c9990] hover:text-[#f2efe9]'
                }`}
                title="Sample Mode: executes against verified benchmark evidence"
              >
                <Radio className="w-2.5 h-2.5 text-amber-400" />
                <span>SAMPLE MODE</span>
              </button>
              <button
                onClick={() => onToggleMode('live')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  mode === 'live'
                    ? 'bg-amber-950/70 border border-amber-700/60 text-amber-300 font-semibold'
                    : 'text-[#9c9990] hover:text-[#f2efe9]'
                }`}
                title="Live Docker Mode: connects to local Zetaris Docker endpoint"
              >
                LIVE DOCKER
              </button>
            </div>

            {/* Case File Selector */}
            <div className="flex items-center bg-[#16181e] border border-[#272a33] rounded px-2 py-1 text-xs">
              <FolderSearch className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />
              <select
                value={activeIncidentId}
                onChange={(e) => onSelectIncident(e.target.value)}
                disabled={isInvestigating}
                className="bg-transparent text-[#f2efe9] text-xs font-mono focus:outline-none cursor-pointer pr-1"
              >
                <option value="INC-8921" className="bg-[#16181e] text-[#f2efe9]">
                  CASE #INC-8921: Checkout 500s (Pool Shrink)
                </option>
                <option value="INC-6402" className="bg-[#16181e] text-[#f2efe9]">
                  CASE #INC-6402: Search Latency (Cron Overlap)
                </option>
                <option value="INC-3190" className="bg-[#16181e] text-[#f2efe9]">
                  CASE #INC-3190: Holdout: JWT Clock Skew
                </option>
              </select>
            </div>

            {/* Synthesize Random Case */}
            <button
              onClick={onGenerateRandom}
              disabled={isInvestigating}
              className="px-2.5 py-1.5 bg-[#16181e] hover:bg-[#1e2028] text-[#c7c4bc] hover:text-[#f2efe9] border border-[#272a33] rounded text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-40"
              title="Synthesize new randomized case incident"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>SYNTHESIZE</span>
            </button>

            {/* Forensic Tests */}
            <button
              onClick={onOpenTestModal}
              className="px-2.5 py-1.5 bg-[#16181e] hover:bg-[#1e2028] text-[#c7c4bc] hover:text-[#f2efe9] border border-[#272a33] rounded text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Run Automated Verification Test Suite"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>TESTS (3/3)</span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onStartInvestigation}
              disabled={isInvestigating}
              className={`px-3.5 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                isInvestigating
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50 cursor-wait'
                  : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 active:scale-[0.98]'
              }`}
            >
              {isInvestigating ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-300" />
                  <span>INVESTIGATING...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current text-zinc-950" />
                  <span>START INVESTIGATION</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
