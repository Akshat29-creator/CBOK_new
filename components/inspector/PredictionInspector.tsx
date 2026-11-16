'use client';

import React from 'react';
import { StepResult, SamplingConfig } from '@/types';
import { StepMetricsBar } from './StepMetricsBar';
import { InputContextCard } from './InputContextCard';
import { ModelOutputCard } from './ModelOutputCard';
import { TemperatureCard } from './TemperatureCard';
import { TopKTopPCard } from './TopKTopPCard';
import { SamplingRulerCard } from './SamplingRulerCard';
import { FinalResultCard } from './FinalResultCard';
import { ChevronLeft, ChevronRight, Binary, Eye } from 'lucide-react';

interface PredictionInspectorProps {
  currentStep: StepResult | null;
  totalSteps: number;
  currentStepIndex: number;
  onNavigateStep: (index: number) => void;
  config: SamplingConfig;
  isGenerating: boolean;
}

export const PredictionInspector: React.FC<PredictionInspectorProps> = ({
  currentStep,
  totalSteps,
  currentStepIndex,
  onNavigateStep,
  config,
  isGenerating,
}) => {
  if (!currentStep) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-8 backdrop-blur flex flex-col items-center justify-center min-h-[500px] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Binary className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-base font-bold text-gray-200">
            Prediction Inspector
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Ready to inspect the internal token decision pipeline. Click{' '}
            <strong className="text-blue-400">Step</strong> or{' '}
            <strong className="text-blue-400">Generate</strong> to run the first token prediction.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-gray-900/80 border border-gray-800 backdrop-blur">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Prediction Inspector
          </span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>

        {/* Step Prev/Next Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onNavigateStep(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex <= 0 || isGenerating}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <button
            onClick={() => onNavigateStep(Math.min(totalSteps - 1, currentStepIndex + 1))}
            disabled={currentStepIndex >= totalSteps - 1 || isGenerating}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Extra Metrics Bar */}
      <StepMetricsBar step={currentStep} />

      {/* Pipeline Cards 1 - 6 */}
      <div className="space-y-4">
        {/* Card 1: Input Context */}
        <InputContextCard step={currentStep} />

        {/* Card 2: Model Output */}
        <ModelOutputCard
          candidates={currentStep.allCandidates}
          chosenToken={currentStep.chosenToken}
        />

        {/* Card 3: After Temperature */}
        <TemperatureCard
          candidates={currentStep.allCandidates}
          temperature={config.temperature}
        />

        {/* Card 4: After Top-K & Top-P */}
        <TopKTopPCard
          candidates={currentStep.allCandidates}
          topK={config.topK}
          topP={config.topP}
        />

        {/* Card 5: Sampling Probability Ruler */}
        <SamplingRulerCard
          ruler={currentStep.samplingRuler}
          sampledValue={currentStep.sampledValue}
          isGreedy={currentStep.isGreedy}
          seed={config.seed}
        />

        {/* Card 6: Final Result */}
        <FinalResultCard
          chosenToken={currentStep.chosenToken}
          rank={currentStep.rank}
          isSurprising={currentStep.isSurprising}
          evalDurationMs={currentStep.evalDurationMs}
          promptEvalCount={currentStep.promptEvalCount}
        />
      </div>
    </div>
  );
};
