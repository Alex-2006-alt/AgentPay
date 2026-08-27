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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Autonomous Settlement Overview</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Live Network
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time agent micropayments, spending velocity, and policy guardrail metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/agent"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold text-sm hover:opacity-95 transition-opacity shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Agent Console</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Balance */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Agent Wallet Balance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              ${analytics?.wallet_balance !== undefined ? analytics.wallet_balance.toFixed(3) : '10.000'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <span className="text-emerald-400 font-medium">USDC</span>
              <span>•</span>
              <span>Arbitrum Sepolia</span>
            </div>
          </div>
        </div>

        {/* 24h Spending */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">24-Hour Spending</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              ${analytics?.daily_spend !== undefined ? analytics.daily_spend.toFixed(4) : '0.0000'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <span>Daily Cap:</span>
              <span className="text-slate-200 font-medium">$2.00 max</span>
            </div>
          </div>
        </div>

        {/* Total Settled Transactions */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Settled Transactions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              {analytics?.successful_transactions || 0}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1 font-medium">
              <span>100% testnet verified</span>
            </div>
          </div>
        </div>

        {/* Security & Policy Blocks */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Policy Blocks (Defended)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              {analytics?.failed_transactions || 0}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <span className="text-amber-400 font-medium">Prompt injection defense</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Recent Transactions & Active Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Payment Settlements</h2>
              <p className="text-xs text-slate-400">Live micropayments executed by autonomous agents</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No transactions recorded yet.</p>
              <Link to="/agent" className="text-xs text-emerald-400 mt-1 inline-block">
                Execute a task in the Agent Console →
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : tx.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {tx.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : tx.status === 'rejected' ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        {tx.service_name || tx.service_id}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {tx.tx_hash ? `${tx.tx_hash.slice(0, 10)}...${tx.tx_hash.slice(-8)}` : 'Internal Policy Evaluation'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-mono font-semibold text-white">
                      ${tx.amount.toFixed(4)} <span className="text-[10px] text-slate-400">{tx.currency}</span>
                    </div>
                    <div
                      className={`text-[10px] font-medium capitalize ${
                        tx.status === 'completed'
                          ? 'text-emerald-400'
                          : tx.status === 'rejected'
                          ? 'text-red-400'
                          : 'text-amber-400'
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
        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Microservice Registry</h2>
              <p className="text-xs text-slate-400">Discoverable paid AI endpoints</p>
            </div>
            <Link
              to="/marketplace"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {services?.map((service) => (
              <div
                key={service.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-200">{service.name}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ${service.price.toFixed(3)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 mb-2">{service.description}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                  <span>⭐ {service.rating.toFixed(1)}</span>
                  <span>⚡ {service.average_response_time}ms</span>
                  <span className="text-emerald-400">● {service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
