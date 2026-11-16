'use client';

import React from 'react';
import { CardHeader } from './CardHeader';
import { CandidateToken } from '@/types';
import { formatTokenDisplay } from '@/lib/format';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface TemperatureCardProps {
  candidates: CandidateToken[];
  temperature: number;
}

export const TemperatureCard: React.FC<TemperatureCardProps> = ({
  candidates,
  temperature,
}) => {
  // Normalize raw probabilities across the candidate set for a fair visual comparison
  const rawSum = candidates.reduce((sum, c) => sum + c.rawProb, 0);

  const chartData = candidates.slice(0, 10).map((c) => {
    const { display } = formatTokenDisplay(c.token);
    // Relative raw probability normalized to the top 10/15
    const normalizedRaw = rawSum > 0 ? (c.rawProb / rawSum) * 100 : 0;
    const tempProbPct = c.tempProb * 100;

    return {
      name: display.length > 7 ? display.slice(0, 6) + '…' : display,
      rawToken: c.token,
      'Raw Prob (%)': Number(normalizedRaw.toFixed(1)),
      'Post-Temp Prob (%)': Number(tempProbPct.toFixed(1)),
    };
  });

  const getTemperatureDescription = () => {
    if (temperature <= 0.001) {
      return 'Greedy (T = 0): Top candidate receives 100% probability. All other candidates receive 0%. Deterministic output.';
    } else if (temperature < 0.7) {
      return `Sharpening (T = ${temperature.toFixed(2)}): Distribution is peaked. High probability candidates gain dominance, reducing diversity.`;
    } else if (temperature <= 1.1) {
      return `Balanced (T = ${temperature.toFixed(2)}): Natural model probabilities are preserved without distortion.`;
    } else {
      return `Flattening (T = ${temperature.toFixed(2)}): Distribution is softened. Probability differences shrink, allowing unlikely tokens a higher chance.`;
    }
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur shadow-md space-y-3">
      <CardHeader
        stepNumber={3}
        title="After Temperature: Probability Rescaling"
        subtitle={`Temperature T = ${temperature === 0 ? '0 (Greedy)' : temperature.toFixed(2)}`}
        explanation={{
          title: 'Softmax Temperature Rescaling',
          concept: 'Energy-based distribution scaling',
          formula: 'P_i^{(T)} = \\frac{e^{\\text{logit}_i / T}}{\\sum_j e^{\\text{logit}_j / T}}',
          details:
            'Dividing logits by temperature before softmax shifts the entropy of the probability distribution. Dividing by T < 1 exaggerates differences (cold, focused, greedy), whereas T > 1 dampens differences (hot, creative, uniform). At T = 0, it degenerates into a hard Argmax selection.',
        }}
      />

      {/* Temperature status pill */}
      <div className="p-2.5 rounded-lg bg-[#080d19] border border-gray-800 text-xs flex items-center justify-between text-gray-300">
        <span className="font-mono text-amber-400 font-semibold">Effect:</span>
        <span className="text-gray-300 text-right">{getTemperatureDescription()}</span>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
            />
            <YAxis
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#374151',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#f3f4f6',
              }}
              formatter={(value: any) => [`${value}%`]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Bar
              dataKey="Raw Prob (%)"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="Post-Temp Prob (%)"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
