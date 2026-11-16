# LLM Next-Word Lab 🔬

An interactive visualizer and educational laboratory for next-token prediction and client-side sampling using tiny local Ollama models (such as `qwen2.5:0.5b`, `smollm2:135m`, or `llama3.2:1b`).

> 🚀 **Giving this project to a friend?** See the simple 3-step guide: **[HOW_TO_RUN.md](HOW_TO_RUN.md)** or simply double-click `setup.bat` then `start.bat`!

---

## 🌟 Key Features

1. **Client-Controlled Sampling Pipeline**:
   - **LogSoftmax & Logprobs**: Queries Ollama `/api/generate` with `options: { temperature: 0, num_predict: 1 }`, `raw: true`, `logprobs: true`, `top_logprobs: 15`.
   - **Temperature Scaling**: Rescales logits ($s_i = \text{logprob}_i / T$), with $T = 0$ for greedy argmax, $T < 1$ for sharpening, and $T > 1$ for flattening.
   - **Top-K Truncation**: Retains only the top $K$ candidates (1 to 15).
   - **Top-P (Nucleus) Truncation**: Retains the minimal subset of candidates whose cumulative probability mass $\ge p$.
   - **Renormalization**: Renormalizes surviving candidate probabilities so $\sum P_i = 1.0$.
   - **Deterministic Seeded Sampling**: Employs a deterministic Mulberry32 PRNG so results can be reproduced identically given the same seed.
   - **Interactive Probability Ruler**: Visually plots candidate intervals along $[0, 1)$ and marks exactly where the random draw landed.

2. **Prediction Inspector (6 Step-by-Step Cards)**:
   - **Card 1: Input Context**: Highlights the attention tail of the input prompt.
   - **Card 2: Model Output**: Table of the top 15 candidate tokens, logprobs ($\ln P$), and raw probability share.
   - **Card 3: After Temperature**: Recharts comparative bar chart showing pre- vs post-temperature probability distribution.
   - **Card 4: After Top-K & Top-P**: Visual status badges showing kept vs discarded candidates (with cutoff reasons: `Top-K Cut` or `Top-P Cut`) and cumulative probability threshold marker.
   - **Card 5: Probability Ruler**: 1D interval visualization with an animated needle pointing to the random float $r \in [0, 1)$ and highlighting the winning slice.
   - **Card 6: Final Result**: The selected token, its rank, surprise classification, inference latency in milliseconds, and prompt evaluation tokens.
   - **"Explain" buttons**: Educational popovers on every card explaining the underlying math and NLP concepts.

3. **Metrics per Step**:
   - **Shannon Entropy (bits)**: $H = -\sum P_i \log_2(P_i)$, indicating model uncertainty.
   - **Confidence (%)**: Maximum single-token probability.
   - **Running Perplexity (PPL)**: $PPL = \exp(-\frac{1}{N} \sum \ln(P_{\text{chosen}}))$.
   - **Latency (ms)**: Local Ollama execution duration.

4. **"Whole Run" Diagnostics**:
   - **Timeline**: Dual-axis line chart of confidence and entropy across all tokens.
   - **Step History**: Clickable audit table of all steps.
   - **Alternatives**: Compares the chosen token against the 2nd and 3rd most likely runner-up tokens.
   - **"What If?" Counterfactual Branching**: Click any candidate from any past step to branch off and generate an alternative continuation side-by-side with the original!

