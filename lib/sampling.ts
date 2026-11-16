import { CandidateToken, RawCandidate, RulerSegment, SamplingConfig, StepResult } from '@/types';

/**
 * Creates a deterministic pseudo-random number generator (Mulberry32).
 * Mulberry32 is a 32-bit state generator with 2^32 period, uniform output in [0, 1).
 * Passing the same seed guarantees the exact same sequence of random numbers.
 * 
 * @param seed - Any integer seed
 * @returns A function returning pseudo-random float in [0, 1)
 */
export function createSeededRandom(seed: number): () => number {
  let s = (seed >>> 0);
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * STEP 4.a: Logprobs -> Raw Probabilities
 * 
 * Language models output logits, which become log-probabilities ln(P) via LogSoftmax.
 * Ollama provides natural log probabilities (logprob = ln(P)).
 * We exponentiate each logprob: P = e^(logprob).
 * 
 * @param rawCandidates - Candidate tokens with logprob from Ollama
 * @returns Candidates with computed raw probability
 */
export function logprobsToRawProbabilities(
  rawCandidates: RawCandidate[]
): Omit<CandidateToken, 'tempProb' | 'kept' | 'cutoffReason' | 'filteredProb' | 'finalProb' | 'cumulativeProb'>[] {
  // Sort descending by logprob to guarantee rank order
  const sorted = [...rawCandidates].sort((a, b) => b.logprob - a.logprob);

  return sorted.map((item, index) => {
    // raw probability = e^(logprob)
    // Clamp minimum probability to 0 to prevent negative underflow
    const rawProb = Math.max(0, Math.exp(item.logprob));
    return {
      token: item.token,
      logprob: item.logprob,
      rawProb,
      rank: index + 1,
      bytes: item.bytes,
    };
  });
}

/**
 * STEP 4.b: Apply Temperature & Softmax
 * 
 * Temperature (T) controls the randomness / flatness of the candidate distribution.
 * 
 * Formula:
 *   adjusted_logit_i = logprob_i / T
 *   tempProb_i = exp(adjusted_logit_i - max_adjusted_logit) / sum_j(exp(adjusted_logit_j - max_adjusted_logit))
 * 
 * Edge cases:
 * - T = 0 (Greedy): The top candidate (rank 1) receives probability 1.0, all others 0.0.
 * - T < 1.0: "Sharpening" - High probability tokens become even more dominant; cold/conservative.
 * - T = 1.0: Standard softmax over candidates.
 * - T > 1.0: "Flattening" - Differences between tokens are compressed; creative/random.
 * 
 * @param candidates - Candidates with raw probabilities
 * @param temperature - Temperature value [0.0, 2.0]
 * @returns Candidates with tempProb populated
 */
export function applyTemperatureAndSoftmax(
  candidates: Array<{ token: string; logprob: number; rawProb: number; rank: number; bytes?: number[] }>,
  temperature: number
): Array<{ token: string; logprob: number; rawProb: number; rank: number; tempProb: number; bytes?: number[] }> {
  if (candidates.length === 0) return [];

  // Greedy special case: T = 0
  if (temperature <= 0.001) {
    return candidates.map((c, i) => ({
      ...c,
      tempProb: i === 0 ? 1.0 : 0.0,
    }));
  }

  // Divide logprob by temperature
  const scaledScores = candidates.map((c) => c.logprob / temperature);
  
  // Numerical stability trick: subtract max score to prevent exp() overflow
  const maxScore = Math.max(...scaledScores);
  const expScores = scaledScores.map((s) => Math.exp(s - maxScore));
  const sumExp = expScores.reduce((sum, val) => sum + val, 0);

  return candidates.map((c, i) => ({
    ...c,
    tempProb: sumExp > 0 ? expScores[i] / sumExp : (i === 0 ? 1 : 0),
  }));
}

/**
 * STEP 4.d & 4.e: Apply Top-K and Top-P (Nucleus) Filters
 * 
 * Top-K filtering:
 *   Keeps only the top K candidate tokens by temperature-adjusted probability.
 *   Tokens beyond rank K are discarded.
 * 
 * Top-P (Nucleus) filtering:
 *   Keeps the smallest subset of candidate tokens whose cumulative probability
 *   meets or exceeds threshold P.
 *   Guarantees at least 1 token is always kept.
 * 
 * @param candidates - Candidates with tempProb
 * @param topK - Maximum number of tokens to keep (1 to 15)
 * @param topP - Cumulative probability threshold (0.1 to 1.0)
 * @returns Candidates with kept flag, cutoffReason, and cumulativeProb
 */
export function applyTopKAndTopP(
  candidates: Array<{ token: string; logprob: number; rawProb: number; rank: number; tempProb: number; bytes?: number[] }>,
  topK: number,
  topP: number
): Array<CandidateToken> {
  // Sort descending by tempProb to compute cumulative distribution
  const sorted = [...candidates].sort((a, b) => b.tempProb - a.tempProb);

  let cumulative = 0;
  let pCutoffReached = false;

  return sorted.map((candidate, idx) => {
    const rank = idx + 1;
    let kept = true;
    let cutoffReason: 'top-k' | 'top-p' | null = null;

    // Check Top-K cutoff
    if (rank > topK) {
      kept = false;
      cutoffReason = 'top-k';
    } 
    // Check Top-P cutoff (if still kept after Top-K)
    else if (pCutoffReached) {
      kept = false;
      cutoffReason = 'top-p';
    }

    // Accumulate probability
    cumulative += candidate.tempProb;

    // If cumulative probability has now reached or exceeded Top-P,
    // subsequent tokens will be cut off by top-p.
    // (Note: rank 1 is ALWAYS kept regardless of top-p).
    if (cumulative >= topP && rank >= 1) {
      pCutoffReached = true;
    }

    return {
      ...candidate,
      rank,
      kept,
      cutoffReason,
      filteredProb: kept ? candidate.tempProb : 0,
      finalProb: 0, // populated in renormalize step
      cumulativeProb: Math.min(1.0, cumulative),
    };
  });
}

/**
 * STEP 4.f: Renormalize Filtered Probabilities
 * 
 * After discarding candidates via Top-K and Top-P, the sum of probabilities of the
 * remaining tokens is less than 1.0.
 * We divide each kept candidate's probability by the sum of kept probabilities so they sum to exactly 1.0.
 * 
 * @param candidates - Candidates with kept and filteredProb
 * @returns Fully processed CandidateToken[] with finalProb summing to 1.0
 */
export function renormalizeProbabilities(candidates: CandidateToken[]): CandidateToken[] {
  const keptTokens = candidates.filter((c) => c.kept);
  const sumKept = keptTokens.reduce((sum, c) => sum + c.filteredProb, 0);

  return candidates.map((c) => {
    if (!c.kept || sumKept <= 0) {
      return {
        ...c,
        finalProb: 0,
      };
    }
    return {
      ...c,
      finalProb: c.filteredProb / sumKept,
    };
  });
}

/**
 * STEP 4.g: Sample One Token Using a Random Number & Construct Probability Ruler
 * 
 * Builds a 1-dimensional "Probability Ruler" spanning [0.0, 1.0].
 * Each kept token occupies a continuous slice proportional to its finalProb.
 * 
 * If isGreedy:
 *   Directly selects the top candidate (rank 1).
 * If stochastic:
 *   Draws random float `sampledValue` in [0, 1).
 *   Locates which slice contains `sampledValue`.
 * 
 * @param candidates - Renormalized candidates
 * @param randomValue - Pseudo-random number in [0, 1)
 * @param isGreedy - Whether to force greedy argmax selection
 * @returns { chosenToken, ruler, sampledValue }
 */
export function sampleFromCandidates(
  candidates: CandidateToken[],
  randomValue: number,
  isGreedy: boolean
): {
  chosenToken: CandidateToken;
  samplingRuler: RulerSegment[];
  sampledValue: number;
} {
  const keptCandidates = candidates.filter((c) => c.kept && c.finalProb > 0);

  // Fallback if somehow no candidate is kept
  if (keptCandidates.length === 0) {
    const fallback = candidates[0] || {
      token: '',
      logprob: 0,
      rawProb: 1,
      tempProb: 1,
      kept: true,
      cutoffReason: null,
      filteredProb: 1,
      finalProb: 1,
      cumulativeProb: 1,
      rank: 1,
    };
    return {
      chosenToken: fallback,
      samplingRuler: [{
        token: fallback.token,
        prob: 1,
        start: 0,
        end: 1,
        chosen: true,
        rank: 1,
      }],
      sampledValue: 0,
    };
  }

  // Construct ruler segments
  let currentStart = 0;
  const ruler: RulerSegment[] = [];

  for (const c of keptCandidates) {
    const segmentLength = c.finalProb;
    const start = currentStart;
    const end = Math.min(1.0, currentStart + segmentLength);
    ruler.push({
      token: c.token,
      prob: c.finalProb,
      start,
      end,
      chosen: false,
      rank: c.rank,
    });
    currentStart = end;
  }

  // Fix precision on last ruler segment to ensure exactly 1.0
  if (ruler.length > 0) {
    ruler[ruler.length - 1].end = 1.0;
  }

  let chosenIndex = 0;

  if (isGreedy) {
    // Greedy: pick rank 1
    chosenIndex = 0;
  } else {
    // Stochastic: locate which ruler interval contains randomValue
    const clampedVal = Math.max(0, Math.min(0.999999, randomValue));
    for (let i = 0; i < ruler.length; i++) {
      if (clampedVal >= ruler[i].start && clampedVal < ruler[i].end) {
        chosenIndex = i;
        break;
      }
    }
  }

  // Mark chosen segment in ruler
  ruler[chosenIndex].chosen = true;
  const chosenToken = keptCandidates[chosenIndex];

  return {
    chosenToken,
    samplingRuler: ruler,
    sampledValue: isGreedy ? 0 : randomValue,
  };
}

/**
 * Computes Shannon Entropy (in bits) of a probability distribution:
 * H = - sum(p * log2(p)) for p > 0
 * 
 * Intuition:
 * - 0 bits = Complete certainty (greedy / 1 token has 100% prob)
 * - High bits = High uncertainty (many tokens share equal probability)
 * 
 * @param probabilities - Normalized probability array
 * @returns Entropy in bits
 */
export function calculateEntropy(probabilities: number[]): number {
  let entropy = 0;
  for (const p of probabilities) {
    if (p > 0.000001) {
      entropy -= p * Math.log2(p);
    }
  }
  return Math.max(0, Number(entropy.toFixed(4)));
}

/**
 * Computes Running Perplexity across a sequence of chosen tokens:
 * PPL = exp( - 1/N * sum(ln(P_chosen_i)) )
 * 
 * Measures how well the model predicted the sequence of tokens chosen.
 * Lower perplexity = model was less surprised on average.
 * 
 * @param stepProbabilities - Final probabilities of chosen tokens at each step
 * @returns Perplexity value
 */
export function calculatePerplexity(stepProbabilities: number[]): number {
  if (stepProbabilities.length === 0) return 1.0;

  let sumLogProb = 0;
  for (const p of stepProbabilities) {
    const clampedP = Math.max(1e-12, Math.min(1.0, p));
    sumLogProb += Math.log(clampedP);
  }

  const avgNegLogProb = -sumLogProb / stepProbabilities.length;
  const ppl = Math.exp(avgNegLogProb);
  return Number(ppl.toFixed(2));
}

/**
 * End-to-end Pure Sampling Pipeline:
 * Runs the entire sampling sequence for a single step:
 * 1. Convert raw logprobs -> raw probabilities
 * 2. Apply temperature & softmax
 * 3. Apply top-k and top-p filters
 * 4. Renormalize kept tokens
 * 5. Sample token using seeded RNG
 * 6. Calculate entropy, confidence, surprise metric
 * 
 * @param rawCandidates - Top candidates from Ollama
 * @param config - Current generation sampling config
 * @param randomValue - Pseudo-random value in [0, 1)
 * @param inputPrompt - Current prompt text
 * @param stepIndex - 0-based step index
 * @param priorChosenProbabilities - History of chosen token probabilities for running perplexity
 * @param evalDurationMs - Inference duration in ms
 * @param promptEvalCount - Number of prompt tokens evaluated
 * @returns Complete StepResult
 */
export function executeSamplingPipeline(
  rawCandidates: RawCandidate[],
  config: SamplingConfig,
  randomValue: number,
  inputPrompt: string,
  stepIndex: number,
  priorChosenProbabilities: number[] = [],
  evalDurationMs: number = 0,
  promptEvalCount: number = 0
): StepResult {
  // 1. Raw scores
  const rawScores = logprobsToRawProbabilities(rawCandidates);

  // 2. Temperature & softmax
  const tempCandidates = applyTemperatureAndSoftmax(rawScores, config.temperature);

  // 3. Top-k and Top-p
  const filteredCandidates = applyTopKAndTopP(tempCandidates, config.topK, config.topP);

  // 4. Renormalize
  const finalCandidates = renormalizeProbabilities(filteredCandidates);

  // 5. Sample token
  const isGreedy = config.temperature <= 0.001;
  const { chosenToken, samplingRuler, sampledValue } = sampleFromCandidates(
    finalCandidates,
    randomValue,
    isGreedy
  );

  // Metrics
  const keptProbs = finalCandidates.filter((c) => c.kept).map((c) => c.finalProb);
  const entropy = calculateEntropy(keptProbs);
  const confidence = Number((Math.max(...finalCandidates.map((c) => c.tempProb)) * 100).toFixed(1));

  // Running perplexity including this step's chosen token
  const updatedProbs = [...priorChosenProbabilities, chosenToken.finalProb];
  const perplexity = calculatePerplexity(updatedProbs);

  // Is surprising: picked token wasn't #1 choice OR final probability was low (< 25%)
  const isSurprising = chosenToken.rank > 1 || chosenToken.finalProb < 0.25;

  return {
    stepIndex,
    inputPrompt,
    chosenToken,
    allCandidates: finalCandidates,
    samplingRuler,
    sampledValue,
    isGreedy,
    rank: chosenToken.rank,
    isSurprising,
    entropy,
    confidence,
    perplexity,
    evalDurationMs,
    promptEvalCount,
    timestamp: Date.now(),
  };
}
