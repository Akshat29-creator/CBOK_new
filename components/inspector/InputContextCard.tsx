'use client';

import React from 'react';
import { CardHeader } from './CardHeader';
import { StepResult } from '@/types';
import { Hash, Sparkles } from 'lucide-react';

interface InputContextCardProps {
  step: StepResult;
}

export const InputContextCard: React.FC<InputContextCardProps> = ({ step }) => {
  // Break prompt into words/tokens approximation for highlighting the tail
  const fullText = step.inputPrompt;
  // Get last ~20 characters or last few words for focus
  const words = fullText.split(/(\s+)/).filter(Boolean);
  const tailCount = Math.min(5, Math.max(2, Math.floor(words.length / 3)));
  const prefixWords = words.slice(0, words.length - tailCount);
  const tailWords = words.slice(words.length - tailCount);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur shadow-md space-y-3">
      <CardHeader
        stepNumber={1}
        title="Input Context"
        subtitle="Prompt fed into the LLM attention layers"
        explanation={{
          title: 'Context Window & Attention',
          concept: 'Autoregressive Conditioning',
          formula: 'P(w_t | w_1, w_2, ..., w_{t-1})',
          details:
            'Autoregressive language models predict the next token given all preceding tokens. The transformer self-attention mechanism computes attention weights across the entire context, with recent tokens usually receiving the highest focus when generating the immediate next word.',
        }}
      />

      <div className="rounded-lg bg-[#080d19] border border-gray-800 p-3 font-mono text-xs leading-relaxed overflow-x-auto select-text">
        <span className="text-gray-400">{prefixWords.join('')}</span>
        <span className="bg-blue-950/70 text-blue-300 font-semibold px-1 py-0.5 rounded border border-blue-500/30">
          {tailWords.join('')}
        </span>
        <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse align-middle" />
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>Active context length:</span>
          <span className="text-gray-200 font-mono font-bold">
            {step.inputPrompt.length} chars
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Last tokens heavily attend to the immediate target</span>
        </div>
      </div>
    </div>
  );
};
