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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <WalletIcon className="w-6 h-6 text-emerald-400" />
          <span>Agent Wallet Manager</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage the dedicated non-custodial testnet wallet, spending ceilings, and EVM network settlement rails.
        </p>
      </div>

      {/* Main Wallet Overview Card */}
      <div className="bg-gradient-to-br from-slate-900 via-[#111827] to-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {wallet?.network || 'Arbitrum Sepolia Testnet'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                Chain ID: 421614
              </span>
            </div>

            <div className="text-4xl font-extrabold text-white font-mono tracking-tight mt-1">
              ${wallet?.balance !== undefined ? wallet.balance.toFixed(3) : '10.000'}{' '}
              <span className="text-lg font-sans text-emerald-400">{wallet?.currency || 'USDC'}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Testnet Mock Tokens for autonomous AI micropayments.
            </p>
          </div>

          {/* Address Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 lg:min-w-[420px]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Agent Wallet Address
            </span>
            <div className="flex items-center justify-between gap-3 mt-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <span className="font-mono text-xs text-slate-200 truncate">
                {wallet?.address || '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7'}
              </span>
              <button
                onClick={copyAddress}
                className="text-slate-400 hover:text-white p-1 transition-colors flex items-center gap-1 text-xs"
                title="Copy Address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs">
              <a
                href={`https://sepolia.arbiscan.io/address/${wallet?.address}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <span>View on Arbiscan</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={() => refetch()}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Ceilings & Policy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Max Per Transaction
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${policy?.max_transaction.toFixed(2) || '0.10'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Single calls exceeding this limit are instantly blocked.
          </p>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            24h Daily Budget
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            ${analytics?.daily_spend.toFixed(4) || '0.0000'} / ${policy?.daily_limit.toFixed(2) || '2.00'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rolling 24-hour aggregate spending limit.
          </p>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Monthly Cap
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${analytics?.monthly_spend.toFixed(4) || '0.0000'} / ${policy?.monthly_limit.toFixed(2) || '20.00'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monthly budget ceiling enforced across all agents.
          </p>
        </div>
      </div>
    </div>
  );
};
