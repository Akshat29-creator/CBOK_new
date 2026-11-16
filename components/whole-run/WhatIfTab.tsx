'use client';

import React, { useState } from 'react';
import { StepResult, CandidateToken } from '@/types';
import { formatTokenDisplay } from '@/lib/format';
import { GitBranch, Play, RefreshCw, ArrowRight } from 'lucide-react';

interface WhatIfTabProps {
  originalSteps: StepResult[];
  branchedPrompt: string | null;
  branchedTokens: string[];
  branchStepOrigin: { stepIndex: number; token: string } | null;
  onStartBranch: (stepIndex: number, candidate: CandidateToken) => void;
  onStepBranch: () => void;
  onClearBranch: () => void;
  isBranchGenerating: boolean;
}

export const WhatIfTab: React.FC<WhatIfTabProps> = ({
  originalSteps,
  branchedPrompt,
  branchedTokens,
  branchStepOrigin,
  onStartBranch,
  onStepBranch,
  onClearBranch,
  isBranchGenerating,
}) => {
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0);

  if (originalSteps.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 text-xs">
        Generate some tokens first before exploring &quot;What if?&quot; counterfactual branches.
      </div>
    );
  }

  const activeStep = originalSteps[Math.min(selectedStepIdx, originalSteps.length - 1)];

  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-800">
        <div>
          <h4 className="font-bold text-gray-200 flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-indigo-400" />
            <span>Counterfactual &quot;What if?&quot; Branching</span>
          </h4>
          <p className="text-[11px] text-gray-400">
            Pick any alternative token candidate from any previous step and explore how the generation diverges!
          </p>
        </div>

        {branchStepOrigin && (
          <button
            onClick={onClearBranch}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs border border-gray-700 transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Clear Branch</span>
          </button>
        )}
      </div>

      {/* Step Selector for branching */}
      <div className="p-3 rounded-lg bg-[#080d19] border border-gray-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-gray-300 font-semibold text-xs">
            1. Select past step to branch from:
          </span>
          <div className="flex flex-wrap gap-1">
            {originalSteps.map((s) => (
              <button
                key={s.stepIndex}
                onClick={() => setSelectedStepIdx(s.stepIndex)}
                className={`px-2 py-0.5 rounded font-mono text-xs transition ${
                  selectedStepIdx === s.stepIndex
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                #{s.stepIndex + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate choice buttons at selected step */}
        {activeStep && (
          <div className="space-y-2 pt-1 border-t border-gray-800/80">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>
                Original pick at step #{activeStep.stepIndex + 1} was{' '}
                <strong className="text-emerald-400">&quot;{activeStep.chosenToken.token}&quot;</strong>. Pick an alternative candidate:
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 font-mono">
              {activeStep.allCandidates.slice(0, 10).map((cand) => {
                const { display } = formatTokenDisplay(cand.token);
                const isOriginalChosen = cand.token === activeStep.chosenToken.token;

                return (
                  <button
                    key={`${cand.token}-${cand.rank}`}
                    onClick={() => onStartBranch(activeStep.stepIndex, cand)}
                    className={`p-2 rounded border text-left transition flex flex-col justify-between ${
                      isOriginalChosen
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:brightness-125'
                        : 'bg-gray-900/80 hover:bg-indigo-950/60 border-gray-800 hover:border-indigo-500/50 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>#{cand.rank}</span>
                      <span className="font-bold text-indigo-300">
                        {(cand.rawProb * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs mt-1 truncate">
                      {display}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Side-by-side Comparison Panel */}
      {branchStepOrigin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Original Sequence */}
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-800">
              <span className="font-bold text-emerald-400 text-xs">Original Continuation</span>
              <span className="text-[10px] font-mono text-gray-500">
                {originalSteps.length} tokens
              </span>
            </div>
            <div className="font-mono text-xs leading-relaxed text-gray-300 p-2.5 rounded bg-[#080d19] border border-gray-800 min-h-[100px]">
              <span className="text-gray-500">{originalSteps[0]?.inputPrompt}</span>
              {originalSteps.map((s, idx) => (
                <span
                  key={idx}
                  className={`mx-0.5 px-1 py-0.2 rounded ${
                    idx === branchStepOrigin.stepIndex
                      ? 'bg-emerald-900/80 text-emerald-200 font-bold'
                      : 'text-gray-200'
                  }`}
                >
                  {s.chosenToken.token}
                </span>
              ))}
            </div>
          </div>

          {/* Branched Sequence */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-indigo-900/50">
              <span className="font-bold text-indigo-300 text-xs">
                Branched at Step #{branchStepOrigin.stepIndex + 1} with &quot;{branchStepOrigin.token}&quot;
              </span>
              <button
                onClick={onStepBranch}
                disabled={isBranchGenerating}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow transition disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isBranchGenerating ? 'Generating...' : 'Step Branch'}</span>
              </button>
            </div>
            <div className="font-mono text-xs leading-relaxed text-indigo-100 p-2.5 rounded bg-[#080d19] border border-indigo-900/50 min-h-[100px]">
              <span className="text-gray-500">{branchedPrompt}</span>
              <span className="mx-0.5 px-1 py-0.2 rounded bg-indigo-600 text-white font-bold">
                {branchStepOrigin.token}
              </span>
              {branchedTokens.map((tok, idx) => (
                <span key={idx} className="mx-0.5 px-1 py-0.2 rounded bg-indigo-950 text-indigo-200 border border-indigo-800">
                  {tok}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
