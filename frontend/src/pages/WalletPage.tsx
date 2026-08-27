import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet as WalletIcon,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { agentPayApi } from '../services/api';

export const WalletPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const { data: wallet, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => agentPayApi.getAgentWallet(),
  });

  const { data: policy } = useQuery({
    queryKey: ['policy'],
    queryFn: () => agentPayApi.getAgentPolicy(),
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => agentPayApi.getAnalytics(),
  });

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <WalletIcon className="w-6 h-6 text-indigo-600" />
          <span>Agent Wallet Manager</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Manage the dedicated non-custodial testnet wallet, spending ceilings, and EVM network settlement rails.
        </p>
      </div>

      {/* Main Wallet Overview Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-8 lg:p-10 shadow-xl shadow-slate-200/60 relative overflow-hidden transition-all">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {wallet?.network || 'Arbitrum Sepolia'}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-mono tracking-widest">
                ID: 421614
              </span>
            </div>

            <div className="text-4xl lg:text-5xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
              ${wallet?.balance !== undefined ? wallet.balance.toFixed(3) : '10.000'}{' '}
              <span className="text-xl lg:text-2xl font-sans text-indigo-600">{wallet?.currency || 'USDC'}</span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Testnet Mock Tokens for autonomous AI micropayments.
            </p>
          </div>

          {/* Address Box */}
          <div className="bg-slate-50 border border-slate-200 shadow-inner rounded-2xl p-5 lg:min-w-[440px]">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Agent Wallet Address
            </span>
            <div className="flex items-center justify-between gap-3 mt-2 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-indigo-200">
              <span className="font-mono text-sm font-medium text-slate-700 truncate select-all">
                {wallet?.address || '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'}
              </span>
              <button
                onClick={copyAddress}
                className="text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 p-2 rounded-lg transition-colors flex items-center gap-1 border border-transparent hover:border-indigo-100"
                title="Copy Address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between mt-4 px-1">
              <a
                href={`https://sepolia.arbiscan.io/address/${wallet?.address}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors group"
              >
                <span>View on Arbiscan</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <button
                onClick={() => refetch()}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors group"
              >
                <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Ceilings & Policy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-2xl p-6 lg:p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Max Per Transaction
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            ${policy?.max_transaction.toFixed(2) || '0.10'}
          </div>
          <p className="text-xs font-medium text-slate-500 mt-2">
            Single calls exceeding this limit are instantly blocked.
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-2xl p-6 lg:p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            24h Daily Budget
          </div>
          <div className="text-3xl font-bold font-mono text-sky-600">
            ${analytics?.daily_spend.toFixed(4) || '0.0000'} <span className="text-xl text-slate-400">/ ${policy?.daily_limit.toFixed(2) || '2.00'}</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-2">
            Rolling 24-hour aggregate spending limit.
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-2xl p-6 lg:p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Monthly Cap
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-600">
            ${analytics?.monthly_spend.toFixed(4) || '0.0000'} <span className="text-xl text-slate-400">/ ${policy?.monthly_limit.toFixed(2) || '20.00'}</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-2">
            Monthly budget ceiling enforced across all agents.
          </p>
        </div>
      </div>
    </div>
  );
};
