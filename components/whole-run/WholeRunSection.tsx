'use client';

import React, { useState } from 'react';
import { StepResult, CandidateToken } from '@/types';
import { TimelineTab } from './TimelineTab';
import { StepHistoryTab } from './StepHistoryTab';
import { AlternativesTab } from './AlternativesTab';
import { WhatIfTab } from './WhatIfTab';
import { LineChart, ListOrdered, Shuffle, GitBranch, Layers } from 'lucide-react';

interface WholeRunSectionProps {
  steps: StepResult[];
  selectedStepIndex: number | null;
  onSelectStep: (index: number) => void;
  branchedPrompt: string | null;
  branchedTokens: string[];
  branchStepOrigin: { stepIndex: number; token: string } | null;
  onStartBranch: (stepIndex: number, candidate: CandidateToken) => void;
  onStepBranch: () => void;
  onClearBranch: () => void;
  isBranchGenerating: boolean;
}

type TabType = 'timeline' | 'history' | 'alternatives' | 'whatif';

export const WholeRunSection: React.FC<WholeRunSectionProps> = ({
  steps,
  selectedStepIndex,
  onSelectStep,
  branchedPrompt,
  branchedTokens,
  branchStepOrigin,
  onStartBranch,
  onStepBranch,
  onClearBranch,
  isBranchGenerating,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('timeline');

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-6 backdrop-blur shadow-md space-y-4">
      {/* Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
            Whole Run Diagnostics & Exploration
          </h3>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-[#080d19] p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'timeline'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Step History</span>
          </button>

          <button
            onClick={() => setActiveTab('alternatives')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'alternatives'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Alternatives</span>
          </button>

          <button
            onClick={() => setActiveTab('whatif')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'whatif'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>What If?</span>
            {branchStepOrigin && (
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'timeline' && (
          <TimelineTab
            steps={steps}
            onSelectStep={onSelectStep}
            selectedStepIndex={selectedStepIndex}
          />
        )}

        {activeTab === 'history' && (
          <StepHistoryTab
            steps={steps}
            selectedStepIndex={selectedStepIndex}
            onSelectStep={onSelectStep}
          />
        )}

        {activeTab === 'alternatives' && (
          <AlternativesTab
            steps={steps}
            onSelectStep={onSelectStep}
            onBranch={(stepIdx, candIdx) => {
              const candidate = steps[stepIdx].allCandidates[candIdx];
              if (candidate) {
                onStartBranch(stepIdx, candidate);
                setActiveTab('whatif');
              }
            }}
          />
        )}

        {activeTab === 'whatif' && (
          <WhatIfTab
            originalSteps={steps}
            branchedPrompt={branchedPrompt}
            branchedTokens={branchedTokens}
            branchStepOrigin={branchStepOrigin}
            onStartBranch={onStartBranch}
            onStepBranch={onStepBranch}
            onClearBranch={onClearBranch}
            isBranchGenerating={isBranchGenerating}
          />
        )}
      </div>
    </div>
  );
};
