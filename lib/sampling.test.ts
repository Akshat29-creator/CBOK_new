import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  logprobsToRawProbabilities,
  applyTemperatureAndSoftmax,
  applyTopKAndTopP,
  renormalizeProbabilities,
  sampleFromCandidates,
  calculateEntropy,
  calculatePerplexity,
  executeSamplingPipeline,
} from './sampling';
import { RawCandidate, SamplingConfig } from '@/types';

describe('Sampling Module Unit Tests', () => {
  const mockCandidates: RawCandidate[] = [
    { token: ' Paris', logprob: -0.5 },    // prob ≈ 0.606
    { token: ' Rome', logprob: -1.2 },     // prob ≈ 0.301
    { token: ' London', logprob: -2.5 },   // prob ≈ 0.082
    { token: ' Berlin', logprob: -4.0 },   // prob ≈ 0.018
    { token: ' Madrid', logprob: -6.0 },   // prob ≈ 0.002
  ];

  it('createSeededRandom: same seed produces identical deterministic random sequence', () => {
    const rng1 = createSeededRandom(42);
    const rng2 = createSeededRandom(42);

    const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

    expect(seq1).toEqual(seq2);
    expect(seq1[0]).toBeGreaterThanOrEqual(0);
    expect(seq1[0]).toBeLessThan(1);

    // Different seed produces different sequence
    const rng3 = createSeededRandom(999);
    const seq3 = [rng3(), rng3(), rng3()];
    expect(seq3).not.toEqual(seq1.slice(0, 3));
  });

  it('logprobsToRawProbabilities: sorts descending and computes raw probabilities', () => {
    const raw = logprobsToRawProbabilities(mockCandidates);
    expect(raw).toHaveLength(5);
    expect(raw[0].token).toBe(' Paris');
    expect(raw[0].rank).toBe(1);
    expect(raw[0].rawProb).toBeCloseTo(Math.exp(-0.5), 4);
    expect(raw[1].rank).toBe(2);
    expect(raw[1].rawProb).toBeLessThan(raw[0].rawProb);
  });

  it('applyTemperatureAndSoftmax: temperature=0 (greedy) assigns 1.0 to top candidate and 0 to others', () => {
    const raw = logprobsToRawProbabilities(mockCandidates);
    const withTemp = applyTemperatureAndSoftmax(raw, 0);

    expect(withTemp[0].tempProb).toBe(1.0);
    expect(withTemp[1].tempProb).toBe(0.0);
    expect(withTemp[2].tempProb).toBe(0.0);
  });

  it('applyTemperatureAndSoftmax: softmax probabilities sum to 1.0 for temperature > 0', () => {
    const raw = logprobsToRawProbabilities(mockCandidates);
    const withTemp = applyTemperatureAndSoftmax(raw, 1.0);

    const sum = withTemp.reduce((acc, c) => acc + c.tempProb, 0);
    expect(sum).toBeCloseTo(1.0, 5);

    // Higher temperature flattens the distribution (ratio of top to second decreases)
    const withHighTemp = applyTemperatureAndSoftmax(raw, 2.0);
    const ratioT1 = withTemp[0].tempProb / withTemp[1].tempProb;
    const ratioT2 = withHighTemp[0].tempProb / withHighTemp[1].tempProb;
    expect(ratioT2).toBeLessThan(ratioT1);
  });

  it('applyTopKAndTopP: Top-K cuts off candidates beyond K', () => {
    const raw = logprobsToRawProbabilities(mockCandidates);
    const withTemp = applyTemperatureAndSoftmax(raw, 1.0);
    const filtered = applyTopKAndTopP(withTemp, 2, 1.0);

    expect(filtered[0].kept).toBe(true);
    expect(filtered[1].kept).toBe(true);
    expect(filtered[2].kept).toBe(false);
    expect(filtered[2].cutoffReason).toBe('top-k');
    expect(filtered[3].kept).toBe(false);
    expect(filtered[3].cutoffReason).toBe('top-k');
  });

  it('applyTopKAndTopP: Top-P (nucleus) cuts off when cumulative threshold is reached', () => {
    const raw = logprobsToRawProbabilities(mockCandidates);
    const withTemp = applyTemperatureAndSoftmax(raw, 1.0);
    // If top candidate has prob > 0.5, topP=0.5 will keep rank 1 and cut off subsequent
    const filtered = applyTopKAndTopP(withTemp, 10, 0.5);

    expect(filtered[0].kept).toBe(true);
    // At least 1 token is always kept
    expect(filtered.filter((c) => c.kept).length).toBeGreaterThanOrEqual(1);
  });

  it('renormalizeProbabilities: kept tokens sum to exactly 1.0', () => {
    const raw = logprobsToRawProbabilities(mockCandidates);
    const withTemp = applyTemperatureAndSoftmax(raw, 1.0);
    const filtered = applyTopKAndTopP(withTemp, 3, 0.95);
    const renormalized = renormalizeProbabilities(filtered);

    const kept = renormalized.filter((c) => c.kept);
    const discarded = renormalized.filter((c) => !c.kept);

    const sumKept = kept.reduce((acc, c) => acc + c.finalProb, 0);
    expect(sumKept).toBeCloseTo(1.0, 5);

    for (const d of discarded) {
      expect(d.finalProb).toBe(0);
    }
  });

  it('sampleFromCandidates: constructs ruler and samples deterministically', () => {
    const raw = logprobsToRawProbabilities(mockCandidates);
    const withTemp = applyTemperatureAndSoftmax(raw, 1.0);
    const filtered = applyTopKAndTopP(withTemp, 5, 1.0);
    const renormalized = renormalizeProbabilities(filtered);

    // If randomValue is very small (0.01), it lands in rank 1
    const resLow = sampleFromCandidates(renormalized, 0.01, false);
    expect(resLow.chosenToken.token).toBe(' Paris');
    expect(resLow.samplingRuler.length).toBe(5);
    expect(resLow.samplingRuler[0].chosen).toBe(true);
    expect(resLow.samplingRuler[0].start).toBe(0);
    expect(resLow.samplingRuler[resLow.samplingRuler.length - 1].end).toBe(1.0);

    // Greedy mode always selects rank 1
    const resGreedy = sampleFromCandidates(renormalized, 0.99, true);
    expect(resGreedy.chosenToken.token).toBe(' Paris');
  });

  it('calculateEntropy: returns 0 bits for certain distribution and > 0 for uncertain', () => {
    expect(calculateEntropy([1.0, 0, 0])).toBe(0);
    // Two equal choices: -2 * (0.5 * log2(0.5)) = 1 bit
    expect(calculateEntropy([0.5, 0.5])).toBeCloseTo(1.0, 3);
  });

  it('calculatePerplexity: computes correct running perplexity', () => {
    // If every step has probability 1.0, perplexity is 1.0
    expect(calculatePerplexity([1.0, 1.0, 1.0])).toBe(1.0);
    // If every step has probability 0.5, perplexity is 2.0
    expect(calculatePerplexity([0.5, 0.5])).toBeCloseTo(2.0, 1);
  });

  it('executeSamplingPipeline: end-to-end pipeline produces complete step result', () => {
    const config: SamplingConfig = {
      temperature: 0.7,
      topK: 4,
      topP: 0.9,
      seed: 12345,
      maxTokens: 10,
      model: 'qwen2.5:0.5b',
      autoPlaySpeed: 500,
    };

    const step = executeSamplingPipeline(
      mockCandidates,
      config,
      0.15,
      'The capital of France is',
      0,
      []
    );

    expect(step.stepIndex).toBe(0);
    expect(step.chosenToken).toBeDefined();
    expect(step.allCandidates.length).toBe(5);
    expect(step.samplingRuler.length).toBeGreaterThan(0);
    expect(step.entropy).toBeGreaterThan(0);
    expect(step.confidence).toBeGreaterThan(0);
    expect(step.perplexity).toBeGreaterThanOrEqual(1.0);
  });
});
