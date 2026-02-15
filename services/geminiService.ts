
import { GoogleGenAI } from "@google/genai";
import { CYBERBUDDY_SYSTEM_PROMPT } from "../constants";

// 'gemini-3-flash-preview' is the state-of-the-art model for fast, efficient multimodal tasks.
const MODEL_NAME = 'gemini-3-flash-preview';

export const generateCyberBuddyResponse = async (
  userMessage: string, 
  languageName: string,
  history: { role: string; parts: any[] }[] = [],
  imageData?: { data: string, mimeType: string }
) => {
  // Initialize AI client per request for cleanest state
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const userParts: any[] = [];
    
    // 1. Image first for better vision attention in multimodal models
    if (imageData) {
      userParts.push({
        inlineData: {
          data: imageData.data,
          mimeType: imageData.mimeType || 'image/jpeg'
        }
      });
    }

    // 2. Text part follows
    userParts.push({ text: userMessage });

    // SANITIZATION:
    // Gemini 3 requires strictly alternating roles starting with USER.
    const sanitizedHistory: { role: string; parts: any[] }[] = [];
    let lastRole = '';
    
    for (const turn of history) {
      // Skip until we find the first USER turn
      if (sanitizedHistory.length === 0 && turn.role !== 'user') continue;
      
      // Skip consecutive duplicates to maintain alternation
      if (turn.role !== lastRole) {
        sanitizedHistory.push(turn);
        lastRole = turn.role;
      }
    }

    // Ensure we don't end on a user turn before adding the current message
    if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
      sanitizedHistory.pop();
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...sanitizedHistory,
        { role: 'user', parts: userParts }
      ],
      config: {
        systemInstruction: `${CYBERBUDDY_SYSTEM_PROMPT}\n\nIMPORTANT: Use ${languageName}. If an image is provided, provide an EXPLAINABLE security verdict immediately.`,
        temperature: 0.4, // Lower temperature for more factual security analysis
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking to minimize latency for Flash
      },
    });

    return response.text || "I processed the image, but I couldn't generate a text response. Please try describing what you see.";
  } catch (error: any) {
    console.error("Gemini 3 Flash Multimodal Error:", error);
    
    if (error.message?.includes("safety")) {
      return "⚠️ **Security Alert**: I cannot analyze this specific image because it triggered my safety filters. This often happens with highly sensitive personal documents (like credit cards or IDs). For your safety, never upload those to any AI!";
    }
    
    return "Oops! I hit a little snag. Could you please try sending your message again?";
  }
};
