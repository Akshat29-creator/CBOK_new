'use client';

import React from 'react';
import { CardHeader } from './CardHeader';
import { RulerSegment } from '@/types';
import { formatTokenDisplay } from '@/lib/format';
import { Dices, Target, ArrowDown } from 'lucide-react';

interface SamplingRulerCardProps {
  ruler: RulerSegment[];
  sampledValue: number;
  isGreedy: boolean;
  seed: number;
}

// Distinct pleasing color palette for ruler slices
const SLICE_COLORS = [
  'bg-blue-600 border-blue-400 text-white',
  'bg-emerald-600 border-emerald-400 text-white',
  'bg-amber-600 border-amber-400 text-white',
  'bg-purple-600 border-purple-400 text-white',
  'bg-rose-600 border-rose-400 text-white',
  'bg-cyan-600 border-cyan-400 text-white',
  'bg-indigo-600 border-indigo-400 text-white',
  'bg-teal-600 border-teal-400 text-white',
  'bg-pink-600 border-pink-400 text-white',
  'bg-orange-600 border-orange-400 text-white',
];

export const SamplingRulerCard: React.FC<SamplingRulerCardProps> = ({
  ruler,
  sampledValue,
  isGreedy,
  seed,
}) => {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur shadow-md space-y-4">
      <CardHeader
        stepNumber={5}
        title="Sampling: The Probability Ruler"
        subtitle="1D interval mapping & seeded pseudo-random draw"
        explanation={{
          title: 'Inverse Transform Sampling',
          concept: 'Categorical Sampling on [0, 1)',
          formula: 'i = \\min \\{ k : r \\le \\sum_{j=1}^k P_j \\}',
          details:
            'Renormalized candidate probabilities partition the continuous interval [0, 1) into contiguous segments proportional to each token’s probability. A uniform random float r ∈ [0, 1) is drawn using the deterministic seed. Whichever segment r falls inside becomes the selected token.',
        }}
      />

      {/* Sampling Metainfo */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#080d19] border border-gray-800 text-xs">
        <div className="flex items-center gap-2">
          <Dices className="w-4 h-4 text-cyan-400" />
          <span className="text-gray-400">RNG Seed:</span>
          <span className="font-mono font-bold text-cyan-300">{seed}</span>
        </div>

        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <span className="text-gray-400">Drawn Value (r):</span>
          <span className="font-mono font-bold text-amber-300">
            {isGreedy ? 'Greedy (0.0000)' : sampledValue.toFixed(4)}
          </span>
        </div>
      </div>

      {/* The Horizontal Ruler Visualizer */}
      <div className="relative pt-6 pb-2">
        {/* Needle Marker pointing to sampledValue */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-20 pointer-events-none"
          style={{ left: `${Math.min(99, Math.max(1, sampledValue * 100))}%` }}
        >
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-black shadow-md whitespace-nowrap">
            r = {isGreedy ? 'Greedy' : sampledValue.toFixed(4)}
          </span>
          <ArrowDown className="w-3.5 h-3.5 text-amber-400 fill-current -mt-0.5 animate-bounce" />
        </div>

        {/* Horizontal Ruler Bar */}
        <div className="w-full h-11 rounded-lg overflow-hidden flex border-2 border-gray-700 bg-gray-950 shadow-inner">
          {ruler.map((segment, idx) => {
            const { display } = formatTokenDisplay(segment.token);
            const widthPct = Math.max(0.5, (segment.end - segment.start) * 100);
            const colorClass = SLICE_COLORS[idx % SLICE_COLORS.length];

            return (
              <div
                key={`${segment.token}-${idx}`}
                style={{ width: `${widthPct}%` }}
                className={`relative h-full flex flex-col items-center justify-center transition-all duration-200 border-r border-black/40 group cursor-pointer ${colorClass} ${
                  segment.chosen
                    ? 'ring-2 ring-white z-10 brightness-110 shadow-lg'
                    : 'opacity-85 hover:opacity-100 hover:brightness-110'
                }`}
                title={`Token: "${segment.token}" | Interval: [${segment.start.toFixed(3)}, ${segment.end.toFixed(3)}] | Prob: ${(segment.prob * 100).toFixed(1)}%`}
              >
                {widthPct >= 6 && (
                  <span className="text-[10px] font-mono font-bold truncate max-w-full px-1">
                    {display}
                  </span>
                )}
                {widthPct >= 10 && (
                  <span className="text-[8px] font-mono opacity-80">
                    {(segment.prob * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Ruler Axis Labels */}
        <div className="flex justify-between text-[10px] font-mono text-gray-500 pt-1.5 px-0.5">
          <span>0.0</span>
          <span>0.25</span>
          <span>0.50</span>
          <span>0.75</span>
          <span>1.0</span>
        </div>
      </div>

      {/* Slices legend table */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Interval Slices Breakdown
        </span>
        <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
          {ruler.map((segment, idx) => {
            const { display } = formatTokenDisplay(segment.token);
            const colorClass = SLICE_COLORS[idx % SLICE_COLORS.length];

            return (
              <div
                key={idx}
                className={`p-1.5 rounded flex items-center justify-between transition ${
                  segment.chosen
                    ? 'bg-amber-950/40 border border-amber-500/40 text-amber-200 font-bold'
                    : 'bg-[#080d19] border border-gray-800 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-sm ${colorClass.split(' ')[0]}`}
                  />
                  <span>#{segment.rank}</span>
                  <span className="px-1 py-0.2 rounded bg-black/40 text-white">
                    {display}
                  </span>
                  {segment.chosen && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-bold">
                      SELECTED
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>
                    Range: [{segment.start.toFixed(3)} - {segment.end.toFixed(3)}]
                  </span>
                  <span className="text-white font-bold w-12 text-right">
                    {(segment.prob * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
