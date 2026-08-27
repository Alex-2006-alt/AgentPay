import React from 'react';
import { ShieldCheck, Activity, Wallet, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { agentPayApi } from '../services/api';

export const Navbar: React.FC = () => {
  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => agentPayApi.getAgentWallet(),
    refetchInterval: 5000,
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => agentPayApi.getHealth(),
    refetchInterval: 10000,
  });

  return (
    <header className="h-16 border-b border-white/50 bg-white/60 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm shadow-slate-200/50">
      {/* Left: Active Agent Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-white/50 shadow-sm text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-500 font-medium">Agent:</span>
          <span className="font-bold text-slate-800">Primary Autonome</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-700 font-medium shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Policy Guardrails Active</span>
        </div>
      </div>

      {/* Right: Wallet Balance & Health */}
      <div className="flex items-center gap-4">
        {/* Live Balance Card */}
        <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-white/80 border border-white shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Wallet className="w-3.5 h-3.5 text-indigo-500" />
            <span>Balance:</span>
          </div>
          <span className="font-mono text-sm font-bold text-slate-900">
            ${wallet?.balance !== undefined ? wallet.balance.toFixed(3) : '10.000'} <span className="text-slate-500 text-xs">{wallet?.currency || 'USDC'}</span>
          </span>
          <button
            onClick={() => refetchWallet()}
            title="Refresh balance"
            className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors"
          >
            <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        {/* Backend API status */}
        <div className="flex items-center gap-2 text-xs">
          <Activity className={`w-3.5 h-3.5 ${health?.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className="text-slate-500 hidden md:inline font-medium">API:</span>
          <span className={`font-bold ${health?.status === 'healthy' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {health?.status || 'connecting...'}
          </span>
        </div>
      </div>
    </header>
  );
};
