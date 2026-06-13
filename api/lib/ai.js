import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3-flash",
  "gemini-2.5-flash-lite",
];

export async function generateWithFallback(prompt) {
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      if (response.text) return response.text;
    } catch (err) {
      console.error("Model failed:", model, err.message);
    }
  }

  return null;
}
