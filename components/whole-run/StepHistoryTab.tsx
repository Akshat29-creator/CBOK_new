'use client';

import React from 'react';
import { StepResult } from '@/types';
import { formatTokenDisplay, getProbabilityColor } from '@/lib/format';
import { CheckCircle2, AlertOctagon } from 'lucide-react';

interface StepHistoryTabProps {
  steps: StepResult[];
  selectedStepIndex: number | null;
  onSelectStep: (index: number) => void;
}

export const StepHistoryTab: React.FC<StepHistoryTabProps> = ({
  steps,
  selectedStepIndex,
  onSelectStep,
}) => {
  if (steps.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 text-xs">
        No steps generated yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#080d19]">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-gray-800/80 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
          <tr>
            <th className="py-2.5 px-3 w-16 text-center">Step</th>
            <th className="py-2.5 px-3">Chosen Token</th>
            <th className="py-2.5 px-3 text-right">Probability</th>
            <th className="py-2.5 px-3 text-center">Rank</th>
            <th className="py-2.5 px-3 text-right">Entropy</th>
            <th className="py-2.5 px-3 text-right">Perplexity</th>
            <th className="py-2.5 px-3 text-right">Latency</th>
            <th className="py-2.5 px-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-850">
          {steps.map((step) => {
            const isSelected = selectedStepIndex === step.stepIndex;
            const probColor = getProbabilityColor(step.chosenToken.finalProb);
            const { display } = formatTokenDisplay(step.chosenToken.token);

            return (
              <tr
                key={step.stepIndex}
                onClick={() => onSelectStep(step.stepIndex)}
                className={`cursor-pointer transition ${
                  isSelected
                    ? 'bg-blue-950/50 text-blue-200 font-bold border-l-4 border-l-blue-400'
                    : 'hover:bg-gray-800/50 text-gray-300'
                }`}
              >
                <td className="py-2.5 px-3 text-center text-gray-500 font-bold">
                  #{step.stepIndex + 1}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded border ${probColor.bg} ${probColor.text} ${probColor.border}`}
                  >
                    {display}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-gray-100">
                  {(step.chosenToken.finalProb * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      step.rank === 1
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    #{step.rank}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right text-purple-300">
                  {step.entropy} b
                </td>
                <td className="py-2.5 px-3 text-right text-blue-300">
                  {step.perplexity}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-400">
                  {step.evalDurationMs} ms
                </td>
                <td className="py-2.5 px-3 text-center">
                  {step.isSurprising ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      <AlertOctagon className="w-3 h-3 text-rose-400" />
                      Surprising
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Normal
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
