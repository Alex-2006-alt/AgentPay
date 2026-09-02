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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Store className="w-6 h-6 text-indigo-600" />
            <span>Service Marketplace</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Browse, inspect, and query paid micro-APIs registered for autonomous agent execution.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 bg-white/45 backdrop-blur-md border border-white/40 shadow-sm p-1.5 rounded-xl self-start">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-indigo-100/60 text-indigo-700 shadow-sm border border-indigo-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-500 font-medium animate-pulse">Loading marketplace registry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service) => (
            <div
              key={service.id}
              className="bg-white/45 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-900/5 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/65 hover:border-indigo-300/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
            >
              <div>
                {/* Top Badge & Category */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/60 text-slate-700 border border-slate-300/50">
                    {service.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-amber-100/50 px-2 py-1 rounded-md border border-amber-200/40">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{service.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Service Name & Description */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {service.description}
                </p>

                {/* Technical Specs */}
                <div className="mt-5 pt-5 border-t border-slate-300/40 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Response Time</span>
                    <div className="font-mono font-bold text-slate-700 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{service.average_response_time} ms</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Success Rate</span>
                    <div className="font-mono font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{service.success_rate}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs">
                  <span className="text-slate-500 font-medium">Endpoint:</span>
                  <div className="font-mono text-slate-700 bg-white/50 px-3 py-2 rounded-lg mt-1.5 border border-slate-300/50 text-[11px] truncate shadow-inner">
                    {service.endpoint}
                  </div>
                </div>
              </div>

              {/* Bottom Price & Call CTA */}
              <div className="mt-6 pt-5 border-t border-slate-300/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Price Per Call
                  </span>
                  <div className="text-lg font-bold font-mono text-indigo-700 mt-0.5">
                    ${service.price.toFixed(3)}{' '}
                    <span className="text-xs text-slate-500 font-sans font-medium">USDC</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-100/50 text-indigo-700 font-bold text-xs border border-indigo-200/40 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Agent Ready</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
