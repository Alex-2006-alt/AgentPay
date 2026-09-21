import { Fragment, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { agentPayApi, selectAgent, setApiToken } from '../services/api';
import type { Agent } from '../types';

export function AccessGate({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState('');
  useEffect(() => {
    const showError = (event: Event) => setError((event as CustomEvent<string>).detail);
    window.addEventListener('agentpay-api-error', showError);
    return () => window.removeEventListener('agentpay-api-error', showError);
  }, []);
  if (name) return <>
    <div className="flex justify-between gap-4 bg-slate-900 px-8 py-2 text-sm text-white">
      <span>{name} · {mode === 'simulation' ? 'Simulation: demo balances and synthetic provider data' : 'Live payments: confirmation required'}</span>
      <select aria-label="Active agent" className="bg-slate-800 text-white" value={selectedId} onChange={event => {
        onLogout(); selectAgent(event.target.value); setSelectedId(event.target.value);
        setName(agents.find(agent => agent.id === event.target.value)?.name ?? 'Agent');
      }}>{agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select>
      <button onClick={() => { onLogout(); setApiToken(''); setName(''); }}>Sign out</button>
    </div>
    {error && <div role="alert" className="flex justify-between bg-red-50 px-8 py-3 text-red-800"><span>{error}</span><button onClick={() => setError('')}>Dismiss</button></div>}
    <Fragment key={selectedId}>{children}</Fragment>
  </>;
  return <main className="min-h-screen grid place-items-center bg-slate-100 p-6">
    <form className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow" onSubmit={async event => {
      event.preventDefault(); setPending(true); setError(''); setApiToken(token);
      try {
        const agents = await agentPayApi.getAgents();
        if (!agents.length) throw new Error('No agent belongs to this credential. Ask the operator to provision one.');
        const health = await agentPayApi.getHealth();
        setAgents(agents); setSelectedId(agents[0].id);
        selectAgent(agents[0].id); setMode(health.payment_mode); setName(agents[0].name); setToken('');
      } catch (failure) {
        setApiToken('');
        setError(failure instanceof Error ? failure.message : 'Unable to sign in');
      } finally { setPending(false); }
    }}>
      <h1 className="text-2xl font-bold">AgentPay</h1>
      <p>Enter the API credential provided by your operator. It is held in memory until you sign out or close this page.</p>
      <label className="block">API credential
        <input className="mt-2 w-full rounded border p-3" type="password" autoComplete="off" required value={token} onChange={e => setToken(e.target.value)} />
      </label>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50" disabled={pending}>{pending ? 'Connecting…' : 'Connect'}</button>
    </form>
  </main>;
}
