'use client';

import React from 'react';
import { AlertTriangle, Terminal, X, ExternalLink, HelpCircle } from 'lucide-react';

interface StatusBannerProps {
  error: { message: string; code?: string } | null;
  onDismiss: () => void;
  activeModel: string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  error,
  onDismiss,
  activeModel,
}) => {
  if (!error) return null;

  return (
    <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-rose-200 backdrop-blur shadow-lg shadow-rose-950/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-rose-300">
              {error.code === 'OLLAMA_OFFLINE' && 'Ollama Service Unreachable'}
              {error.code === 'MODEL_NOT_FOUND' && `Model Not Found: ${activeModel}`}
              {error.code === 'LOGPROBS_UNSUPPORTED' && 'Ollama Logprobs Not Supported'}
              {!['OLLAMA_OFFLINE', 'MODEL_NOT_FOUND', 'LOGPROBS_UNSUPPORTED'].includes(error.code || '') && 'Inference Error'}
            </div>
            <p className="text-rose-200/90 leading-relaxed">{error.message}</p>

            {/* Helpful command suggestion */}
            {error.code === 'MODEL_NOT_FOUND' && (
              <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-rose-500/20 font-mono text-xs text-rose-100">
                <Terminal className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Run command:</span>
                <code className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded select-all font-bold">
                  ollama pull {activeModel}
                </code>
              </div>
            )}

            {error.code === 'OLLAMA_OFFLINE' && (
              <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-rose-500/20 font-mono text-xs text-rose-100">
                <Terminal className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Start Ollama service:</span>
                <code className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded select-all font-bold">
                  ollama serve
                </code>
              </div>
            )}

            {error.code === 'LOGPROBS_UNSUPPORTED' && (
              <div className="flex items-center gap-2 text-xs text-rose-300">
                <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Logprobs require Ollama v0.4.0+. Please download the update from{' '}
                  <a
                    href="https://ollama.com/download"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-white inline-flex items-center gap-0.5"
                  >
                    ollama.com <ExternalLink className="w-3 h-3" />
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-200 p-1 rounded-lg hover:bg-rose-900/40 transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
