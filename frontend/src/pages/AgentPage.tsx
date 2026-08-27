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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-emerald-400" />
          <span>Agent Execution Console</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Issue autonomous objectives to the AI agent. Watch task decomposition, price discovery, policy guardrail validation, and blockchain settlement in real time.
        </p>
      </div>

      {/* Quick Demo Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Demo Presets:</span>
        <button
          onClick={() => setSampleTask('Translate this document into Hindi and summarize it.')}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Demo 1: Translate & Summarize ($0.015)</span>
        </button>
        <button
          onClick={() => setSampleTask('Fetch current weather data for Tokyo.')}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
        >
          <Coins className="w-3.5 h-3.5 text-cyan-400" />
          <span>Demo 2: Weather API ($0.001)</span>
        </button>
        <button
          onClick={() => setSampleTask('Pay $5.00 to unapproved external service')}
          className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/60 text-xs font-medium text-red-300 hover:bg-red-900/40 transition-colors flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>Demo 3: Attack Simulation (Blocked by Policy)</span>
        </button>
      </div>

      {/* Task Input Box */}
      <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="E.g., Translate this document into Hindi and summarize it..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 font-sans resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Deterministic Policy Engine Active (Max Tx: $0.10, Daily: $2.00)</span>
            </div>

            <button
              type="submit"
              disabled={taskMutation.isPending || !taskInput.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold text-sm hover:opacity-95 transition-opacity disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {taskMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Processing Workflow...</span>
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
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              lastResponse.status === 'completed'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {lastResponse.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <div className="font-semibold text-sm">
                  {lastResponse.status === 'completed'
                    ? 'Goal Accomplished Successfully'
                    : 'Transaction Blocked by Guardrail'}
                </div>
                <div className="text-xs opacity-90">
                  {lastResponse.status === 'completed'
                    ? `Settled on EVM Testnet for $${lastResponse.total_cost.toFixed(4)} USDC`
                    : lastResponse.error}
                </div>
              </div>
            </div>

            <div className="text-right font-mono text-xs font-semibold">
              Status: <span className="uppercase">{lastResponse.status}</span>
            </div>
          </div>

          {/* Reasoning & Execution Pipeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step-by-Step Reasoning Flow */}
            <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Autonomous Execution Timeline</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {lastResponse.steps.map((step) => (
                  <div key={step.step_number} className="relative">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step.status === 'completed'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40'
                          : step.status === 'failed'
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {step.step_number}
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-200">{step.title}</span>
                        {step.cost !== undefined && (
                          <span className="text-[11px] font-mono font-bold text-emerald-400">
                            ${step.cost.toFixed(3)} USDC
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{step.description}</p>
                      {step.tx_hash && (
                        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                          <span>Tx: {step.tx_hash.slice(0, 16)}...</span>
                          <a
                            href={`https://sepolia.arbiscan.io/tx/${step.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:underline text-slate-300"
                          >
                            <span>Explorer</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Synthesized Output Box */}
            <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6 flex flex-col">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Agent Final Output</span>
              </h3>

              {lastResponse.final_output ? (
                <div className="flex-1 bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 text-sm text-slate-200 space-y-4 whitespace-pre-wrap leading-relaxed">
                  {lastResponse.final_output}
                </div>
              ) : (
                <div className="flex-1 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <ShieldAlert className="w-10 h-10 text-red-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-200">Execution Aborted by Policy</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
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
