export interface RawCandidate {
  token: string;
  logprob: number;
  bytes?: number[];
}

export interface CandidateToken {
  token: string;
  logprob: number; // natural log probability ln(P)
  rawProb: number; // e^logprob (original probability from model)
  tempProb: number; // probability after applying temperature
  kept: boolean; // whether the token survives top-k and top-p
  cutoffReason: 'top-k' | 'top-p' | null;
  filteredProb: number; // probability after top-k/top-p filtering (before re-normalization)
  finalProb: number; // normalized probability among kept candidates (sums to 1.0)
  cumulativeProb: number; // running cumulative probability of kept candidates
  rank: number; // 1-based original rank
  bytes?: number[];
}

export interface RulerSegment {
  token: string;
  prob: number;
  start: number;
  end: number;
  chosen: boolean;
  rank: number;
}

export interface StepResult {
  stepIndex: number;
  inputPrompt: string; // text up to this step
  chosenToken: CandidateToken;
  allCandidates: CandidateToken[];
  samplingRuler: RulerSegment[];
  sampledValue: number; // random float [0, 1) or 0 for greedy
  isGreedy: boolean;
  rank: number; // rank of chosen token among candidates
  isSurprising: boolean; // e.g. rank > 1 or finalProb < 0.25
  entropy: number; // Shannon entropy in bits
  confidence: number; // max probability
  perplexity: number; // running perplexity
  evalDurationMs: number;
  promptEvalCount: number;
  timestamp: number;
}

export interface SamplingConfig {
  temperature: number; // 0 to 2 (0 = greedy)
  topK: number; // 1 to 15
  topP: number; // 0.1 to 1.0
  seed: number; // integer seed
  maxTokens: number; // 1 to 100
  model: string;
  autoPlaySpeed: number; // delay in ms between steps (e.g. 500ms)
}

export interface BranchPoint {
  fromStepIndex: number;
  alternativeToken: CandidateToken;
  promptAtBranch: string;
}

export interface GenerationRun {
  id: string;
  model: string;
  initialPrompt: string;
  config: SamplingConfig;
  steps: StepResult[];
  completed: boolean;
  totalDurationMs: number;
  createdAt: string;
}

export interface OllamaModelInfo {
  name: string;
  size: number;
  parameter_size?: string;
  family?: string;
}
