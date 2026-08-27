import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { agentPayApi } from '../services/api';

export const TransactionsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', statusFilter],
    queryFn: () =>
      agentPayApi.getTransactions(statusFilter === 'all' ? undefined : statusFilter),
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-emerald-400" />
            <span>Transaction Ledger</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete audit trail of autonomous AI payments, policy verdicts, and blockchain settlement receipts.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-1 rounded-xl self-start">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          {['all', 'completed', 'rejected', 'pending'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#111827] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Loading ledger...</div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            No transactions found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Blockchain Hash</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-900/40 transition-colors"
                  >
                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          tx.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : tx.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {tx.status === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : tx.status === 'rejected' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span className="capitalize">{tx.status}</span>
                      </span>
                    </td>

                    {/* Service */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-200">
                        {tx.service_name || tx.service_id}
                      </div>
                      {tx.rejection_reason && (
                        <div className="text-xs text-red-400 max-w-xs truncate" title={tx.rejection_reason}>
                          {tx.rejection_reason}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-semibold text-white">
                      ${tx.amount.toFixed(4)}{' '}
                      <span className="text-xs text-slate-400 font-sans">{tx.currency}</span>
                    </td>

                    {/* Tx Hash */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.tx_hash ? (
                        <a
                          href={`https://sepolia.arbiscan.io/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                        >
                          <span>
                            {tx.tx_hash.slice(0, 8)}...{tx.tx_hash.slice(-6)}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Internal Policy Verdict</span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
