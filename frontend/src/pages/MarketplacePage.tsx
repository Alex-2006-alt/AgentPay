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
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-white shadow-sm p-1.5 rounded-xl self-start">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 font-medium animate-pulse">Loading marketplace registry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service) => (
            <div
              key={service.id}
              className="bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div>
                {/* Top Badge & Category */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {service.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{service.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Service Name & Description */}
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {service.description}
                </p>

                {/* Technical Specs */}
                <div className="mt-5 pt-5 border-t border-slate-200/60 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Response Time</span>
                    <div className="font-mono font-bold text-slate-700 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{service.average_response_time} ms</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Success Rate</span>
                    <div className="font-mono font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{service.success_rate}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs">
                  <span className="text-slate-400 font-medium">Endpoint:</span>
                  <div className="font-mono text-slate-600 bg-slate-50 px-3 py-2 rounded-lg mt-1.5 border border-slate-200 text-[11px] truncate shadow-inner">
                    {service.endpoint}
                  </div>
                </div>
              </div>

              {/* Bottom Price & Call CTA */}
              <div className="mt-6 pt-5 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Price Per Call
                  </span>
                  <div className="text-lg font-bold font-mono text-indigo-600 mt-0.5">
                    ${service.price.toFixed(3)}{' '}
                    <span className="text-xs text-slate-400 font-sans font-medium">USDC</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
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
