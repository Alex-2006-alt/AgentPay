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
    <header className="h-16 border-b border-slate-800/80 bg-[#111827]/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Active Agent Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Agent:</span>
          <span className="font-semibold text-slate-200">Primary Autonome</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Policy Guardrails Active</span>
        </div>
      </div>

      {/* Right: Wallet Balance & Health */}
      <div className="flex items-center gap-4">
        {/* Live Balance Card */}
        <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Balance:</span>
          </div>
          <span className="font-mono text-sm font-bold text-emerald-400">
            ${wallet?.balance !== undefined ? wallet.balance.toFixed(3) : '10.000'} {wallet?.currency || 'USDC'}
          </span>
          <button
            onClick={() => refetchWallet()}
            title="Refresh balance"
            className="text-slate-400 hover:text-slate-200 p-0.5"
          >
            <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        {/* Backend API status */}
        <div className="flex items-center gap-2 text-xs">
          <Activity className={`w-3.5 h-3.5 ${health?.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-slate-400 hidden md:inline">API:</span>
          <span className={`font-medium ${health?.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {health?.status || 'connecting...'}
          </span>
        </div>
      </div>
    </header>
  );
};
