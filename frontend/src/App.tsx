import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { ApiDocsPage } from './pages/ApiDocsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HealthResponse } from './types/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('analyzer');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // Poll health status periodically
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/health');
        if (res.ok) {
          const data: HealthResponse = await res.json();
          setHealth(data);
        }
      } catch (err) {
        // Backend might still be starting
        console.warn('Backend health check pending...');
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex bg-grid-pattern">
      {/* Responsive Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        health={health}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <Navbar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          health={health}
          onNavigate={setCurrentTab}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-full overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardPage health={health} onNavigate={setCurrentTab} />
          )}
          {currentTab === 'analyzer' && <AnalyzerPage />}
          {currentTab === 'docs' && <ApiDocsPage />}
          {currentTab === 'settings' && <SettingsPage health={health} />}
        </main>

        {/* Global Footer */}
        <footer className="py-4 px-8 border-t border-slate-900 bg-dark-950/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">FaceLab AI</span>
            <span>&bull;</span>
            <span>MediaPipe Tasks Vision on CPU</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Memory Budget: 2GB &bull; 1.5 vCPU Target
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
