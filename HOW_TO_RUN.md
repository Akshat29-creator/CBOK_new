# How to Run LLM Next-Word Lab 🚀

Follow these 3 simple steps to run the project on your computer.

---

### Step 1: Install 2 Free Tools (if you don't have them yet)

1. **Node.js** (v18 or higher): Download and install from [nodejs.org](https://nodejs.org/)
2. **Ollama**: Download and install from [ollama.com](https://ollama.com/)
   * *Make sure Ollama is open and running in your taskbar / system tray.*

---

### Step 2: One-Click Setup (Installs packages & downloads model)

#### On Windows:
👉 **Double-click `setup.bat`**  
*(Or in your terminal, run `npm run setup`)*

#### On Mac / Linux:
👉 In your terminal, run:
```bash
npm run setup
```

This will automatically:
* Install all required code packages
* Download the tiny local model (`qwen2.5:0.5b`, ~397 MB)

---

### Step 3: Start the App!

#### On Windows:
👉 **Double-click `start.bat`**

#### On Mac / Linux:
👉 In your terminal, run:
```bash
npm run dev
```

Now open your web browser and go to:
### **👉 http://localhost:3000**

---

### 💡 Quick Tips
* **To get the most accurate sentence**: In the settings panel, set **Temperature to 0 (Greedy)**.
* **To avoid trailing space glitches**: Do not end your prompt with an extra space (e.g. use `"2 + 2 ="` instead of `"2 + 2 = "`).
* **Try presets**: Click presets like *"The capital of France is"* or *"2 + 2 ="* to see how LLMs predict next words!
