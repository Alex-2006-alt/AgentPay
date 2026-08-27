import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Store,
  Star,
  Clock,
  CheckCircle2,
  Filter,
  Zap,
} from 'lucide-react';
import { agentPayApi } from '../services/api';

export const MarketplacePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', selectedCategory],
    queryFn: () =>
      agentPayApi.getServices(selectedCategory === 'all' ? undefined : selectedCategory),
  });

  const categories = ['all', 'Information', 'Language', 'Analysis'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Store className="w-6 h-6 text-cyan-400" />
            <span>Service Marketplace</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, inspect, and query paid micro-APIs registered for autonomous agent execution.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-1 rounded-xl self-start">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading marketplace registry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services?.map((service) => (
            <div
              key={service.id}
              className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-200 group shadow-lg shadow-black/20"
            >
              <div>
                {/* Top Badge & Category */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                    {service.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{service.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Service Name & Description */}
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {service.description}
                </p>

                {/* Technical Specs */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Response Time</span>
                    <div className="font-mono font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{service.average_response_time} ms</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Success Rate</span>
                    <div className="font-mono font-medium text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{service.success_rate}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs">
                  <span className="text-slate-400">Endpoint:</span>
                  <div className="font-mono text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-lg mt-1 border border-slate-800 text-[11px] truncate">
                    {service.endpoint}
                  </div>
                </div>
              </div>

              {/* Bottom Price & Call CTA */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Price Per Call
                  </span>
                  <div className="text-base font-bold font-mono text-emerald-400">
                    ${service.price.toFixed(3)}{' '}
                    <span className="text-xs text-slate-400 font-sans">{service.currency}</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                  <Zap className="w-3 h-3" />
                  <span>x402 Ready</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
