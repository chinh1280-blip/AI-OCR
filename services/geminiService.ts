import { GoogleGenAI } from "@google/genai";
import { AnyZoneData, ZoneId } from "../types";
import { ZONE_CONFIGS } from "../constants";

export const analyzeImage = async (base64Image: string, zoneId: ZoneId, modelName: string): Promise<AnyZoneData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = ZONE_CONFIGS[zoneId];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Extract data based on the provided layout instructions.",
          },
        ],
      },
      config: {
        systemInstruction: config.instruction,
        responseMimeType: "application/json",
        responseSchema: config.schema,
        temperature: 0.1, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");

    const parsed = JSON.parse(text);
    return parsed;

  } catch (error) {
    console.error(`Gemini Vision Error (${zoneId}) with model ${modelName}:`, error);
    throw error;
  }
};