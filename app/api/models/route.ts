import { NextResponse } from 'next/server';
import { getInstalledModels } from '@/lib/ollama';

export const dynamic = 'force-dynamic';

const RECOMMENDED_MODELS = [
  'qwen2.5:0.5b',
  'smollm2:135m',
  'llama3.2:1b',
];

export async function GET() {
  try {
    const installed = await getInstalledModels();
    
    // Check if Ollama responded
    const isOnline = installed.length > 0;
    
    const installedNames = new Set(installed.map((m) => m.name));

    // Combine recommended and installed models with installation status
    const modelOptions: Array<{ name: string; installed: boolean; size?: number }> = [];

    // First add installed models
    for (const model of installed) {
      modelOptions.push({
        name: model.name,
        installed: true,
        size: model.size,
      });
    }

    // Then add any recommended models that aren't yet installed
    for (const rec of RECOMMENDED_MODELS) {
      if (!installedNames.has(rec) && !modelOptions.some((m) => m.name.startsWith(rec.split(':')[0]))) {
        modelOptions.push({
          name: rec,
          installed: false,
        });
      }
    }

    return NextResponse.json({
      online: isOnline,
      models: modelOptions,
      installedCount: installed.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      online: false,
      models: RECOMMENDED_MODELS.map((name) => ({ name, installed: false })),
      error: error?.message || 'Could not reach Ollama',
    });
  }
}
