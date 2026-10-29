import React from 'react';
import { Menu, Activity, Sparkles, BookOpen } from 'lucide-react';
import { HealthResponse } from '../types/api';
import { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  health: HealthResponse | null;
  onNavigate: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenMobileMenu,
  health,
  onNavigate,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: 'System status and operational summary',
    },
    analyzer: {
      title: 'Face Landmark Analyzer',
      subtitle: 'Upload, detect, and visualize 478 MediaPipe facial coordinates',
    },
    docs: {
      title: 'API Reference & Documentation',
      subtitle: 'Interactive endpoints, request contracts, and specifications',
    },
    settings: {
      title: 'Model & Architecture Specs',
      subtitle: 'Resource allocation, concurrency control, and system limits',
    },
  };

  const { title, subtitle } = titles[currentTab];

  return (
    <header className="h-18 bg-dark-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            {title}
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick status pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-850 border border-slate-800 text-xs">
          <Activity className="w-3.5 h-3.5 text-brand-cyan" />
          <span className="text-slate-300 font-mono hidden md:inline">
            FastAPI + MediaPipe
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>

        {/* API Docs quick action */}
        {currentTab !== 'docs' && (
          <button
            onClick={() => onNavigate('docs')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-teal" />
            <span className="hidden sm:inline">API Docs</span>
          </button>
        )}
      </div>
    </header>
  );
};
