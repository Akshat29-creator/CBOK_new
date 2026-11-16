'use client';

import React from 'react';
import { StepResult } from '@/types';
import { Activity, Gauge, HelpCircle, Flame, Clock } from 'lucide-react';

interface StepMetricsBarProps {
  step: StepResult;
}

export const StepMetricsBar: React.FC<StepMetricsBarProps> = ({ step }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {/* Entropy */}
      <div className="p-3 rounded-xl bg-gray-900/80 border border-purple-500/30 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-gray-400 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            Entropy
          </span>
          <span className="text-[10px] text-purple-300 font-mono">bits</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-purple-300">
            {step.entropy}
          </span>
          <span className="text-[10px] text-gray-500">
            {step.entropy < 0.5 ? 'Certain' : step.entropy < 2.0 ? 'Moderate' : 'High Uncertainty'}
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div className="p-3 rounded-xl bg-gray-900/80 border border-emerald-500/30 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-gray-400 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            Confidence
          </span>
          <span className="text-[10px] text-emerald-300 font-mono">max(P)</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-emerald-300">
            {step.confidence}%
          </span>
          <span className="text-[10px] text-gray-500">
            Top choice share
          </span>
        </div>
      </div>

      {/* Perplexity */}
      <div className="p-3 rounded-xl bg-gray-900/80 border border-blue-500/30 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-gray-400 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <Flame className="w-3.5 h-3.5 text-blue-400" />
            Perplexity (PPL)
          </span>
          <span className="text-[10px] text-blue-300 font-mono">running</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-blue-300">
            {step.perplexity}
          </span>
          <span className="text-[10px] text-gray-500">
            Lower is better
          </span>
        </div>
      </div>

      {/* Latency */}
      <div className="p-3 rounded-xl bg-gray-900/80 border border-amber-500/30 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-gray-400 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Step Latency
          </span>
          <span className="text-[10px] text-amber-300 font-mono">ms</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-amber-300">
            {step.evalDurationMs}
          </span>
          <span className="text-[10px] text-gray-500">
            Inference speed
          </span>
        </div>
      </div>
    </div>
  );
};
