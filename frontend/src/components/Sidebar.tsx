import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Store,
  Wallet,
  ArrowLeftRight,
  ShieldCheck,
  Cpu,
  ExternalLink,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agent Console', href: '/agent', icon: Bot, badge: 'Live AI' },
  { name: 'Marketplace', href: '/marketplace', icon: Store },
  { name: 'Wallet Manager', href: '/wallet', icon: Wallet },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Security & Policies', href: '/policies', icon: ShieldCheck },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white/45 backdrop-blur-xl border-r border-white/40 flex flex-col h-screen sticky top-0 shadow-sm shadow-slate-900/5">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/40 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-slate-900">
            AgentPay
          </h1>
          <p className="text-[11px] font-medium text-slate-500">Autonomous Settlement</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-3 mb-2">
          Platform
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-white/70 text-indigo-700 shadow-sm border border-white/60 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100/70 text-indigo-700 border border-indigo-200/50 rounded">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Network Status Card */}
      <div className="p-4 border-t border-white/40">
        <div className="bg-white/45 backdrop-blur-sm border border-white/50 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-800">Arbitrum Sepolia</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200/80 text-slate-600 font-bold rounded">
              EVM L2
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Chain ID: <span className="font-mono text-slate-700 font-medium">421614</span>
          </p>
          <a
            href="https://sepolia.arbiscan.io"
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 flex items-center justify-between text-[11px] text-indigo-700 hover:text-indigo-900 font-bold group"
          >
            <span>Block Explorer</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </aside>
  );
};
