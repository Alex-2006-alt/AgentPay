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
import { AccessGate } from './components/AccessGate';

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
      <AccessGate onLogout={() => queryClient.clear()}>
      <Router>
        <div className="relative min-h-screen bg-[#C1D3E9] text-slate-900 font-sans selection:bg-[#7EA9E6]/30 selection:text-slate-900">
          {/* Ambient Slate Minimal Orbs (Subtle, non-glaring ambient reflections) */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            {/* Top Left Ice Slate Orb */}
            <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[#DEEDF2]/30 via-[#C0D4EF]/20 to-transparent blur-[100px] animate-blob-1" />
            
            {/* Top Right Accent Slate Blue Orb */}
            <div className="absolute top-20 right-[-100px] w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-[#7EA9E6]/25 via-[#C0D4EF]/20 to-transparent blur-[110px] animate-blob-2" />
            
            {/* Bottom Left Soft Slate Periwinkle Orb */}
            <div className="absolute bottom-[-80px] left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#DEEDF2]/30 via-[#7EA9E6]/15 to-transparent blur-[120px] animate-blob-3" />
            
            {/* Subtle Texture / Specular Grid Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#353A4B_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]" />
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
      </AccessGate>
    </QueryClientProvider>
  );
};

export default App;
