'use client';

import React from 'react';
import { Sliders, Dices, Layers, Thermometer, ShieldAlert, Zap, Clock, Box } from 'lucide-react';
import { SamplingConfig } from '@/types';

interface SettingsPanelProps {
  config: SamplingConfig;
  onChange: (newConfig: Partial<SamplingConfig>) => void;
  availableModels: Array<{ name: string; installed: boolean; size?: number }>;
  disabled?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onChange,
  availableModels,
  disabled = false,
}) => {
  const randomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000);
    onChange({ seed: newSeed });
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur shadow-md space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sampling Hyperparameters</span>
        </h3>
        <span className="text-[11px] text-gray-500 font-mono">Client-side sampling</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Model Dropdown */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-gray-300 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-blue-400" />
              <span>Ollama Model</span>
            </span>
          </label>
          <select
            value={config.model}
            onChange={(e) => onChange({ model: e.target.value })}
            disabled={disabled}
            className="w-full bg-[#0a0f1d] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            {availableModels.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} {m.installed ? '✓ (installed)' : '(needs pull)'}
              </option>
            ))}
          </select>
        </div>

        {/* Temperature */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-gray-300 font-medium flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>Temperature</span>
            </label>
            <span className="font-mono px-2 py-0.5 rounded bg-gray-800 text-amber-300 font-bold">
              {config.temperature === 0 ? '0 (Greedy)' : config.temperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2.0"
            step="0.05"
            value={config.temperature}
            onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
            disabled={disabled}
            className="w-full accent-amber-500 bg-gray-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>0 (Deterministic)</span>
            <span>1.0 (Balanced)</span>
            <span>2.0 (Wild)</span>
          </div>
        </div>

        {/* Top-K */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-gray-300 font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Top-K Cutoff</span>
            </label>
            <span className="font-mono px-2 py-0.5 rounded bg-gray-800 text-blue-300 font-bold">
              {config.topK}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            step="1"
            value={config.topK}
            onChange={(e) => onChange({ topK: parseInt(e.target.value) })}
            disabled={disabled}
            className="w-full accent-blue-500 bg-gray-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>1 (Only top 1)</span>
            <span>8 (Medium)</span>
            <span>15 (Max)</span>
          </div>
        </div>

        {/* Top-P (Nucleus) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-gray-300 font-medium flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top-P (Nucleus)</span>
            </label>
            <span className="font-mono px-2 py-0.5 rounded bg-gray-800 text-emerald-300 font-bold">
              {(config.topP * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={config.topP}
            onChange={(e) => onChange({ topP: parseFloat(e.target.value) })}
            disabled={disabled}
            className="w-full accent-emerald-500 bg-gray-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>10% (Tight)</span>
            <span>90% (Standard)</span>
            <span>100% (No filter)</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-gray-300 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Max Tokens</span>
            </label>
            <span className="font-mono px-2 py-0.5 rounded bg-gray-800 text-purple-300 font-bold">
              {config.maxTokens}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={config.maxTokens}
            onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) })}
            disabled={disabled}
            className="w-full accent-purple-500 bg-gray-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>1 token</span>
            <span>25 tokens</span>
            <span>50 tokens</span>
          </div>
        </div>

        {/* Seed Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-gray-300 font-medium flex items-center gap-1">
              <Dices className="w-3.5 h-3.5 text-cyan-400" />
              <span>RNG Seed</span>
            </label>
            <button
              onClick={randomizeSeed}
              disabled={disabled}
              className="text-[10px] flex items-center gap-1 text-cyan-400 hover:text-cyan-200 transition disabled:opacity-50"
            >
              <Dices className="w-3 h-3" />
              <span>Roll</span>
            </button>
          </div>
          <input
            type="number"
            value={config.seed}
            onChange={(e) => onChange({ seed: parseInt(e.target.value) || 0 })}
            disabled={disabled}
            className="w-full bg-[#0a0f1d] border border-gray-800 rounded-lg px-3 py-1.5 font-mono text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Auto-play Speed */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-gray-300 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Step Delay</span>
            </label>
            <span className="font-mono px-2 py-0.5 rounded bg-gray-800 text-rose-300 font-bold">
              {config.autoPlaySpeed} ms
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={config.autoPlaySpeed}
            onChange={(e) => onChange({ autoPlaySpeed: parseInt(e.target.value) })}
            disabled={disabled}
            className="w-full accent-rose-500 bg-gray-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>100ms (Fast)</span>
            <span>1000ms</span>
            <span>2000ms (Slow)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
