import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Gemini Initialization
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/questions/enrich", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "No question provided" });
    }

    const prompt = `
      You are an expert SAT/ACT tutor. For the following question, provide:
      1. A detailed explanation of why the correct answer is right.
      2. A "Strategy Tip" (short, catchy speed-hack).
      3. A "Trick Pattern" (common trap students fall into for this type of question).

      Question: ${question.text}
      Options: ${question.options.join(", ")}
      Correct Option Index: ${question.correctAnswerIndex} (Option: ${question.options[question.correctAnswerIndex]})

      Respond in JSON format.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            strategyTip: { type: Type.STRING },
            trickPattern: { type: Type.STRING },
          },
          required: ["explanation", "strategyTip", "trickPattern"],
        },
      },
    });

    const enrichedContent = JSON.parse(result.text);
    res.json({
      ...question,
      ...enrichedContent
    });
  } catch (error) {
    console.error("Gemini Enrichment Error:", error);
    res.status(500).json({ error: "Failed to enrich question with AI" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
