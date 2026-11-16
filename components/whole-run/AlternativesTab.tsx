'use client';

import React from 'react';
import { StepResult } from '@/types';
import { formatTokenDisplay } from '@/lib/format';
import { GitCommit, ArrowRight } from 'lucide-react';

interface AlternativesTabProps {
  steps: StepResult[];
  onSelectStep: (index: number) => void;
  onBranch: (stepIndex: number, candidateIndex: number) => void;
}

export const AlternativesTab: React.FC<AlternativesTabProps> = ({
  steps,
  onSelectStep,
  onBranch,
}) => {
  if (steps.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 text-xs">
        No generation steps recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Comparison of the chosen token vs. the 2nd and 3rd most likely alternatives for each step:</span>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const chosenDisplay = formatTokenDisplay(step.chosenToken.token).display;
          const candidates = step.allCandidates;
          const runnerUp1 = candidates[1];
          const runnerUp2 = candidates[2];

          return (
            <div
              key={step.stepIndex}
              className="p-3 rounded-lg bg-[#080d19] border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              {/* Step info & Chosen Token */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelectStep(step.stepIndex)}
                  className="font-mono text-gray-400 hover:text-blue-400 font-bold underline"
                >
                  Step #{step.stepIndex + 1}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-[11px]">Selected:</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    {chosenDisplay}
                  </span>
                  <span className="font-mono text-gray-400 text-[11px]">
                    ({(step.chosenToken.finalProb * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Runners up */}
              <div className="flex flex-wrap items-center gap-3 font-mono">
                {/* 2nd place */}
                {runnerUp1 && (
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-gray-900 border border-gray-800">
                    <span className="text-[10px] text-gray-500 font-bold">#2</span>
                    <span className="text-gray-200 font-semibold">
                      {formatTokenDisplay(runnerUp1.token).display}
                    </span>
                    <span className="text-amber-400 text-[11px]">
                      {(runnerUp1.rawProb * 100).toFixed(1)}%
                    </span>
                    <button
                      onClick={() => onBranch(step.stepIndex, 1)}
                      className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white transition flex items-center gap-0.5"
                      title="Branch sequence using this candidate"
                    >
                      <GitCommit className="w-2.5 h-2.5" />
                      Branch
                    </button>
                  </div>
                )}

                {/* 3rd place */}
                {runnerUp2 && (
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-gray-900 border border-gray-800">
                    <span className="text-[10px] text-gray-500 font-bold">#3</span>
                    <span className="text-gray-200 font-semibold">
                      {formatTokenDisplay(runnerUp2.token).display}
                    </span>
                    <span className="text-indigo-400 text-[11px]">
                      {(runnerUp2.rawProb * 100).toFixed(1)}%
                    </span>
                    <button
                      onClick={() => onBranch(step.stepIndex, 2)}
                      className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white transition flex items-center gap-0.5"
                      title="Branch sequence using this candidate"
                    >
                      <GitCommit className="w-2.5 h-2.5" />
                      Branch
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
