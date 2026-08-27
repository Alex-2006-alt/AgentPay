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
        <div className="flex min-h-screen bg-transparent text-slate-900 font-sans">
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
      </Router>
    </QueryClientProvider>
  );
};

export default App;
