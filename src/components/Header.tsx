import React, { useState, useRef, useEffect } from 'react';
import { Play, RefreshCw, MoreHorizontal, Sparkles, Terminal, Info, Check, Award } from 'lucide-react';

interface HeaderProps {
  activeIncidentId: string;
  onSelectIncident: (id: string) => void;
  onGenerateRandom: () => void;
  isInvestigating: boolean;
  onStartInvestigation: () => void;
  onOpenTestModal: () => void;
  onOpenBenchmarkModal: () => void;
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
  onOpenBenchmarkModal,
  mode,
  onToggleMode,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-[#23262f] bg-[#111216] text-[#f2efe9] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Mode Indicator */}
        <div className="flex items-center gap-3">
          <span className="font-bold text-base tracking-tight text-[#f2efe9]">
            Sherlog
          </span>
          <span className="text-xs text-[#67655e]">/</span>

          {/* Sample / Live Mode Toggle */}
          <div className="flex items-center rounded border border-[#272a33] bg-[#16181e] p-0.5 text-xs">
            <button
              onClick={() => onToggleMode('sample')}
              className={`px-2 py-0.5 rounded transition-colors ${
                mode === 'sample'
                  ? 'bg-[#272a33] text-amber-300 font-medium'
                  : 'text-[#9c9990] hover:text-[#f2efe9]'
              }`}
              title="Sample mode with verified benchmark data"
            >
              Sample mode
            </button>
            <button
              onClick={() => onToggleMode('live')}
              className={`px-2 py-0.5 rounded transition-colors ${
                mode === 'live'
                  ? 'bg-amber-950/70 border border-amber-700/60 text-amber-300 font-medium'
                  : 'text-[#9c9990] hover:text-[#f2efe9]'
              }`}
              title="Live Docker mode connected to local Zetaris"
            >
              Live
            </button>
          </div>
        </div>

        {/* Central Controls: Case Selector */}
        <div className="flex items-center gap-2 flex-1 max-w-md justify-end sm:justify-center">
          <label htmlFor="case-select" className="sr-only">
            Select Incident Case
          </label>
          <select
            id="case-select"
            value={activeIncidentId}
            onChange={(e) => onSelectIncident(e.target.value)}
            disabled={isInvestigating}
            className="bg-[#16181e] border border-[#272a33] text-[#f2efe9] text-xs sm:text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer w-full max-w-sm truncate"
          >
            <option value="INC-8921">INC-8921 · Checkout 500s (Pool Shrink)</option>
            <option value="INC-6402">INC-6402 · Search Latency (Cron Overlap)</option>
            <option value="INC-3190">INC-3190 · Holdout: JWT Clock Drift</option>
          </select>
        </div>

        {/* Right Actions: Primary Start Button + Overflow Details Menu */}
        <div className="flex items-center gap-2">
          {/* One Primary Button */}
          <button
            onClick={onStartInvestigation}
            disabled={isInvestigating}
            className={`px-3.5 py-1.5 rounded text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isInvestigating
                ? 'bg-amber-950/70 text-amber-300 border border-amber-600/40 cursor-wait'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 active:scale-[0.98]'
            }`}
          >
            {isInvestigating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-zinc-950" />
                <span>Start investigation</span>
              </>
            )}
          </button>

          {/* Details Overflow Menu (Synthesize, Tests, Stack details) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded text-[#9c9990] hover:text-[#f2efe9] hover:bg-[#1a1c22] border border-transparent hover:border-[#272a33] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="More tools and case options"
              title="Details & Tools"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded border border-[#272a33] bg-[#14161b] shadow-xl p-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    onGenerateRandom();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-[#c7c4bc] hover:text-[#f2efe9] hover:bg-[#1a1c22] flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Synthesize random case</span>
                </button>

                <button
                  onClick={() => {
                    onOpenBenchmarkModal();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-[#c7c4bc] hover:text-[#f2efe9] hover:bg-[#1a1c22] flex items-center gap-2"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Run benchmark (10 cases)</span>
                </button>

                <button
                  onClick={() => {
                    onOpenTestModal();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-[#c7c4bc] hover:text-[#f2efe9] hover:bg-[#1a1c22] flex items-center gap-2"
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Run verification tests (4/4)</span>
                </button>

                <div className="my-1 border-t border-[#23262f]" />

                <div className="px-3 py-1.5 text-[11px] text-[#67655e] space-y-0.5">
                  <div className="text-[#9c9990] font-medium">Stack Configuration</div>
                  <div>Data: Zetaris Virtual Fabric</div>
                  <div>Primary AI: Meterless Nightshift</div>
                  <div>Challenger: NVIDIA Nemotron 340B</div>
                  <div>Engine: Meterless H-MEM v2</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
