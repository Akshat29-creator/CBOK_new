import { RawCandidate } from '@/types';

export const DEFAULT_OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
export const DEFAULT_MODEL = 'qwen2.5:0.5b';

export interface OllamaStepResult {
  token: string;
  candidates: RawCandidate[];
  eval_duration_ms: number;
  prompt_eval_count: number;
  load_duration_ms: number;
}

export class OllamaError extends Error {
  code: 'OLLAMA_OFFLINE' | 'MODEL_NOT_FOUND' | 'LOGPROBS_UNSUPPORTED' | 'UNKNOWN';
  
  constructor(message: string, code: 'OLLAMA_OFFLINE' | 'MODEL_NOT_FOUND' | 'LOGPROBS_UNSUPPORTED' | 'UNKNOWN') {
    super(message);
    this.name = 'OllamaError';
    this.code = code;
  }
}

/**
 * Calls Ollama /api/generate with temperature 0, num_predict 1, logprobs true, top_logprobs 15.
 * Ollama produces the top 15 candidates for the single next token without sampling it for us.
 */
export async function queryOllamaNextToken(
  prompt: string,
  model: string = DEFAULT_MODEL,
  baseUrl: string = DEFAULT_OLLAMA_URL
): Promise<OllamaStepResult> {
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/generate`;

  const payload = {
    model: model || DEFAULT_MODEL,
    prompt: prompt,
    raw: true,
    stream: false,
    options: {
      temperature: 0,
      num_predict: 1,
    },
    logprobs: true,
    top_logprobs: 15,
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new OllamaError(
      `Could not connect to Ollama at ${baseUrl}. Ensure Ollama is running locally (e.g. run 'ollama serve' or open the Ollama app). Error: ${errorMsg}`,
      'OLLAMA_OFFLINE'
    );
  }

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 404 || errorBody.toLowerCase().includes('not found')) {
      throw new OllamaError(
        `Model "${model}" not found in Ollama. Please run "ollama pull ${model}" in your terminal.`,
        'MODEL_NOT_FOUND'
      );
    }
    throw new OllamaError(
      `Ollama API returned HTTP ${response.status}: ${errorBody}`,
      'UNKNOWN'
    );
  }

  const data = await response.json();

  // Validate logprobs capability
  if (!data.logprobs || !Array.isArray(data.logprobs) || data.logprobs.length === 0) {
    throw new OllamaError(
      'Ollama did not return logprobs. Your Ollama version may be outdated or this model architecture does not support logprobs. Please update Ollama to the latest version (>= 0.4.0) with "ollama --version".',
      'LOGPROBS_UNSUPPORTED'
    );
  }

  const primaryLogprobObj = data.logprobs[0];
  const topLogprobs = primaryLogprobObj.top_logprobs || [];

  if (topLogprobs.length === 0) {
    // If top_logprobs is empty, fallback to the single returned token
    topLogprobs.push({
      token: primaryLogprobObj.token || data.response || '',
      logprob: primaryLogprobObj.logprob ?? 0,
      bytes: primaryLogprobObj.bytes,
    });
  }

  // Format candidates
  const candidates: RawCandidate[] = topLogprobs.map((item: any) => ({
    token: item.token ?? '',
    logprob: typeof item.logprob === 'number' ? item.logprob : -10,
    bytes: Array.isArray(item.bytes) ? item.bytes : undefined,
  }));

  // Durations from Ollama are in nanoseconds
  const evalDurationMs = data.eval_duration ? Math.round(data.eval_duration / 1_000_000) : 0;
  const loadDurationMs = data.load_duration ? Math.round(data.load_duration / 1_000_000) : 0;

  return {
    token: data.response || primaryLogprobObj.token || candidates[0]?.token || '',
    candidates,
    eval_duration_ms: evalDurationMs,
    prompt_eval_count: data.prompt_eval_count || 0,
    load_duration_ms: loadDurationMs,
  };
}

/**
 * Fetches all downloaded/available models from Ollama /api/tags
 */
export async function getInstalledModels(baseUrl: string = DEFAULT_OLLAMA_URL): Promise<{ name: string; size: number }[]> {
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/tags`;
  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    if (data && Array.isArray(data.models)) {
      return data.models.map((m: any) => ({
        name: m.name,
        size: m.size || 0,
      }));
    }
    return [];
  } catch {
    return [];
  }
}
