import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

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
