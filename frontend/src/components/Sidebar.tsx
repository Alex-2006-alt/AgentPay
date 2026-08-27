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
    <aside className="w-64 bg-[#111827]/80 backdrop-blur-md border-r border-slate-800/80 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-white bg-clip-text text-transparent">
            AgentPay
          </h1>
          <p className="text-[11px] font-medium text-slate-400">Autonomous Settlement</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
          Platform
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Network Status Card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">Arbitrum Sepolia</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
              EVM L2
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Chain ID: <span className="font-mono text-slate-300">421614</span>
          </p>
          <a
            href="https://sepolia.arbiscan.io"
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 flex items-center justify-between text-[11px] text-emerald-400 hover:text-emerald-300 font-medium group"
          >
            <span>Block Explorer</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </aside>
  );
};
