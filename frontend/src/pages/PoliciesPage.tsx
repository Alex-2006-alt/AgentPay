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
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span>Security & Policy Engine</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure deterministic spending limits, budget ceilings, and service whitelists enforced before any blockchain transaction is signed.
        </p>
      </div>

      {/* Guardrail Philosophy Alert */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3.5">
        <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">Non-Custodial LLM Security Rule:</span>
          {' '}The AI agent has zero direct control over your wallet private keys. All payment requests are intercepted by the deterministic policy engine below and rejected if any limit is breached.
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading policy rules...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Policy Card: Financial Spending Caps */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Financial Ceilings (USDC)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Max Transaction */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Max Per Transaction ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={maxTx}
                  onChange={(e) => setMaxTx(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400">Single transactions above this are blocked.</p>
              </div>

              {/* Daily Limit */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  24h Daily Budget ($)
                </label>
                <input
                  type="number"
                  step="0.10"
                  min="0.10"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-400">Rolling 24-hour spending limit.</p>
              </div>

              {/* Monthly Limit */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Monthly Budget ($)
                </label>
                <input
                  type="number"
                  step="1.00"
                  min="1.00"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400">Aggregate monthly budget ceiling.</p>
              </div>
            </div>

            {/* Auto-Payment Toggle */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Autonomous Payment Authorization</div>
                <div className="text-xs text-slate-400">
                  Automatically settle transactions that pass all policy limits without manual prompt confirmation.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoPayment(!autoPayment)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoPayment ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoPayment ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Approved Services Whitelist */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-semibold text-white">Authorized Service Whitelist</h2>
              </div>
              <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-medium">
                3 Verified Services
              </span>
            </div>

            <div className="space-y-2.5">
              {services?.map((srv) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div>
                      <span className="text-sm font-medium text-slate-200">{srv.name}</span>
                      <div className="text-xs text-slate-400">{srv.endpoint}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    ${srv.price.toFixed(3)} USDC
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>Policy parameters updated successfully</span>
              </span>
            )}

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold text-sm hover:opacity-95 transition-opacity shadow-lg shadow-emerald-500/20 disabled:opacity-50"
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
