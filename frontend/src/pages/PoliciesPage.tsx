import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Save,
  Check,
  Sliders,
  Lock,
  Zap,
} from 'lucide-react';
import { agentPayApi } from '../services/api';

export const PoliciesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [maxTx, setMaxTx] = useState<number>(0.10);
  const [dailyLimit, setDailyLimit] = useState<number>(2.00);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(20.00);
  const [autoPayment, setAutoPayment] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data: policy, isLoading } = useQuery({
    queryKey: ['policy'],
    queryFn: () => agentPayApi.getAgentPolicy(),
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => agentPayApi.getServices(),
  });

  useEffect(() => {
    if (policy) {
      setMaxTx(policy.max_transaction);
      setDailyLimit(policy.daily_limit);
      setMonthlyLimit(policy.monthly_limit);
      setAutoPayment(policy.auto_payment);
    }
  }, [policy]);

  const updateMutation = useMutation({
    mutationFn: (updated: {
      max_transaction: number;
      daily_limit: number;
      monthly_limit: number;
      auto_payment: boolean;
    }) => agentPayApi.updateAgentPolicy('agent_primary', updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy'] });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      max_transaction: Number(maxTx),
      daily_limit: Number(dailyLimit),
      monthly_limit: Number(monthlyLimit),
      auto_payment: autoPayment,
    });
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          <span>Security & Policy Engine</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
          Configure deterministic spending limits, budget ceilings, and service whitelists enforced before any blockchain transaction is signed.
        </p>
      </div>

      {/* Guardrail Philosophy Alert */}
      <div className="p-5 rounded-2xl bg-indigo-100/40 border border-indigo-200/50 flex items-start gap-4 shadow-sm">
        <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 leading-relaxed font-medium">
          <span className="font-bold">Non-Custodial LLM Security Rule:</span>
          {' '}The AI agent has zero direct control over your wallet private keys. All payment requests are intercepted by the deterministic policy engine below and rejected if any limit is breached.
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-500 font-medium animate-pulse">Loading policy rules...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Policy Card: Financial Spending Caps */}
          <div className="bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-6 lg:p-8 space-y-6 transition-all">
            <div className="flex items-center gap-2.5 pb-5 border-b border-slate-300/40">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Financial Ceilings (USDC)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Max Transaction */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Max Per Transaction ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={maxTx}
                  onChange={(e) => setMaxTx(parseFloat(e.target.value))}
                  className="w-full bg-white/70 border border-slate-300/50 rounded-xl px-4 py-3 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all"
                />
                <p className="text-xs text-slate-500 font-medium">Single transactions above this are blocked.</p>
              </div>

              {/* Daily Limit */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  24h Daily Budget ($)
                </label>
                <input
                  type="number"
                  step="0.10"
                  min="0.10"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseFloat(e.target.value))}
                  className="w-full bg-white/70 border border-slate-300/50 rounded-xl px-4 py-3 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all"
                />
                <p className="text-xs text-slate-500 font-medium">Rolling 24-hour spending limit.</p>
              </div>

              {/* Monthly Limit */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Monthly Budget ($)
                </label>
                <input
                  type="number"
                  step="1.00"
                  min="1.00"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(parseFloat(e.target.value))}
                  className="w-full bg-white/70 border border-slate-300/50 rounded-xl px-4 py-3 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all"
                />
                <p className="text-xs text-slate-500 font-medium">Aggregate monthly budget ceiling.</p>
              </div>
            </div>

            {/* Auto-Payment Toggle */}
            <div className="pt-6 border-t border-slate-300/40 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">Autonomous Payment Authorization</div>
                <div className="text-xs text-slate-500 mt-1">
                  Automatically settle transactions that pass all policy limits without manual prompt confirmation.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoPayment(!autoPayment)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${
                  autoPayment ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    autoPayment ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Approved Services Whitelist */}
          <div className="bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-6 lg:p-8 space-y-5 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-300/40">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Authorized Service Whitelist</h2>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 bg-emerald-100/60 text-emerald-800 border border-emerald-200/50 rounded-full shadow-sm">
                3 Verified Services
              </span>
            </div>

            <div className="space-y-3">
              {services?.map((srv) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/55 border border-slate-300/40 hover:bg-white/75 hover:border-slate-300/70 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    <div>
                      <span className="text-sm font-bold text-slate-900">{srv.name}</span>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{srv.endpoint}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100/50 px-2.5 py-1 rounded-md border border-indigo-200/40">
                    ${srv.price.toFixed(3)} USDC
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4 pt-2">
            {savedSuccess && (
              <span className="text-sm text-emerald-600 flex items-center gap-1.5 font-bold animate-in fade-in slide-in-from-right-4">
                <Check className="w-5 h-5" />
                <span>Policy parameters updated successfully</span>
              </span>
            )}

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:transform-none"
            >
              <Save className="w-4 h-4" />
              <span>{updateMutation.isPending ? 'Saving...' : 'Save Policy Parameters'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
