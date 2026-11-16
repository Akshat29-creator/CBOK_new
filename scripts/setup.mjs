import { execSync, spawn } from 'child_process';

console.log('\n======================================================');
console.log('       🔬 LLM Next-Word Lab: Setup Pipeline');
console.log('======================================================\n');

// 1. Check Node.js
console.log('✓ Step 1/3: Checking Node.js environment...');
const nodeVersion = process.version;
console.log(`  Current Node.js version: ${nodeVersion}`);

// 2. Check Ollama
console.log('\n✓ Step 2/3: Checking Ollama local service...');
let isOllamaRunning = false;
try {
  const res = await fetch('http://localhost:11434/api/tags');
  if (res.ok) {
    isOllamaRunning = true;
    console.log('  Ollama is running at http://localhost:11434 [OK]');
  }
} catch (e) {
  isOllamaRunning = false;
}

if (!isOllamaRunning) {
  console.log('  ⚠️  Ollama does not appear to be running on http://localhost:11434.');
  console.log('  Attempting to check if "ollama" command is installed...');
  try {
    execSync('ollama --version', { stdio: 'ignore' });
    console.log('  Found Ollama command. Starting Ollama in background...');
    spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' });
    // Wait 3 seconds for it to start
    await new Promise((r) => setTimeout(r, 3000));
  } catch (err) {
    console.log('\n❌ Ollama is not installed or not in PATH.');
    console.log('   Please download and install Ollama from: https://ollama.com');
    console.log('   After installing, launch Ollama and re-run this setup script.\n');
  }
}

// 3. Check & Pull default model (qwen2.5:0.5b)
console.log('\n✓ Step 3/3: Checking & Pulling default model "qwen2.5:0.5b"...');
try {
  const tagsRes = await fetch('http://localhost:11434/api/tags');
  let hasModel = false;
  if (tagsRes.ok) {
    const data = await tagsRes.json();
    if (data.models && data.models.some((m) => m.name.includes('qwen2.5:0.5b'))) {
      hasModel = true;
      console.log('  Model "qwen2.5:0.5b" is already installed and verified! [OK]');
    }
  }

  if (!hasModel) {
    console.log('  Downloading "qwen2.5:0.5b" (~397 MB). This takes about 30-60 seconds...');
    execSync('ollama pull qwen2.5:0.5b', { stdio: 'inherit' });
    console.log('  Model "qwen2.5:0.5b" successfully pulled! [OK]');
  }
} catch (err) {
  console.log('  ⚠️ Could not pull model automatically via script.');
  console.log('  You can run this manually in any terminal: ollama pull qwen2.5:0.5b');
}

console.log('\n======================================================');
console.log('  🎉 All dependencies and models are installed!');
console.log('  👉 To start the app, run:');
console.log('        npm run dev');
console.log('  👉 Then open: http://localhost:3000');
console.log('======================================================\n');
