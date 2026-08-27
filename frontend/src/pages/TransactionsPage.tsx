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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-indigo-600" />
            <span>Transaction Ledger</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Complete audit trail of autonomous AI payments, policy verdicts, and blockchain settlement receipts.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-white/45 backdrop-blur-md border border-white/40 shadow-sm p-1.5 rounded-xl self-start">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          {['all', 'completed', 'rejected', 'pending'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all duration-200 ${
                statusFilter === st
                  ? 'bg-indigo-100/60 text-indigo-700 shadow-sm border border-indigo-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 border border-transparent'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/45 backdrop-blur-xl border border-white/40 rounded-2xl overflow-hidden shadow-sm shadow-slate-900/5 transition-all">
        {isLoading ? (
          <div className="text-center py-16 text-slate-500 font-medium animate-pulse">Loading ledger...</div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-white/20">
            No transactions found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/40 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-300/40">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Blockchain Hash</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 font-sans bg-white/30">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-white/50 transition-colors"
                  >
                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                          tx.status === 'completed'
                            ? 'bg-emerald-100/60 text-emerald-800 border border-emerald-200/50'
                            : tx.status === 'rejected'
                            ? 'bg-rose-100/60 text-rose-800 border border-rose-200/50'
                            : 'bg-amber-100/60 text-amber-800 border border-amber-200/50'
                        }`}
                      >
                        {tx.status === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : tx.status === 'rejected' ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span className="capitalize">{tx.status}</span>
                      </span>
                    </td>

                    {/* Service */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {tx.service_name || tx.service_id}
                      </div>
                      {tx.rejection_reason && (
                        <div className="text-xs font-medium text-rose-600 max-w-xs truncate mt-0.5" title={tx.rejection_reason}>
                          {tx.rejection_reason}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900">
                      ${tx.amount.toFixed(4)}{' '}
                      <span className="text-xs text-slate-500 font-sans font-medium">{tx.currency}</span>
                    </td>

                    {/* Tx Hash */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.tx_hash ? (
                        <a
                          href={`https://sepolia.arbiscan.io/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[12px] font-medium text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-lg border border-slate-300/50 w-fit shadow-inner transition-colors"
                        >
                          <span>
                            {tx.tx_hash.slice(0, 8)}...{tx.tx_hash.slice(-6)}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-slate-500 italic">Internal Policy Verdict</span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-600">
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
