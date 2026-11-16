'use client';

import React from 'react';
import { Play, StepForward, Pause, RotateCcw, Sparkles, AlertCircle } from 'lucide-react';

interface PromptControlProps {
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
  onGenerate: () => void;
  onStep: () => void;
  onPause: () => void;
  onReset: () => void;
  isGenerating: boolean;
  stepCount: number;
  maxTokens: number;
  disabled?: boolean;
}

const PRESETS = [
  'The capital of France is',
  'Once upon a time',
  '2 + 2 =',
  'def fibonacci(n):',
];

export const PromptControl: React.FC<PromptControlProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  onStep,
  onPause,
  onReset,
  isGenerating,
  stepCount,
  maxTokens,
  disabled = false,
}) => {
  const hasTrailingSpace = prompt.length > 0 && prompt.endsWith(' ');

  const trimTrailingSpace = () => {
    onPromptChange(prompt.trimEnd());
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur shadow-md space-y-4">
      {/* Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Input Prompt</span>
        </label>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-gray-500 mr-1 hidden sm:inline">Presets:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => onPromptChange(preset)}
              disabled={isGenerating}
              className="text-xs px-2.5 py-1 rounded-md bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white border border-gray-700/50 transition truncate max-w-[140px] font-mono disabled:opacity-40"
              title={preset}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={isGenerating || stepCount > 0}
          rows={3}
          placeholder="Enter prompt to predict next token..."
          className="w-full bg-[#0a0f1d] border border-gray-800 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 font-mono transition resize-y disabled:opacity-75 disabled:cursor-not-allowed"
        />
        {stepCount > 0 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
            Locked during run (Reset to edit)
          </div>
        )}
      </div>

      {/* Trailing Space Tokenizer Alert */}
      {hasTrailingSpace && stepCount === 0 && (
        <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px]">
              <strong>Trailing space detected:</strong> In BPE tokenizers, words start with a space (e.g. <code className="text-white bg-black/40 px-1 rounded">&quot; Delhi&quot;</code>). A trailing space blocks word tokens and forces the model to pick digits (<code className="text-white bg-black/40 px-1 rounded">&quot;1&quot;</code>, <code className="text-white bg-black/40 px-1 rounded">&quot;0&quot;</code>) or symbols!
            </span>
          </div>
          <button
            onClick={trimTrailingSpace}
            className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-mono font-bold whitespace-nowrap transition"
          >
            Trim Space
          </button>
        </div>
      )}

      {/* Control Buttons & Progress */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Generate / Pause Button */}
          {isGenerating ? (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 transition active:scale-[0.98]"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onGenerate}
              disabled={disabled || !prompt.trim() || stepCount >= maxTokens}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{stepCount === 0 ? 'Generate' : 'Resume'}</span>
            </button>
          )}

          {/* Step Button */}
          <button
            onClick={onStep}
            disabled={disabled || isGenerating || !prompt.trim() || stepCount >= maxTokens}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 shadow-sm transition disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]"
            title="Predict and sample a single next token"
          >
            <StepForward className="w-4 h-4 text-blue-400" />
            <span>Step</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={onReset}
            disabled={disabled || isGenerating || stepCount === 0}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition disabled:opacity-30 disabled:pointer-events-none"
            title="Reset prompt & token stream"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Progress count */}
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-[#0a0f1d] px-3 py-1.5 rounded-lg border border-gray-800">
          <span>Tokens:</span>
          <span className={`font-bold ${stepCount >= maxTokens ? 'text-amber-400' : 'text-blue-400'}`}>
            {stepCount}
          </span>
          <span className="text-gray-600">/</span>
          <span>{maxTokens}</span>
        </div>
      </div>
    </div>
  );
};
