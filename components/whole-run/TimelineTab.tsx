'use client';

import React from 'react';
import { StepResult } from '@/types';
import { formatTokenDisplay } from '@/lib/format';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface TimelineTabProps {
  steps: StepResult[];
  onSelectStep: (index: number) => void;
  selectedStepIndex: number | null;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  steps,
  onSelectStep,
  selectedStepIndex,
}) => {
  if (steps.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 text-xs">
        No generation steps recorded yet. Generate some tokens to see the timeline.
      </div>
    );
  }

  const data = steps.map((s) => {
    const { display } = formatTokenDisplay(s.chosenToken.token);
    return {
      step: `#${s.stepIndex + 1}`,
      stepIndex: s.stepIndex,
      token: display,
      'Confidence (%)': s.confidence,
      'Entropy (bits)': s.entropy,
      'Perplexity': s.perplexity,
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Timeline of confidence (%) and entropy (bits) across all generated tokens</span>
        <span className="font-mono text-blue-400">Total Steps: {steps.length}</span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const clickedIdx = state.activePayload[0].payload.stepIndex;
                onSelectStep(clickedIdx);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="token"
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              angle={-20}
              textAnchor="end"
            />
            {/* Left Y Axis for Confidence % */}
            <YAxis
              yAxisId="left"
              stroke="#10b981"
              fontSize={11}
              domain={[0, 100]}
              unit="%"
            />
            {/* Right Y Axis for Entropy (bits) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#a855f7"
              fontSize={11}
              domain={[0, 'auto']}
              unit=" b"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#374151',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#f3f4f6',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="Confidence (%)"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4, fill: '#10b981' }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Entropy (bits)"
              stroke="#a855f7"
              strokeWidth={2}
              dot={{ r: 4, fill: '#a855f7' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-gray-500 text-center">
        Tip: Click any point on the chart to jump the inspector directly to that token step.
      </div>
    </div>
  );
};
