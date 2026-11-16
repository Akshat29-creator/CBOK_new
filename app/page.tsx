'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { StatusBanner } from '@/components/StatusBanner';
import { PromptControl } from '@/components/PromptControl';
import { SettingsPanel } from '@/components/SettingsPanel';
import { TokenStream } from '@/components/TokenStream';
import { PredictionInspector } from '@/components/inspector/PredictionInspector';
import { WholeRunSection } from '@/components/whole-run/WholeRunSection';
import {
  StepResult,
  SamplingConfig,
  GenerationRun,
  CandidateToken,
} from '@/types';
import { executeSamplingPipeline, createSeededRandom } from '@/lib/sampling';

const DEFAULT_CONFIG: SamplingConfig = {
  temperature: 0.7,
  topK: 8,
  topP: 0.9,
  seed: 42,
  maxTokens: 15,
  model: 'qwen2.5:0.5b',
  autoPlaySpeed: 400,
};

export default function Home() {
  const [prompt, setPrompt] = useState<string>('The capital of France is');
  const [config, setConfig] = useState<SamplingConfig>(DEFAULT_CONFIG);
  const [steps, setSteps] = useState<StepResult[]>([]);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  // Greedy prediction comparison state
  const [greedySentence, setGreedySentence] = useState<string | null>(null);
  const [isLoadingGreedy, setIsLoadingGreedy] = useState<boolean>(false);

  // Ollama server & models state
  const [ollamaOnline, setOllamaOnline] = useState<boolean>(true);
  const [availableModels, setAvailableModels] = useState<
    Array<{ name: string; installed: boolean; size?: number }>
  >([
    { name: 'qwen2.5:0.5b', installed: true },
    { name: 'smollm2:135m', installed: false },
    { name: 'llama3.2:1b', installed: false },
  ]);

  // "What if?" branching state
  const [branchStepOrigin, setBranchStepOrigin] = useState<{
    stepIndex: number;
    token: string;
  } | null>(null);
  const [branchedPrompt, setBranchedPrompt] = useState<string | null>(null);
  const [branchedTokens, setBranchedTokens] = useState<string[]>([]);
  const [isBranchGenerating, setIsBranchGenerating] = useState<boolean>(false);

  // References for handling generation cancellation & loop
  const isGeneratingRef = useRef<boolean>(false);
  isGeneratingRef.current = isGenerating;

  // Fetch installed models from /api/models on mount
  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          setOllamaOnline(data.online);
          if (Array.isArray(data.models) && data.models.length > 0) {
            setAvailableModels(data.models);
            const hasDefault = data.models.some((m: any) => m.name === config.model);
            if (!hasDefault && data.models.find((m: any) => m.installed)) {
              const firstInstalled = data.models.find((m: any) => m.installed);
              if (firstInstalled) {
                setConfig((prev) => ({ ...prev, model: firstInstalled.name }));
              }
            }
          }
        }
      } catch (err) {
        setOllamaOnline(false);
      }
    }
    loadModels();
  }, []);

  // Compute full text generated so far
  const currentFullText = prompt + steps.map((s) => s.chosenToken.token).join('');

  // Handle single step forward
  const performStep = useCallback(
    async (
      currentSteps: StepResult[],
      currentText: string,
      currentConfig: SamplingConfig
    ): Promise<StepResult | null> => {
      try {
        setError(null);
        const res = await fetch('/api/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: currentText,
            model: currentConfig.model,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw {
            message: data.error || 'Failed to predict next token',
            code: data.code,
          };
        }

        // Generate deterministic random value for this step using seed + step index
        const stepIndex = currentSteps.length;
        const rng = createSeededRandom(currentConfig.seed + stepIndex * 10007);
        const randomVal = rng();

        // History of past chosen probabilities for running perplexity
        const pastProbs = currentSteps.map((s) => s.chosenToken.finalProb);

        // Execute pure sampling pipeline on client
        const newStep = executeSamplingPipeline(
          data.candidates,
          currentConfig,
          randomVal,
          currentText,
          stepIndex,
          pastProbs,
          data.eval_duration_ms,
          data.prompt_eval_count
        );

        return newStep;
      } catch (err: any) {
        setError({
          message: err.message || 'Error occurred while contacting Ollama API',
          code: err.code || 'UNKNOWN',
        });
        setIsGenerating(false);
        return null;
      }
    },
    []
  );

  // Step button handler (predict 1 token)
  const handleSingleStep = async () => {
    if (steps.length >= config.maxTokens) return;
    const newStep = await performStep(steps, currentFullText, config);
    if (newStep) {
      setSteps((prev) => {
        const next = [...prev, newStep];
        setSelectedStepIndex(newStep.stepIndex);
        return next;
      });
    }
  };

  // Generate / Auto-play loop
  const handleGenerate = async () => {
    if (steps.length >= config.maxTokens) return;
    setIsGenerating(true);
    isGeneratingRef.current = true;

    let activeSteps = [...steps];
    let activeText = prompt + activeSteps.map((s) => s.chosenToken.token).join('');

    while (isGeneratingRef.current && activeSteps.length < config.maxTokens) {
      const newStep = await performStep(activeSteps, activeText, config);
      if (!newStep || !isGeneratingRef.current) {
        break;
      }

      activeSteps = [...activeSteps, newStep];
      activeText = activeText + newStep.chosenToken.token;

      setSteps(activeSteps);
      setSelectedStepIndex(newStep.stepIndex);

      if (config.autoPlaySpeed > 0 && activeSteps.length < config.maxTokens) {
        await new Promise((resolve) => setTimeout(resolve, config.autoPlaySpeed));
      }
    }

    setIsGenerating(false);
    isGeneratingRef.current = false;
  };

  const handlePause = () => {
    setIsGenerating(false);
    isGeneratingRef.current = false;
  };

  const handleReset = () => {
    handlePause();
    setSteps([]);
    setSelectedStepIndex(null);
    setError(null);
    setBranchStepOrigin(null);
    setBranchedPrompt(null);
    setBranchedTokens([]);
    setGreedySentence(null);
  };

  // Compute the optimal greedy / most relevant sentence on demand
  const handleRequestGreedy = async () => {
    setIsLoadingGreedy(true);
    try {
      let currentText = prompt;
      for (let i = 0; i < config.maxTokens; i++) {
        const res = await fetch('/api/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: currentText, model: config.model }),
        });
        const data = await res.json();
        if (!data.candidates || data.candidates.length === 0) break;
        // Greedy argmax pick: rank #1 candidate
        const topCandidate = [...data.candidates].sort((a, b) => b.logprob - a.logprob)[0];
        currentText += topCandidate.token;
      }
      setGreedySentence(currentText);
    } catch (err) {
      console.error('Failed to compute greedy sentence:', err);
    } finally {
      setIsLoadingGreedy(false);
    }
  };

  // Switch hyperparameter to Greedy mode (T=0)
  const handleApplyGreedyMode = () => {
    setConfig((prev) => ({ ...prev, temperature: 0 }));
    handleReset();
  };

  // Branching functions
  const handleStartBranch = (stepIndex: number, candidate: CandidateToken) => {
    const prefix = prompt + steps.slice(0, stepIndex).map((s) => s.chosenToken.token).join('');
    setBranchStepOrigin({
      stepIndex,
      token: candidate.token,
    });
    setBranchedPrompt(prefix);
    setBranchedTokens([]);
  };

  const handleStepBranch = async () => {
    if (!branchStepOrigin || !branchedPrompt) return;
    setIsBranchGenerating(true);

    const fullBranchText =
      branchedPrompt + branchStepOrigin.token + branchedTokens.join('');

    try {
      const res = await fetch('/api/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullBranchText,
          model: config.model,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to step branch');

      const stepIdx = branchStepOrigin.stepIndex + 1 + branchedTokens.length;
      const rng = createSeededRandom(config.seed + stepIdx * 10007 + 999);
      const branchStep = executeSamplingPipeline(
        data.candidates,
        config,
        rng(),
        fullBranchText,
        stepIdx,
        []
      );

      setBranchedTokens((prev) => [...prev, branchStep.chosenToken.token]);
    } catch (err: any) {
      setError({
        message: err.message || 'Error stepping branch continuation',
      });
    } finally {
      setIsBranchGenerating(false);
    }
  };

  const handleClearBranch = () => {
    setBranchStepOrigin(null);
    setBranchedPrompt(null);
    setBranchedTokens([]);
  };

  // Export full run as JSON
  const handleExportJSON = () => {
    const runData: GenerationRun = {
      id: `run-${Date.now()}`,
      model: config.model,
      initialPrompt: prompt,
      config,
      steps,
      completed: steps.length >= config.maxTokens,
      totalDurationMs: steps.reduce((sum, s) => sum + s.evalDurationMs, 0),
      createdAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(runData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-next-word-run-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Active step for inspector
  const currentStep =
    selectedStepIndex !== null && steps[selectedStepIndex]
      ? steps[selectedStepIndex]
      : steps.length > 0
      ? steps[steps.length - 1]
      : null;

  const activeStepIdx = currentStep ? currentStep.stepIndex : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-gray-100">
      {/* Top Navigation & Status */}
      <Header
        currentRun={
          steps.length > 0
            ? {
                id: 'active',
                model: config.model,
                initialPrompt: prompt,
                config,
                steps,
                completed: steps.length >= config.maxTokens,
                totalDurationMs: steps.reduce((sum, s) => sum + s.evalDurationMs, 0),
                createdAt: new Date().toISOString(),
              }
            : null
        }
        ollamaOnline={ollamaOnline}
        activeModel={config.model}
        onExport={handleExportJSON}
        onReset={handleReset}
        isGenerating={isGenerating}
      />

      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Status Error Banner */}
        <StatusBanner
          error={error}
          onDismiss={() => setError(null)}
          activeModel={config.model}
        />

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 Cols on LG): Prompt, Settings, Output Stream */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            {/* 1. Prompt Control */}
            <PromptControl
              prompt={prompt}
              onPromptChange={(newPrompt) => {
                setPrompt(newPrompt);
                handleReset();
              }}
              onGenerate={handleGenerate}
              onStep={handleSingleStep}
              onPause={handlePause}
              onReset={handleReset}
              isGenerating={isGenerating}
              stepCount={steps.length}
              maxTokens={config.maxTokens}
              disabled={!ollamaOnline}
            />

            {/* 2. Hyperparameters & Settings */}
            <SettingsPanel
              config={config}
              onChange={(newSettings) => setConfig((prev) => ({ ...prev, ...newSettings }))}
              availableModels={availableModels}
              disabled={isGenerating}
            />

            {/* 3. Output Stream */}
            <TokenStream
              initialPrompt={prompt}
              steps={steps}
              selectedStepIndex={selectedStepIndex}
              onSelectStep={(idx) => setSelectedStepIndex(idx)}
              isGenerating={isGenerating}
              greedySentence={greedySentence}
              onRequestGreedy={handleRequestGreedy}
              isLoadingGreedy={isLoadingGreedy}
              onApplyGreedyMode={handleApplyGreedyMode}
            />
          </div>

          {/* Right Column (7 Cols on LG): Prediction Inspector */}
          <div className="lg:col-span-7">
            <PredictionInspector
              currentStep={currentStep}
              totalSteps={steps.length}
              currentStepIndex={activeStepIdx}
              onNavigateStep={(idx) => setSelectedStepIndex(idx)}
              config={config}
              isGenerating={isGenerating}
            />
          </div>
        </div>

        {/* Bottom Section: Whole Run Diagnostics */}
        <div className="pt-4 border-t border-gray-800">
          <WholeRunSection
            steps={steps}
            selectedStepIndex={selectedStepIndex}
            onSelectStep={(idx) => setSelectedStepIndex(idx)}
            branchedPrompt={branchedPrompt}
            branchedTokens={branchedTokens}
            branchStepOrigin={branchStepOrigin}
            onStartBranch={handleStartBranch}
            onStepBranch={handleStepBranch}
            onClearBranch={handleClearBranch}
            isBranchGenerating={isBranchGenerating}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-850 py-4 px-6 text-center text-xs text-gray-500 font-mono">
        LLM Next-Word Lab • Running against local Ollama at{' '}
        <code className="text-gray-400">http://localhost:11434</code> • Client-controlled token sampling
      </footer>
    </div>
  );
}
