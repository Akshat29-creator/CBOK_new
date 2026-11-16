'use client';

import React from 'react';
import { Cpu, Download, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { GenerationRun } from '@/types';

interface HeaderProps {
  currentRun: GenerationRun | null;
  ollamaOnline: boolean;
  activeModel: string;
  onExport: () => void;
  onReset: () => void;
  isGenerating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRun,
  ollamaOnline,
  activeModel,
  onExport,
  onReset,
  isGenerating,
}) => {
  return (
    <header className="border-b border-gray-800 bg-[#0d1322]/80 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-blue-500/10">
            <div className="w-full h-full bg-[#0d1322] rounded-[11px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                LLM Next-Word Lab
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v1.0
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Interactive token prediction & sampling pipeline visualizer
            </p>
          </div>
        </div>

        {/* Status Badges & Global Actions */}
        <div className="flex items-center gap-3">
          {/* Ollama Connection Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              ollamaOnline
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                ollamaOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            {ollamaOnline ? (
              <span>Ollama Connected</span>
            ) : (
              <span>Ollama Offline (localhost:11434)</span>
            )}
          </div>

          {/* Model Tag */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 border border-gray-800 text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-gray-400">Model:</span>
            <span className="text-indigo-300 font-semibold">{activeModel}</span>
          </div>

          {/* Export JSON */}
          <button
            onClick={onExport}
            disabled={!currentRun || currentRun.steps.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition disabled:opacity-40 disabled:pointer-events-none"
            title="Export complete run data as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          {/* Reset Run */}
          <button
            onClick={onReset}
            disabled={isGenerating || !currentRun || currentRun.steps.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 transition disabled:opacity-40"
            title="Clear run history"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
