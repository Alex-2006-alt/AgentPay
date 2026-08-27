import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { AgentPage } from './pages/AgentPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { WalletPage } from './pages/WalletPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { PoliciesPage } from './pages/PoliciesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="relative min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
          {/* Ambient Liquid Glass Orbs (Refracted through frosted layers) */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            {/* Top Left Indigo Liquid Orb */}
            <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-indigo-200/40 via-sky-200/30 to-transparent blur-[90px] animate-blob-1" />
            
            {/* Top Right Violet Liquid Orb */}
            <div className="absolute top-20 right-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-purple-200/35 via-indigo-100/30 to-transparent blur-[100px] animate-blob-2" />
            
            {/* Bottom Left Sky Liquid Orb */}
            <div className="absolute bottom-[-80px] left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-sky-200/35 via-teal-100/25 to-transparent blur-[110px] animate-blob-3" />
            
            {/* Subtle Noise / Specular Grid Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]" />
          </div>

          <div className="flex min-h-screen">
            {/* Main Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <Navbar />
              <main className="flex-1 p-8 max-w-7xl w-full mx-auto overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/agent" element={<AgentPage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/policies" element={<PoliciesPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
