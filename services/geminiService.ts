
import { GoogleGenAI } from "@google/genai";
import { CYBERBUDDY_SYSTEM_PROMPT } from "../constants";

// 'gemini-flash-latest' is the stable alias for the most recent production-ready Flash model.
const MODEL_NAME = 'gemini-flash-latest';

export const generateCyberBuddyResponse = async (
  userMessage: string, 
  languageName: string,
  history: { role: string; parts: any[] }[] = [],
  imageData?: { data: string, mimeType: string }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const userParts: any[] = [{ text: userMessage }];
    
    if (imageData) {
      userParts.push({
        inlineData: {
          data: imageData.data,
          mimeType: imageData.mimeType || 'image/jpeg' // Fallback for safety
        }
      });
    }

    // SANITIZATION:
    // 1. Gemini API turns MUST alternate (User -> Model -> User).
    // 2. Gemini API history MUST start with a 'user' role.
    let sanitizedHistory: { role: string; parts: any[] }[] = [];
    let lastRole = '';
    
    // Filter history to ensure alternating roles and starting with user
    for (const turn of history) {
      if (sanitizedHistory.length === 0 && turn.role !== 'user') {
        // Skip any model/bot turns at the very beginning of the chat
        continue;
      }
      
      if (turn.role !== lastRole) {
        sanitizedHistory.push(turn);
        lastRole = turn.role;
      }
    }

    // If the history ends with a 'user' turn, remove it because we are adding 
    // our new 'user' message right now (prevents User -> User error).
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
        systemInstruction: `${CYBERBUDDY_SYSTEM_PROMPT}\n\nIMPORTANT: User language: ${languageName}. If an image is provided, analyze it for UI patterns used in phishing or social engineering.`,
        temperature: 0.5,
      },
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Multimodal Error:", error);
    
    // Check for common failure modes
    if (error.message?.includes("User location is not supported")) {
      return "I'm having trouble accessing my global security database from your current location. Please check your connection!";
    }
    
    if (error.message?.includes("safety")) {
      return "My security filters flagged that media as potentially containing sensitive PII. For your safety, I cannot analyze it, but remember: never share your password or banking details!";
    }

    return "Oops! I hit a little snag. Could you please try sending your message again?";
  }
};
