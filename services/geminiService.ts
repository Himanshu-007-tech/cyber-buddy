
import { GoogleGenAI } from "@google/genai";
import { CYBERBUDDY_SYSTEM_PROMPT } from "../constants";

// The SOC security tasks are complex text reasoning tasks.
const MODEL_NAME = 'gemini-3-pro-preview';

export const generateCyberBuddyResponse = async (
  userMessage: string, 
  languageName: string,
  history: { role: string; parts: any[] }[] = [],
  imageData?: { data: string, mimeType: string }
) => {
  // Always use process.env.API_KEY directly as per SDK guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const userParts: any[] = [{ text: userMessage }];
    if (imageData) {
      userParts.push({
        inlineData: imageData
      });
    }

    // Call generateContent with both model name and prompt.
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...history,
        { role: 'user', parts: userParts }
      ],
      config: {
        systemInstruction: `${CYBERBUDDY_SYSTEM_PROMPT}\n\nIMPORTANT: The user has selected the language: ${languageName}. Always respond in this language. If the user uploaded a screenshot, analyze it carefully for scams.`,
        temperature: 0.4, // Lower temperature for more consistent security analysis
      },
    });

    // Access the .text property directly.
    return response.text || "I'm sorry, I couldn't quite process that. Can you try again?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Oops! I hit a little snag. Could you please try sending your message again?";
  }
};
