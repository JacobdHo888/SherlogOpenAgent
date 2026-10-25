import React from 'react';
import { CheckCircle2, Activity, Terminal, Scale, Wrench } from 'lucide-react';

export type ActiveSection = 'answer' | 'evidence' | 'action' | 'trace' | 'audit';

interface NavigationTabsProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  evidenceCount: number;
  recommendationCount?: number;
  traceCount: number;
  isInvestigating: boolean;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeSection,
  onSelectSection,
  evidenceCount,
  recommendationCount = 0,
  traceCount,
  isInvestigating,
}) => {
  const tabs = [
    {
      id: 'answer' as const,
      label: 'Answer',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      id: 'evidence' as const,
      label: 'Evidence',
      icon: <Activity className="w-4 h-4" />,
      badge: evidenceCount > 0 ? evidenceCount : undefined,
    },
    {
      id: 'action' as const,
      label: 'Action',
      icon: <Wrench className="w-4 h-4" />,
      badge: recommendationCount > 0 ? recommendationCount : undefined,
    },
    {
      id: 'trace' as const,
      label: 'Agent trace',
      icon: <Terminal className="w-4 h-4" />,
      badge: traceCount > 0 ? traceCount : undefined,
      pulse: isInvestigating,
    },
    {
      id: 'audit' as const,
      label: 'Audit',
      icon: <Scale className="w-4 h-4" />,
    },
  ];

  return (
    <nav
      className="flex items-center gap-1 border-b border-[#23262f] pb-px"
      role="tablist"
      aria-label="Investigation sections"
    >
      {tabs.map((tab) => {
        const isActive = activeSection === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onSelectSection(tab.id)}
            className={`px-4 py-2.5 rounded-t-md text-sm font-medium flex items-center gap-2 border-b-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isActive
                ? 'border-amber-500 text-amber-400 bg-[#16181e]'
                : 'border-transparent text-[#9c9990] hover:text-[#f2efe9] hover:bg-[#14161b]'
            }`}
          >
            <span className={isActive ? 'text-amber-400' : 'text-[#67655e]'}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-[#23262f] text-[#9c9990]'
                }`}
              >
                {tab.badge}
              </span>
            )}
            {tab.pulse && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
