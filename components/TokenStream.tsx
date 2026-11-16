'use client';

import React, { useState } from 'react';
import { StepResult } from '@/types';
import { formatTokenDisplay, getProbabilityColor } from '@/lib/format';
import {
  Info,
  AlignLeft,
  Eye,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  AlertCircle,
  GitCompare,
  Wand2,
  HelpCircle,
} from 'lucide-react';

interface TokenStreamProps {
  initialPrompt: string;
  steps: StepResult[];
  selectedStepIndex: number | null;
  onSelectStep: (stepIndex: number) => void;
  isGenerating: boolean;
  greedySentence: string | null;
  onRequestGreedy: () => void;
  isLoadingGreedy: boolean;
  onApplyGreedyMode: () => void;
}

type StreamViewMode = 'badges' | 'heatmap' | 'comparison';

export const TokenStream: React.FC<TokenStreamProps> = ({
  initialPrompt,
  steps,
  selectedStepIndex,
  onSelectStep,
  isGenerating,
  greedySentence,
  onRequestGreedy,
  isLoadingGreedy,
  onApplyGreedyMode,
}) => {
  const [viewMode, setViewMode] = useState<StreamViewMode>('badges');
  const [hoveredStepIndex, setHoveredStepIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Reconstructed full sampled sentence
  const fullSampledText = initialPrompt + steps.map((s) => s.chosenToken.token).join('');

  // Active step (defaults to selected step or latest step)
  const activeStep =
    selectedStepIndex !== null && steps[selectedStepIndex]
      ? steps[selectedStepIndex]
      : steps.length > 0
      ? steps[steps.length - 1]
      : null;

  // Most relevant token at the active step (#1 rank candidate)
  const topCandidateAtActiveStep = activeStep?.allCandidates?.[0] || null;
  const didDivergeAtActiveStep =
    activeStep && topCandidateAtActiveStep
      ? activeStep.chosenToken.token !== topCandidateAtActiveStep.token
      : false;

  // Stream Analytics
  const avgConfidence =
    steps.length > 0
      ? (steps.reduce((sum, s) => sum + s.chosenToken.finalProb, 0) / steps.length) * 100
      : 0;

  const highestConfStep =
    steps.length > 0
      ? [...steps].sort((a, b) => b.chosenToken.finalProb - a.chosenToken.finalProb)[0]
      : null;

  const lowestConfStep =
    steps.length > 0
      ? [...steps].sort((a, b) => a.chosenToken.finalProb - b.chosenToken.finalProb)[0]
      : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSampledText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur shadow-md space-y-4">
      {/* 1. Header, View Mode Switcher & Copy */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Output Stream
          </h3>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-gray-800 ml-2">
            <button
              onClick={() => setViewMode('badges')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                viewMode === 'badges'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Individual token chips with probability colors"
            >
              <Eye className="w-3 h-3" />
              <span>Tokens</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                viewMode === 'heatmap'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Natural flowing prose with probability highlight heatmap"
            >
              <AlignLeft className="w-3 h-3" />
              <span>Heatmap</span>
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                viewMode === 'comparison'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Compare sampled stream vs the most relevant (greedy) sentence"
            >
              <GitCompare className="w-3 h-3" />
              <span>Compare</span>
            </button>
          </div>
        </div>

        {/* Copy Button & Legend */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            disabled={steps.length === 0}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition disabled:opacity-40"
            title="Copy full output text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Most Relevant Word Spotlight (Active Step) */}
      {activeStep && topCandidateAtActiveStep && (
        <div className="p-3 rounded-lg bg-[#070c18] border border-blue-500/25 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Most Relevant Word at Step #{activeStep.stepIndex + 1}</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              Model Rank #1 Choice
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {/* Top Choice */}
            <div className="p-2 rounded bg-black/40 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-400">#1 Top Predicted Word:</div>
                <div className="font-bold text-emerald-300 text-sm">
                  &ldquo;{topCandidateAtActiveStep.token}&rdquo;
                </div>
              </div>
              <div className="text-right">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {(topCandidateAtActiveStep.rawProb * 100).toFixed(1)}% raw prob
                </span>
              </div>
            </div>

            {/* Actually Chosen */}
            <div
              className={`p-2 rounded border flex items-center justify-between ${
                didDivergeAtActiveStep
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              }`}
            >
              <div>
                <div className="text-[10px] text-gray-400">Actually Sampled:</div>
                <div className="font-bold text-sm">
                  &ldquo;{activeStep.chosenToken.token}&rdquo;
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    didDivergeAtActiveStep
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  Rank #{activeStep.rank} ({(activeStep.chosenToken.finalProb * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {didDivergeAtActiveStep && (
            <p className="text-[11px] text-amber-300/90 font-sans leading-tight">
              Due to temperature ($T &gt; 0$), the sampler picked Rank #{activeStep.rank} instead of the model’s top choice.
            </p>
          )}
        </div>
      )}

      {/* 3. Output Views */}
      {viewMode === 'badges' && (
        /* Token Badges View */
        <div className="min-h-[160px] max-h-[360px] overflow-y-auto p-4 rounded-lg bg-[#080d19] border border-gray-800/80 font-mono text-sm leading-relaxed select-text">
          <span className="text-gray-400 font-sans tracking-wide mr-1">
            {initialPrompt}
          </span>

          {steps.map((step) => {
            const isSelected = selectedStepIndex === step.stepIndex;
            const isHovered = hoveredStepIndex === step.stepIndex;
            const prob = step.chosenToken.finalProb;
            const color = getProbabilityColor(prob);
            const { display } = formatTokenDisplay(step.chosenToken.token);

            return (
              <span key={step.stepIndex} className="relative inline-block my-0.5 group">
                <button
                  onClick={() => onSelectStep(step.stepIndex)}
                  onMouseEnter={() => setHoveredStepIndex(step.stepIndex)}
                  onMouseLeave={() => setHoveredStepIndex(null)}
                  className={`mx-0.5 px-1.5 py-0.5 rounded text-xs transition-all font-mono whitespace-pre border ${color.bg} ${color.text} ${color.border} ${
                    isSelected
                      ? 'ring-2 ring-blue-400 shadow-md scale-105 z-20 font-bold border-blue-400'
                      : 'hover:brightness-125 hover:scale-105'
                  }`}
                  title={`Step #${step.stepIndex + 1}: "${step.chosenToken.token}" (${(prob * 100).toFixed(1)}%)`}
                >
                  {step.chosenToken.token}
                </button>

                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 rounded-lg bg-gray-900 border border-gray-700 shadow-xl z-50 text-[11px] pointer-events-none font-sans text-gray-200">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-800 mb-1.5">
                      <span className="font-bold text-gray-100">Step #{step.stepIndex + 1}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${color.text}`}>
                        {color.label} ({(prob * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Chosen Token:</span>
                        <span className="font-bold text-white bg-black/40 px-1 rounded">{display}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rank:</span>
                        <span className="text-blue-300 font-bold">#{step.rank} of {step.allCandidates.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Most Relevant (#1):</span>
                        <span className="text-emerald-400 font-bold">
                          &ldquo;{step.allCandidates[0]?.token}&rdquo; ({(step.allCandidates[0]?.rawProb * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Entropy:</span>
                        <span className="text-purple-300">{step.entropy} bits</span>
                      </div>
                    </div>
                  </div>
                )}
              </span>
            );
          })}

          {isGenerating && (
            <span className="inline-flex items-center ml-1 align-middle text-blue-400 animate-pulse font-mono text-sm">
              ▋
            </span>
          )}

          {steps.length === 0 && !isGenerating && (
            <span className="text-gray-600 italic font-sans text-xs ml-2">
              (Press Generate or Step to start predicting next tokens)
            </span>
          )}
        </div>
      )}

      {viewMode === 'heatmap' && (
        /* Heatmap Flowing Prose View */
        <div className="min-h-[160px] max-h-[360px] overflow-y-auto p-4 rounded-lg bg-[#080d19] border border-gray-800/80 font-sans text-sm leading-relaxed select-text space-y-2">
          <div className="leading-7">
            <span className="text-gray-400 font-medium mr-1">{initialPrompt}</span>
            {steps.map((step) => {
              const prob = step.chosenToken.finalProb;
              const isSelected = selectedStepIndex === step.stepIndex;
              // Soft background highlight
              const bgClass =
                prob >= 0.7
                  ? 'bg-emerald-500/20 text-emerald-200 border-b border-emerald-500/40'
                  : prob >= 0.3
                  ? 'bg-amber-500/20 text-amber-200 border-b border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-200 border-b border-rose-500/40';

              return (
                <span
                  key={step.stepIndex}
                  onClick={() => onSelectStep(step.stepIndex)}
                  className={`cursor-pointer whitespace-pre rounded px-0.5 transition ${bgClass} ${
                    isSelected ? 'ring-2 ring-blue-400 font-semibold' : 'hover:brightness-125'
                  }`}
                  title={`Step #${step.stepIndex + 1}: ${step.chosenToken.token} (${(prob * 100).toFixed(1)}%)`}
                >
                  {step.chosenToken.token}
                </span>
              );
            })}
            {isGenerating && (
              <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse align-middle" />
            )}
          </div>
        </div>
      )}

      {viewMode === 'comparison' && (
        /* Comparison View: Sampled vs Greedy Most Likely */
        <div className="min-h-[160px] p-4 rounded-lg bg-[#080d19] border border-gray-800/80 space-y-3 font-mono text-xs">
          {/* Sampled Run */}
          <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800 space-y-1.5">
            <div className="flex items-center justify-between text-gray-400 text-[11px]">
              <span className="font-bold text-amber-300">Your Sampled Sentence:</span>
              <span>{steps.length} tokens</span>
            </div>
            <p className="text-gray-200 leading-relaxed font-sans text-sm">
              <span className="text-gray-500">{initialPrompt}</span>
              <span className="font-semibold text-white">
                {steps.map((s) => s.chosenToken.token).join('')}
              </span>
            </p>
          </div>

          {/* Greedy Most Relevant Sentence */}
          <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 text-[11px] flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Most Likely (Greedy / Argmax) Sentence:</span>
              </span>
              {!greedySentence && (
                <button
                  onClick={onRequestGreedy}
                  disabled={isLoadingGreedy}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition shadow flex items-center gap-1 disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isLoadingGreedy ? 'Predicting...' : 'Predict Sentence'}</span>
                </button>
              )}
            </div>

            {greedySentence ? (
              <p className="text-indigo-100 leading-relaxed font-sans text-sm p-2 rounded bg-black/40 border border-indigo-900/50">
                &ldquo;{greedySentence}&rdquo;
              </p>
            ) : (
              <p className="text-gray-500 text-[11px] italic">
                Click &ldquo;Predict Sentence&rdquo; to compute the exact optimal continuation that the model considers most relevant.
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-gray-400">
                Want 100% most relevant text?
              </span>
              <button
                onClick={onApplyGreedyMode}
                className="text-[11px] text-indigo-300 hover:text-white underline font-sans"
              >
                Set Temperature = 0 (Greedy)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Stream Metrics Strip */}
      {steps.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-gray-800/80 text-[11px] font-mono">
          <div className="p-2 rounded bg-[#080d19] border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase">Avg Confidence</div>
            <div
              className={`font-bold ${
                avgConfidence >= 70
                  ? 'text-emerald-400'
                  : avgConfidence >= 30
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {avgConfidence.toFixed(1)}%
            </div>
          </div>

          <div className="p-2 rounded bg-[#080d19] border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase">Generated Tokens</div>
            <div className="font-bold text-gray-200">{steps.length} tokens</div>
          </div>

          <div className="p-2 rounded bg-[#080d19] border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase">Most Confident Word</div>
            <div className="font-bold text-emerald-300 truncate">
              {highestConfStep
                ? `"${highestConfStep.chosenToken.token}" (${(highestConfStep.chosenToken.finalProb * 100).toFixed(0)}%)`
                : '-'}
            </div>
          </div>

          <div className="p-2 rounded bg-[#080d19] border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase">Lowest / Surprising</div>
            <div className="font-bold text-rose-300 truncate">
              {lowestConfStep
                ? `"${lowestConfStep.chosenToken.token}" (${(lowestConfStep.chosenToken.finalProb * 100).toFixed(0)}%)`
                : '-'}
            </div>
          </div>
        </div>
      )}

      {/* Footer advice */}
      <div className="text-[11px] text-gray-400 flex items-center justify-between">
        <span>Click any token badge to inspect its exact pipeline stage on the right.</span>
        {steps.length > 0 && selectedStepIndex !== null && (
          <span className="text-blue-400 font-mono">
            Viewing Step #{selectedStepIndex + 1}
          </span>
        )}
      </div>
    </div>
  );
};
