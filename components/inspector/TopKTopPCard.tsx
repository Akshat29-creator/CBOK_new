'use client';

import React from 'react';
import { CardHeader } from './CardHeader';
import { CandidateToken } from '@/types';
import { formatTokenDisplay } from '@/lib/format';
import { Check, X, Filter } from 'lucide-react';

interface TopKTopPCardProps {
  candidates: CandidateToken[];
  topK: number;
  topP: number;
}

export const TopKTopPCard: React.FC<TopKTopPCardProps> = ({
  candidates,
  topK,
  topP,
}) => {
  const keptTokens = candidates.filter((c) => c.kept);
  const cutoffTokens = candidates.filter((c) => !c.kept);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur shadow-md space-y-4">
      <CardHeader
        stepNumber={4}
        title="After Top-K & Top-P (Nucleus) Filtering"
        subtitle={`Filters: Top-K = ${topK} | Top-P = ${(topP * 100).toFixed(0)}%`}
        explanation={{
          title: 'Truncation Strategies: Top-K & Nucleus (Top-P)',
          concept: 'Vocabulary Pruning',
          formula: '\\sum_{i=1}^{k^*} P_i \\ge p',
          details:
            'Top-K sets a hard limit on the candidate count, eliminating the long tail. Top-P dynamically adjusts the candidate pool size by accumulating probabilities until the threshold p is reached. This keeps high-probability choices when certain, and expands to more candidates when uncertain.',
        }}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between">
          <span className="text-gray-400">Tokens Retained:</span>
          <span className="font-mono font-bold text-emerald-300">
            {keptTokens.length} / {candidates.length}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20 flex items-center justify-between">
          <span className="text-gray-400">Tokens Discarded:</span>
          <span className="font-mono font-bold text-rose-300">
            {cutoffTokens.length}
          </span>
        </div>
      </div>

      {/* Candidate Badges Grid */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>Candidate Tokens Cutoff Inspection</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {candidates.slice(0, 15).map((candidate) => {
            const { display } = formatTokenDisplay(candidate.token);
            const isKept = candidate.kept;
            const cumPct = (candidate.cumulativeProb * 100).toFixed(1);
            const probPct = (candidate.tempProb * 100).toFixed(1);

            return (
              <div
                key={`${candidate.token}-${candidate.rank}`}
                className={`p-2 rounded-lg border text-xs flex flex-col justify-between transition ${
                  isKept
                    ? 'bg-[#0b1220] border-emerald-500/40 text-gray-100 shadow-sm'
                    : 'bg-[#080b12]/50 border-gray-800 text-gray-500 line-through opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-gray-400 font-bold">
                      #{candidate.rank}
                    </span>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs ${
                        isKept
                          ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                          : 'bg-gray-800/60 text-gray-400'
                      }`}
                    >
                      {display}
                    </span>
                  </div>

                  {isKept ? (
                    <span className="flex items-center gap-0.5 text-[10px] font-mono text-emerald-400">
                      <Check className="w-3 h-3" />
                      <span>Kept</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[10px] font-mono text-rose-400 px-1 py-0.2 rounded bg-rose-950/60 border border-rose-800/40 not-line-through">
                      <X className="w-3 h-3" />
                      <span>{candidate.cutoffReason === 'top-k' ? 'Top-K Cut' : 'Top-P Cut'}</span>
                    </span>
                  )}
                </div>

                {/* Probability & Cumulative Progress */}
                <div className="text-[10px] font-mono flex items-center justify-between text-gray-400 not-line-through mt-1 pt-1 border-t border-gray-800/60">
                  <span>Prob: <strong className={isKept ? 'text-gray-200' : 'text-gray-500'}>{probPct}%</strong></span>
                  <span>Cumulative: <strong className={isKept ? 'text-blue-300' : 'text-gray-500'}>{cumPct}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cumulative Probability Line / Threshold */}
      <div className="space-y-1 pt-1">
        <div className="flex justify-between text-[11px] font-mono text-gray-400">
          <span>Cumulative Kept Probability</span>
          <span className="text-blue-400 font-bold">
            {((keptTokens.reduce((s, c) => s + c.tempProb, 0)) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, (keptTokens.reduce((s, c) => s + c.tempProb, 0)) * 100)}%`,
            }}
          />
          {/* Top-P marker line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
            style={{ left: `${topP * 100}%` }}
            title={`Top-P Threshold: ${(topP * 100).toFixed(0)}%`}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>0%</span>
          <span className="text-amber-400 font-mono">▲ Top-P Cutoff ({(topP * 100).toFixed(0)}%)</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
