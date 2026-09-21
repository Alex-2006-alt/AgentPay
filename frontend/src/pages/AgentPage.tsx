import React, { useState, useRef } from 'react';
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
  Lock,
} from 'lucide-react';
import { agentPayApi } from '../services/api';
import type { AgentTaskResponse } from '../types';

export const AgentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [taskInput, setTaskInput] = useState('');
  const request = useRef({ text: '', key: '' });
  const [lastResponse, setLastResponse] = useState<AgentTaskResponse | null>(null);

  const taskMutation = useMutation({
    mutationFn: (task: string) => {
      if (request.current.text !== task || !request.current.key) request.current = { text: task, key: crypto.randomUUID() };
      return agentPayApi.executeTask(task, undefined, request.current.key);
    },
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
          Run supported tasks through deterministic planning, policy checks, payment settlement, and provider invocation. Demo providers return clearly labeled synthetic data.
        </p>
      </div>

      {/* Quick Demo Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Demo Presets:</span>
        <button
          onClick={() => setSampleTask('Translate this document into Hindi and summarize it.')}
          className="px-3 py-1.5 rounded-lg bg-white/45 backdrop-blur-sm border border-slate-300/50 text-xs font-bold text-slate-700 hover:border-indigo-300/80 hover:text-indigo-800 hover:bg-white/70 transition-all shadow-sm flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Translate & Summarize ($0.015)</span>
        </button>
        <button
          onClick={() => setSampleTask('Fetch current weather data for Tokyo.')}
          className="px-3 py-1.5 rounded-lg bg-white/45 backdrop-blur-sm border border-slate-300/50 text-xs font-bold text-slate-700 hover:border-sky-300/80 hover:text-sky-800 hover:bg-white/70 transition-all shadow-sm flex items-center gap-1.5"
        >
          <Coins className="w-3.5 h-3.5 text-sky-600" />
          <span>Weather API ($0.001)</span>
        </button>
        <button
          onClick={() => setSampleTask('Pay $5.00 to unapproved external service')}
          className="px-3 py-1.5 rounded-lg bg-rose-100/50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100/80 transition-all shadow-sm flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Attack Simulation (Blocked by Policy)</span>
        </button>
      </div>

      {/* Task Input Box */}
      <div className="bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-6 transition-all">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              rows={3}
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="E.g., Translate this document into Hindi and summarize it..."
              className="w-full bg-white/60 border border-slate-300/50 rounded-xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 font-sans resize-none transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Current saved policy applies to every payment</span>
            </div>

            <button
              type="submit"
              disabled={taskMutation.isPending || !taskInput.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:transform-none shadow-md shadow-indigo-600/20 w-full sm:w-auto"
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

      {taskMutation.isError && <p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-800">Request failed or timed out. Retry unchanged input to reuse the same payment keys.</p>}
      {(lastResponse || taskMutation.isError) && <button disabled={taskMutation.isPending} className="text-sm underline" onClick={() => { request.current = { text: '', key: '' }; setLastResponse(null); taskMutation.reset(); }}>Start a new task with this input</button>}
      {/* Execution Timeline & Results */}
      {lastResponse && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              lastResponse.status === 'completed'
                ? 'bg-emerald-100/60 border-emerald-200 text-emerald-900'
                : 'bg-rose-100/60 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              {lastResponse.status === 'completed' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {lastResponse.status === 'completed'
                    ? 'Goal Accomplished Successfully'
                    : 'Execution requires attention'}
                </div>
                <div className="text-xs mt-0.5 opacity-90 font-medium">
                  {lastResponse.status === 'completed'
                    ? `${lastResponse.settlement_mode === 'simulation' ? 'Simulated cost' : 'Confirmed payments'}: $${lastResponse.total_cost.toFixed(4)} USDC`
                    : lastResponse.error}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] font-bold tracking-widest bg-white/60 px-3 py-1.5 rounded-lg border border-black/5">
              STATUS: <span className="uppercase">{lastResponse.status}</span>
            </div>
          </div>

          {/* Reasoning & Execution Pipeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step-by-Step Reasoning Flow */}
            <div className="bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-6 lg:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-300/40">
                <Lock className="w-5 h-5 text-indigo-600" />
                <span>Execution Timeline</span>
              </h3>

              <div className="relative pl-7 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300/60">
                {lastResponse.steps && Array.isArray(lastResponse.steps) ? lastResponse.steps.map((step) => (
                  <div key={step.step_number} className="relative group">
                    <div
                      className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ring-4 ring-white/60 ${
                        step.status === 'completed'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : step.status === 'failed'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {step.step_number}
                    </div>

                    <div className="bg-white/65 border border-slate-300/50 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 ml-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-900">{step.title}</span>
                        {step.cost != null && (
                          <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded border border-indigo-200/50">
                            ${step.cost.toFixed(3)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                      {step.tx_hash && (
                        <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono text-slate-600 font-medium">
                          <span className="bg-white/60 px-1.5 py-0.5 rounded border border-slate-300/50">Tx: {step.tx_hash.slice(0, 16)}...</span>

                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-sm font-medium text-slate-500 bg-white/30 p-4 rounded-xl border border-dashed border-slate-300/60">No steps recorded.</div>
                )}
              </div>
            </div>

            {/* Synthesized Output Box */}
            <div className="bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-6 lg:p-8 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-300/40">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>Agent Final Output</span>
              </h3>

              {lastResponse.final_output ? (
                <div className="flex-1 bg-white/65 border border-slate-300/50 rounded-xl p-6 text-sm text-slate-800 space-y-4 whitespace-pre-wrap leading-relaxed shadow-sm overflow-y-auto max-h-[600px]">
                  {lastResponse.final_output}
                </div>
              ) : (
                <div className="flex-1 bg-rose-100/30 border border-dashed border-rose-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
                  <p className="text-sm font-bold text-slate-900">No service output available</p>
                  <p className="text-xs text-slate-600 mt-2 max-w-sm leading-relaxed">
                    Check the execution status and error above. Pending payments must be resolved before continuing.
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
