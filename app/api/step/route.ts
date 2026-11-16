import { NextRequest, NextResponse } from 'next/server';
import { queryOllamaNextToken, OllamaError } from '@/lib/ollama';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model } = body;

    if (typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt must be a string' },
        { status: 400 }
      );
    }

    const result = await queryOllamaNextToken(prompt, model);

    return NextResponse.json({
      success: true,
      token: result.token,
      candidates: result.candidates,
      eval_duration_ms: result.eval_duration_ms,
      prompt_eval_count: result.prompt_eval_count,
      load_duration_ms: result.load_duration_ms,
    });
  } catch (error: any) {
    console.error('Error in /api/step:', error);

    if (error instanceof OllamaError) {
      const statusMap: Record<string, number> = {
        OLLAMA_OFFLINE: 503,
        MODEL_NOT_FOUND: 404,
        LOGPROBS_UNSUPPORTED: 400,
        UNKNOWN: 500,
      };
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: statusMap[error.code] || 500 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'Internal Server Error while communicating with Ollama',
        code: 'UNKNOWN',
      },
      { status: 500 }
    );
  }
}
