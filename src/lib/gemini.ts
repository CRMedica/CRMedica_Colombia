import { GoogleGenAI } from "@google/genai";

// Isomorphic environment variable access
const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY as string) || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || '';

export const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export const getGeminiModel = (modelName: string = "gemini-3-flash-preview") => {
  return ai.models.generateContent({
    model: modelName,
    contents: "", // Just a dummy check or pre-config if needed, but SDK prefers direct calls
  });
};