5. **Extras**:
   - Export full run data as JSON.
   - Built-in prompt presets (`The capital of France is`, `Once upon a time`, `2 + 2 =`, `def fibonacci(n):`).
   - Friendly error handling when Ollama is offline or models need to be pulled.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **Ollama**: Installed and running locally ([Download Ollama](https://ollama.com/download))

### 2. Pull the Recommended Model
In your terminal, pull the ultra-fast 0.5B parameter model:
```bash
ollama pull qwen2.5:0.5b
```
*(Optional alternatives: `ollama pull smollm2:135m` or `ollama pull llama3.2:1b`)*

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Unit Testing

Unit tests for `lib/sampling.ts` verify mathematical correctness, numerical stability, softmax normalization, top-k/top-p cutoffs, and PRNG reproducibility:

```bash
npm test
```

Tested scenarios:
- Softmax probabilities sum to 1.0.
- Temperature = 0 gives 100% to top candidate (greedy).
- Higher temperature flattens distribution.
- Top-K limits tokens strictly to $K$.
- Top-P cuts off when cumulative threshold is reached (keeping at least 1 token).
- Renormalized probabilities sum to 1.0.
- Same seed produces identical random sequences and token choices.
- Shannon entropy and perplexity calculate accurately.

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── models/route.ts       # Proxies Ollama /api/tags & installed models
│   │   └── step/route.ts         # Proxies Ollama /api/generate with logprobs: true
│   ├── globals.css               # Dark theme styles & scrollbar tweaks
│   ├── layout.tsx                # App root layout
│   └── page.tsx                  # Main 2-column layout & generation orchestrator
├── components/
│   ├── Header.tsx                # Navigation bar, model indicator & export JSON
│   ├── PromptControl.tsx         # Textarea, presets, Generate/Step/Pause/Reset
│   ├── SettingsPanel.tsx         # Temperature, Top-K, Top-P, Seed, Max tokens, Speed
│   ├── StatusBanner.tsx          # Friendly error alerts with copyable terminal fixes
│   ├── TokenStream.tsx           # Colored token badges (green/yellow/red) with hover card
│   ├── inspector/
│   │   ├── CardHeader.tsx        # Numbered step header with "Explain" button
│   │   ├── InputContextCard.tsx  # Card 1: Input prompt & attention tail
│   │   ├── ModelOutputCard.tsx   # Card 2: Top 15 candidates table & logprobs
│   │   ├── TemperatureCard.tsx   # Card 3: Recharts bar chart of temperature effect
│   │   ├── TopKTopPCard.tsx      # Card 4: Kept vs Discarded badges & cutoff line
│   │   ├── SamplingRulerCard.tsx # Card 5: Probability ruler & random draw needle
│   │   ├── FinalResultCard.tsx   # Card 6: Chosen token, rank, surprise & latency
│   │   ├── StepMetricsBar.tsx    # Step entropy, confidence, perplexity, latency
│   │   └── PredictionInspector.tsx
│   └── whole-run/
│       ├── TimelineTab.tsx       # Confidence & entropy timeline chart
│       ├── StepHistoryTab.tsx    # Clickable step history table
│       ├── AlternativesTab.tsx   # Runner-up #2 and #3 candidates
│       ├── WhatIfTab.tsx         # Counterfactual branching side-by-side
│       └── WholeRunSection.tsx   # Tab container
├── lib/
│   ├── format.ts                 # Token string and probability styling helpers
│   ├── ollama.ts                 # Ollama API client & error handling
│   ├── sampling.ts               # Pure client-side sampling pipeline
│   └── sampling.test.ts          # Comprehensive Vitest unit test suite
├── types/
│   └── index.ts                  # TypeScript interfaces for tokens, runs, configs
├── package.json
└── tsconfig.json
```

---

## 📖 Educational Concepts Covered

| Term | Mathematical Definition | Role in Next-Word Lab |
| :--- | :--- | :--- |
| **Logits** | Unnormalized outputs $z_i$ of the LM output layer | Translated into natural log-probabilities by Ollama |
| **Logprob** | $\ln(P_i) = z_i - \ln \sum_j e^{z_j}$ | Returned by Ollama for the top 15 candidate tokens |
| **Temperature** | $z_i' = z_i / T$ | Controls sharpening ($T < 1$) or flattening ($T > 1$) |
| **Top-K** | $\text{rank}_i \le K$ | Hard prune of candidates outside the top $K$ choices |
| **Top-P (Nucleus)** | $\sum_{i=1}^{k} P_i \ge p$ | Dynamic prune keeping smallest set exceeding mass $p$ |
| **Probability Ruler** | Cumulative intervals $I_k = [\sum_0^{k-1} P_j, \sum_0^k P_j)$ | Slices the $[0, 1)$ interval for inverse transform sampling |
| **Entropy** | $H = -\sum P_i \log_2(P_i)$ | Measures the uncertainty/flatness of the distribution in bits |
| **Perplexity** | $\exp(-\frac{1}{N} \sum \ln P_k)$ | Geometric mean reciprocal probability of chosen tokens |
