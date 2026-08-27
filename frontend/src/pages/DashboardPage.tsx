import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { agentPayApi } from '../services/api';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => agentPayApi.getAnalytics(),
    refetchInterval: 5000,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => agentPayApi.getTransactions(),
    refetchInterval: 5000,
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => agentPayApi.getServices(),
  });

  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Autonomous Settlement Overview</span>
            <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              Live Network
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time agent micropayments, spending velocity, and policy guardrail metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/agent"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Agent Console</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Balance */}
        <div className="bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-6 hover:bg-white/60 hover:border-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Agent Balance</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-100/50 text-indigo-700 flex items-center justify-center border border-indigo-200/40 shadow-sm">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
              ${analytics?.wallet_balance !== undefined ? analytics.wallet_balance.toFixed(3) : '10.000'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
              <span className="text-indigo-600 font-bold">USDC</span>
              <span>•</span>
              <span>Arbitrum Sepolia</span>
            </div>
          </div>
        </div>

        {/* 24h Spending */}
        <div className="bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-6 hover:bg-white/60 hover:border-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">24H Spending</span>
            <div className="w-10 h-10 rounded-xl bg-sky-100/50 text-sky-700 flex items-center justify-center border border-sky-200/40 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
              ${analytics?.daily_spend !== undefined ? analytics.daily_spend.toFixed(4) : '0.0000'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
              <span>Daily Cap:</span>
              <span className="text-slate-800 font-bold">$2.00 max</span>
            </div>
          </div>
        </div>

        {/* Total Settled Transactions */}
        <div className="bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-6 hover:bg-white/60 hover:border-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Settlements</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/50 text-emerald-700 flex items-center justify-center border border-emerald-200/40 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {analytics?.successful_transactions || 0}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-700 mt-2 font-bold">
              <span>100% testnet verified</span>
            </div>
          </div>
        </div>

        {/* Security & Policy Blocks */}
        <div className="bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-6 hover:bg-white/60 hover:border-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Policy Blocks</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100/50 text-amber-700 flex items-center justify-center border border-amber-200/40 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {analytics?.failed_transactions || 0}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
              <span className="text-amber-700 font-bold">Defended actions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Recent Transactions & Active Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-300/40">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Payment Settlements</h2>
              <p className="text-sm text-slate-500 mt-1">Live micropayments executed by autonomous agents</p>
            </div>
            <Link
              to="/transactions"
              className="text-sm text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 bg-indigo-100/50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200/40"
            >
              <span>View all</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-300/60 rounded-xl bg-white/25">
              <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No transactions recorded yet.</p>
              <Link to="/agent" className="text-sm font-bold text-indigo-600 mt-2 inline-block hover:underline">
                Execute a task in the Agent Console →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/55 border border-slate-300/40 hover:bg-white/75 hover:border-slate-300/70 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                        tx.status === 'completed'
                          ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200/50'
                          : tx.status === 'rejected'
                          ? 'bg-rose-100/50 text-rose-700 border-rose-200/50'
                          : 'bg-amber-100/50 text-amber-700 border-amber-200/50'
                      }`}
                    >
                      {tx.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : tx.status === 'rejected' ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Activity className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {tx.service_name || tx.service_id}
                      </div>
                      <div className="text-[12px] text-slate-500 font-mono mt-0.5">
                        {tx.tx_hash ? <span className="bg-white/60 px-1.5 py-0.5 rounded border border-slate-300/50">{tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}</span> : 'Internal Policy Evaluation'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-mono font-bold text-slate-900">
                      ${tx.amount.toFixed(4)} <span className="text-xs text-slate-500">{tx.currency}</span>
                    </div>
                    <div
                      className={`text-[11px] font-bold uppercase tracking-wider mt-1 ${
                        tx.status === 'completed'
                          ? 'text-emerald-700'
                          : tx.status === 'rejected'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Marketplace Active Services */}
        <div className="bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-300/40">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Microservice Registry</h2>
              <p className="text-sm text-slate-500 mt-1">Discoverable paid endpoints</p>
            </div>
            <Link
              to="/marketplace"
              className="text-sm text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 bg-indigo-100/50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200/40"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {services?.map((service) => (
              <div
                key={service.id}
                className="p-4 rounded-xl bg-white/55 border border-slate-300/40 hover:bg-white/75 hover:border-slate-300/70 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900">{service.name}</span>
                  <span className="text-sm font-mono font-bold text-indigo-700 bg-indigo-100/50 px-2 py-0.5 rounded-md border border-indigo-200/40">
                    ${service.price.toFixed(3)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{service.description}</p>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-3 border-t border-slate-200/50">
                  <span className="flex items-center gap-1">⭐ {service.rating.toFixed(1)}</span>
                  <span className="flex items-center gap-1">⚡ {service.average_response_time}ms</span>
                  <span className="text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
