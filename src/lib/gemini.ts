import { GoogleGenAI } from "@google/genai";

// Isomorphic environment variable access
const getEnv = (name: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    // @ts-ignore
    return import.meta.env[name];
  }
  return '';
};

const apiKey = getEnv('GEMINI_API_KEY');

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
