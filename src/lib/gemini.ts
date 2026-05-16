import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Using gemini-3.1-pro-preview for complex reasoning (Question Synthesis & Strategy)
export const MODEL_NAME = "gemini-3.1-pro-preview";

export interface StrategyResult {
  strategyTip: string;
  trickPattern: string;
}

export async function generateSpeedHack(questionText: string, correctAnswer: string): Promise<StrategyResult> {
  const prompt = `
    Context: SAT/ACT Test Prep application "Velocity Prep".
    Goal: Provide a 5-second "Speed Hack" instead of a tutorial.
    Question: "${questionText}"
    Correct Answer: "${correctAnswer}"
    
    Tasks:
    1. Provide a "Strategy Tip": A concise, actionable hack (e.g., "Plug in choices", "Look for vertical angles").
    2. Identify "Trick Pattern": Describe why the specific trap answer is effective for this question structure.
    
    Return in JSON format:
    {
      "strategyTip": "...",
      "trickPattern": "..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini failed to generate speed hack:", error);
    return {
      strategyTip: "Focus on the core relationship.",
      trickPattern: "Common distractor."
    };
  }
}
