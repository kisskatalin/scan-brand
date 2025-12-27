
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, FashionItem } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Gemini 3 Flash as the requested "Flash" tier with thinking capabilities
const MODEL_NAME = "gemini-3-flash-preview";

const SYSTEM_INSTRUCTION = "Role: Fashion Detective. Task: Identify clothing items using Google Search. Priority: Authentic sources (Getty Images, Vogue, Red Carpet Fashion Awards, WornOnTV, brand archives). Only focus on fashion items. If identification is unsuccessful, return 'Unknown'.";

const PROMPT_TEXT = `Identify the fashion items visible in the image.

RULES FOR BRANDING AND CONFIDENCE:
1. MOVIE/TV COSTUMES: If the image is from a film or series and the outfit is a custom costume, the brand should be "[Film Title] Costume Design".
2. UNKNOWN BRANDS: If you cannot identify the brand with certainty, use "Unknown".
3. CONFIDENCE LEVELS:
   - **PERFECT**: 95-100% Certainty. Requires visual match from retail/editorial sites.
   - **HIGH**: 80-94% Certainty. Strong visual evidence.
   - **LOW**: Use when the brand is "Unknown".

PROCESS:
1. VISUAL INVENTORY: Identify colors, materials, and cut.
2. SEARCH: Generate specific search queries to identify the brand.
3. CONFIRMATION: Find the exact product.
4. IMAGE: For 'Perfect' matches ONLY, and ONLY if the item is a specific clothing or accessory product, provide a clear product image or high-quality editorial image URL. Do NOT provide images for 'High', 'Medium', or 'Low' confidence matches.

RESPONSE: RAW JSON format.
Structure: { items: [{ category, brand, confidence, description, materials, imageUrl, shoppingQuery }], styleSummary }`;

async function generateWithModel(model: string, base64Image: string, mimeType: string) {
    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: mimeType } },
                { text: PROMPT_TEXT },
            ],
        },
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.1, 
            thinkingConfig: { thinkingBudget: 24576 }, // Maximized thinking budget for Flash tier
            maxOutputTokens: 8192,
        },
    });
    return response;
}

function processResponse(response: any): AnalysisResult {
    if (!response || !response.text) {
        throw new Error("No response from the AI model.");
    }

    let textResponse = response.text;

    try {
        const firstBrace = textResponse.indexOf('{');
        const lastBrace = textResponse.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            textResponse = textResponse.substring(firstBrace, lastBrace + 1);
        }
        
        const parsedResult = JSON.parse(textResponse) as AnalysisResult;

        if (parsedResult.styleSummary === "REJECT_NO_FASHION") {
            throw new Error("No clothing or person detected in the image.");
        }

        parsedResult.sourceUrls = [];

        if (!parsedResult.items || !Array.isArray(parsedResult.items)) {
            parsedResult.items = [];
        } else {
            parsedResult.items = parsedResult.items.map((item: any) => {
                let materials: string[] = [];
                if (Array.isArray(item.materials)) {
                    materials = item.materials;
                } else if (typeof item.materials === 'string') {
                    materials = item.materials.split(',').map((s: string) => s.trim());
                }
                
                let brand = item.brand || "Unknown";
                let confidence = item.confidence || "Low";
                
                // Normalize Confidence
                const confUpper = (confidence as string).toUpperCase();
                if (confUpper === 'PERFECT') confidence = 'Perfect';
                else if (confUpper === 'HIGH') confidence = 'High';
                else if (confUpper === 'MEDIUM') confidence = 'Medium';
                else if (confUpper === 'LOW') confidence = 'Low';
                else confidence = 'Low'; // Fallback

                if (brand.toLowerCase() === 'unknown' || brand.toLowerCase() === 'generic' || brand.toLowerCase() === 'ismeretlen') {
                    brand = 'Unknown';
                    confidence = 'Low';
                }

                return {
                    category: item.category || "Item",
                    brand: brand,
                    confidence: confidence,
                    description: item.description || "",
                    materials: materials,
                    imageUrl: item.imageUrl || undefined,
                    shoppingQuery: item.shoppingQuery || ""
                } as FashionItem;
            });
        }

        return parsedResult;

    } catch (error) {
        console.error("JSON Parse Error:", error);
        throw new Error("Error processing the analysis results. Please try again.");
    }
}

export const analyzeFashionImage = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const response = await generateWithModel(MODEL_NAME, base64Image, mimeType);
    return processResponse(response);
  } catch (error: any) {
    if (error.message && (error.message.includes("No clothing") || error.message.includes("detected"))) throw error;
    throw new Error(error.message || "The analysis is currently unavailable.");
  }
};
