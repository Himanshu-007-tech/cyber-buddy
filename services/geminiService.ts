
import { GoogleGenAI } from "@google/genai";
import { CYBERBUDDY_SYSTEM_PROMPT } from "../constants";

// gemini-3-flash-preview is optimized for fast, reliable multimodal (text + vision) tasks.
const MODEL_NAME = 'gemini-3-flash-preview';

export const generateCyberBuddyResponse = async (
  userMessage: string, 
  languageName: string,
  history: { role: string; parts: any[] }[] = [],
  imageData?: { data: string, mimeType: string }
) => {
  // Always use process.env.API_KEY directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const userParts: any[] = [{ text: userMessage }];
    if (imageData) {
      userParts.push({
        inlineData: imageData
      });
    }

    // SANITIZATION: The Gemini API requires an alternating pattern of 'user' and 'model' turns.
    // Consecutively repeated roles or a 'model' turn at the very end of history will cause an error.
    const sanitizedHistory: { role: string; parts: any[] }[] = [];
    let lastRole = '';
    
    for (const turn of history) {
      // Skip consecutive turns with the same role to maintain the alternating requirement.
      if (turn.role !== lastRole) {
        sanitizedHistory.push(turn);
        lastRole = turn.role;
      }
    }

    // If the last role in history is 'user', adding our current 'user' message 
    // would create two 'user' roles in a row. We must remove that last turn.
    if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
      sanitizedHistory.pop();
    }

    // Call generateContent with model name and contents.
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...sanitizedHistory,
        { role: 'user', parts: userParts }
      ],
      config: {
        systemInstruction: `${CYBERBUDDY_SYSTEM_PROMPT}\n\nIMPORTANT: The user has selected the language: ${languageName}. Always respond in this language. If the user uploaded a screenshot, analyze it carefully for scams. Be encouraging but firm on safety.`,
        temperature: 0.4,
        // Optional: set a thinking budget for deeper analysis if supported by the model.
        thinkingConfig: { thinkingBudget: 0 } 
      },
    });

    // Access the .text property directly.
    return response.text || "I'm sorry, I couldn't quite process that. Can you try again?";
  } catch (error: any) {
    console.error("Gemini API Error Details:", error);
    // Common error: image is too large or API key permissions.
    if (error.message?.includes("User location is not supported")) {
      return "It seems my security sensors are restricted in your current region. Try using a different connection!";
    }
    return "Oops! I hit a little snag. Could you please try sending your message again?";
  }
};
