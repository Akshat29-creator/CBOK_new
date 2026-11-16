'use client';

import React from 'react';
import { CardHeader } from './CardHeader';
import { CandidateToken } from '@/types';
import { formatTokenDisplay } from '@/lib/format';
import { Table, BarChart2 } from 'lucide-react';

interface ModelOutputCardProps {
  candidates: CandidateToken[];
  chosenToken: CandidateToken;
}

export const ModelOutputCard: React.FC<ModelOutputCardProps> = ({
  candidates,
  chosenToken,
}) => {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur shadow-md space-y-3">
      <CardHeader
        stepNumber={2}
        title="Model Output: Logprobs & Raw Distribution"
        subtitle="Unsampled top 15 token candidates directly from Ollama"
        explanation={{
          title: 'Logits & Log-probabilities',
          concept: 'LogSoftmax',
          formula: '\\text{rawProb} = e^{\\text{logprob}}',
          details:
            'The LLM final layer outputs raw logits across the vocabulary. Taking LogSoftmax produces log-probabilities (logprobs = ln(P)). We convert logprob into a true percentage: P = e^(logprob). Because this table shows the top 15 out of 32,000+ tokens, the sum represents the cumulative density of the model’s top hypotheses.',
        }}
      />

      {/* Candidates Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#080d19]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-gray-800/80 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
            <tr>
              <th className="py-2 px-3 w-12 text-center">Rank</th>
              <th className="py-2 px-3">Candidate Token</th>
              <th className="py-2 px-3 text-right">Logprob (ln P)</th>
              <th className="py-2 px-3 text-right">Raw Prob %</th>
              <th className="py-2 px-3 w-36">Distribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-850">
            {candidates.slice(0, 15).map((candidate, idx) => {
              const { display, isSpecial } = formatTokenDisplay(candidate.token);
              const isSelected = candidate.token === chosenToken.token && candidate.rank === chosenToken.rank;
              const probPercent = candidate.rawProb * 100;

              return (
                <tr
                  key={`${candidate.token}-${idx}`}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-blue-950/40 text-blue-200 font-semibold'
                      : 'hover:bg-gray-800/40 text-gray-300'
                  }`}
                >
                  <td className="py-2 px-3 text-center text-gray-500 font-bold">
                    #{candidate.rank}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? 'bg-blue-900/60 text-blue-200 border-blue-400'
                          : isSpecial
                          ? 'bg-gray-800/70 text-gray-300 border-gray-700'
                          : 'bg-black/30 text-gray-100 border-gray-800'
                      }`}
                    >
                      {display}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-gray-400 font-mono">
                    {candidate.logprob.toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-gray-200">
                    {probPercent >= 0.1 ? `${probPercent.toFixed(2)}%` : '<0.1%'}
                  </td>
                  <td className="py-2 px-3">
                    <div className="w-full bg-gray-800/70 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isSelected ? 'bg-blue-400' : 'bg-indigo-500/80'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(1, probPercent))}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
