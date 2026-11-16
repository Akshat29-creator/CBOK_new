'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface CardHeaderProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  explanation: {
    title: string;
    concept: string;
    formula?: string;
    details: string;
  };
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  stepNumber,
  title,
  subtitle,
  explanation,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="space-y-2 pb-3 border-b border-gray-800">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
            {stepNumber}
          </span>
          <div>
            <h4 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              {title}
            </h4>
            <p className="text-[11px] text-gray-400">{subtitle}</p>
          </div>
        </div>

        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
            showExplanation
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
              : 'bg-gray-800/80 hover:bg-gray-700/80 border-gray-700 text-gray-300'
          }`}
          title="Explain this mathematical step"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>Explain</span>
          {showExplanation ? (
            <ChevronUp className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-gray-400" />
          )}
        </button>
      </div>

      {/* Educational Explanation Box */}
      {showExplanation && (
        <div className="rounded-lg bg-[#070b14] border border-blue-500/30 p-3 text-xs text-gray-300 space-y-2 shadow-inner animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-blue-300 font-semibold text-xs border-b border-blue-900/40 pb-1">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Concept: {explanation.title}</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
              {explanation.concept}
            </span>
          </div>
          <p className="text-gray-300 leading-relaxed text-[11px]">
            {explanation.details}
          </p>
          {explanation.formula && (
            <div className="p-2 rounded bg-black/60 border border-gray-800 font-mono text-[11px] text-indigo-300 overflow-x-auto">
              <code>{explanation.formula}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
