'use client';

import React from 'react';
import { CardHeader } from './CardHeader';
import { CandidateToken } from '@/types';
import { formatTokenDisplay, getProbabilityColor } from '@/lib/format';
import { Award, AlertOctagon, CheckCircle2, Clock, Zap, Cpu } from 'lucide-react';

interface FinalResultCardProps {
  chosenToken: CandidateToken;
  rank: number;
  isSurprising: boolean;
  evalDurationMs: number;
  promptEvalCount: number;
}

export const FinalResultCard: React.FC<FinalResultCardProps> = ({
  chosenToken,
  rank,
  isSurprising,
  evalDurationMs,
  promptEvalCount,
}) => {
  const { display } = formatTokenDisplay(chosenToken.token);
  const probColor = getProbabilityColor(chosenToken.finalProb);
  const isTopChoice = rank === 1;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur shadow-md space-y-4">
      <CardHeader
        stepNumber={6}
        title="Final Decision: Selected Next Token"
        subtitle="Sampled token appended to the sequence"
        explanation={{
          title: 'Autoregressive Append & Feed-forward',
          concept: 'Token State Transition',
          formula: 'W_{1:t} = [W_{1:t-1}, w_t]',
          details:
            'The winning candidate token is locked in and concatenated to the existing prompt context. In the next iteration, this expanded sequence becomes the new input context, continuing the generation loop until the stopping condition (e.g. max tokens or end-of-sequence) is met.',
        }}
      />

      {/* Main Chosen Token Callout */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${probColor.bg} ${probColor.border}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center font-mono text-2xl font-bold border border-white/10 text-white shadow-lg">
            {display}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-gray-300">
                Chosen Token
              </span>
              {isTopChoice ? (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  #1 Top Choice
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Award className="w-3 h-3" />
                  Rank #{rank} Candidate
                </span>
              )}
            </div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">
              &quot;{chosenToken.token}&quot;
            </div>
          </div>
        </div>

        {/* Surprise Factor Badge */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
          <span className="text-xs text-gray-400">Final Probability:</span>
          <span className="text-2xl font-mono font-bold text-white">
            {(chosenToken.finalProb * 100).toFixed(1)}%
          </span>
          {isSurprising && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
              <AlertOctagon className="w-3 h-3 text-rose-400" />
              Surprising Pick!
            </span>
          )}
        </div>
      </div>

      {/* Latency & Hardware Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-[#080d19] border border-gray-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Latency</div>
            <div className="font-bold text-gray-200">{evalDurationMs} ms</div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#080d19] border border-gray-800 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Context Tokens</div>
            <div className="font-bold text-gray-200">{promptEvalCount}</div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-[#080d19] border border-gray-800 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Raw Logprob</div>
            <div className="font-bold text-gray-200">{chosenToken.logprob.toFixed(3)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
