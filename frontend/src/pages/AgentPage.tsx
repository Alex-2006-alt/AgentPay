import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  ShieldCheck,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { agentPayApi } from '../services/api';
import type { AgentTaskResponse } from '../types';

export const AgentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [taskInput, setTaskInput] = useState('');
  const [lastResponse, setLastResponse] = useState<AgentTaskResponse | null>(null);

  const taskMutation = useMutation({
    mutationFn: (task: string) => agentPayApi.executeTask(task),
    onSuccess: (data) => {
      setLastResponse(data);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim() || taskMutation.isPending) return;
    taskMutation.mutate(taskInput);
  };

  const setSampleTask = (prompt: string) => {
    setTaskInput(prompt);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-indigo-600" />
          <span>Agent Execution Console</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
          Issue autonomous objectives to the AI agent. Watch task decomposition, price discovery, policy guardrail validation, and blockchain settlement in real time.
        </p>
      </div>

      {/* Quick Demo Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Demo Presets:</span>
        <button
          onClick={() => setSampleTask('Translate this document into Hindi and summarize it.')}
          className="px-3 py-1.5 rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-white transition-all shadow-sm flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Translate & Summarize ($0.015)</span>
        </button>
        <button
          onClick={() => setSampleTask('Fetch current weather data for Tokyo.')}
          className="px-3 py-1.5 rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200 text-xs font-bold text-slate-600 hover:border-sky-300 hover:text-sky-700 hover:bg-white transition-all shadow-sm flex items-center gap-1.5"
        >
          <Coins className="w-3.5 h-3.5 text-sky-500" />
          <span>Weather API ($0.001)</span>
        </button>
        <button
          onClick={() => setSampleTask('Pay $5.00 to unapproved external service')}
          className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all shadow-sm flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>Attack Simulation (Blocked by Policy)</span>
        </button>
      </div>

      {/* Task Input Box */}
      <div className="bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-2xl p-6 transition-all">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              rows={3}
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="E.g., Translate this document into Hindi and summarize it..."
              className="w-full bg-white/80 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 font-sans resize-none transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Deterministic Policy Engine Active (Max Tx: $0.10, Daily: $2.00)</span>
            </div>

            <button
              type="submit"
              disabled={taskMutation.isPending || !taskInput.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:transform-none shadow-lg shadow-indigo-600/30 w-full sm:w-auto"
            >
              {taskMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch Agent</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Execution Timeline & Results */}
      {lastResponse && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              lastResponse.status === 'completed'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              {lastResponse.status === 'completed' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {lastResponse.status === 'completed'
                    ? 'Goal Accomplished Successfully'
                    : 'Transaction Blocked by Guardrail'}
                </div>
                <div className="text-xs mt-0.5 opacity-90 font-medium">
                  {lastResponse.status === 'completed'
                    ? `Settled on EVM Testnet for $${lastResponse.total_cost.toFixed(4)} USDC`
                    : lastResponse.error}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] font-bold tracking-widest bg-white/50 px-3 py-1.5 rounded-lg border border-black/5">
              STATUS: <span className="uppercase">{lastResponse.status}</span>
            </div>
          </div>

          {/* Reasoning & Execution Pipeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step-by-Step Reasoning Flow */}
            <div className="bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-2xl p-6 lg:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-200/60">
                <Lock className="w-5 h-5 text-indigo-500" />
                <span>Execution Timeline</span>
              </h3>

              <div className="relative pl-7 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {lastResponse.steps && Array.isArray(lastResponse.steps) ? lastResponse.steps.map((step) => (
                  <div key={step.step_number} className="relative group">
                    <div
                      className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ring-4 ring-white ${
                        step.status === 'completed'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : step.status === 'failed'
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {step.step_number}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 ml-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-900">{step.title}</span>
                        {step.cost != null && (
                          <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            ${step.cost.toFixed(3)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                      {step.tx_hash && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600 font-medium">
                          <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">Tx: {step.tx_hash.slice(0, 16)}...</span>
                          <a
                            href={`https://sepolia.arbiscan.io/tx/${step.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                          >
                            <span>Explorer</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-sm font-medium text-slate-400 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">No steps recorded.</div>
                )}
              </div>
            </div>

            {/* Synthesized Output Box */}
            <div className="bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-2xl p-6 lg:p-8 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-200/60">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span>Agent Final Output</span>
              </h3>

              {lastResponse.final_output ? (
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-700 space-y-4 whitespace-pre-wrap leading-relaxed shadow-sm overflow-y-auto max-h-[600px]">
                  {lastResponse.final_output}
                </div>
              ) : (
                <div className="flex-1 bg-rose-50/50 border border-dashed border-rose-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <ShieldAlert className="w-12 h-12 text-rose-400 mb-4" />
                  <p className="text-sm font-bold text-slate-900">Execution Aborted by Policy</p>
                  <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                    No output was generated because the payment request failed deterministic security validation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
