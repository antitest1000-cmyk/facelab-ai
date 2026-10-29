import React from 'react';
import {
  LayoutDashboard,
  ScanFace,
  FileCode2,
  Cpu,
  Activity,
  Github,
  Server,
  X,
} from 'lucide-react';
import { HealthResponse } from '../types/api';

export type NavTab = 'dashboard' | 'analyzer' | 'docs' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  health: HealthResponse | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  health,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'System dashboard & stats',
    },
    {
      id: 'analyzer' as NavTab,
      label: 'Face Analyzer',
      icon: ScanFace,
      description: 'Interactive landmark studio',
      badge: '478 pts',
    },
    {
      id: 'docs' as NavTab,
      label: 'API Explorer',
      icon: FileCode2,
      description: 'Endpoints & schema docs',
    },
    {
      id: 'settings' as NavTab,
      label: 'Model & Specs',
      icon: Cpu,
      description: 'Host & pipeline settings',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-dark-900 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-cyan via-brand-teal to-brand-violet flex items-center justify-center p-[2px] shadow-lg shadow-brand-cyan/20">
              <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
                <ScanFace className="w-5 h-5 text-brand-cyan" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-lg tracking-tight text-white">FaceLab</h1>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Face Landmark Analysis</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Service Status */}
        <div className="px-5 py-3 border-b border-slate-800/50 bg-dark-950/40">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health?.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                />
              </span>
              <span className="text-slate-300 font-medium">
                {health?.status === 'healthy' ? 'Engine Ready' : 'Connecting...'}
              </span>
            </div>
            <span className="font-mono text-slate-400 text-[11px]">
              {health?.memory_mb ? `${health.memory_mb} MB` : 'CPU Mode'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all group ${isActive
                    ? 'bg-gradient-to-r from-brand-cyan/15 to-transparent text-brand-cyan border border-brand-cyan/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-brand-cyan' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                  />
                  <div>
                    <div className="text-sm font-medium tracking-wide">{item.label}</div>
                    <div className="text-[11px] text-slate-500 group-hover:text-slate-400">
                      {item.description}
                    </div>
                  </div>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Host specifications badge */}
        <div className="p-4 border-t border-slate-800/80 bg-dark-950/60">
          <div className="rounded-lg p-3 bg-dark-850 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-brand-cyan" />
                Target Spec
              </span>
              <span className="text-[11px] font-mono text-emerald-400">Optimized</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 font-mono">
              <div>RAM: <span className="text-slate-200">2 GB</span></div>
              <div>CPU: <span className="text-slate-200">1.5 vCPU</span></div>
              <div>Disk: <span className="text-slate-200">2 GB</span></div>
              <div>GPU: <span className="text-slate-200">None (CPU)</span></div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
