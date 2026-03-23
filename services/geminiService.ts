
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { AnalysisResult, FashionItem } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Gemini 3.1 Pro Preview for advanced reasoning and visual identification
const MODEL_NAME = "gemini-3.1-pro-preview";

const SYSTEM_INSTRUCTION = "Role: Fashion Detective. Task: Identify clothing items using Google Search. Priority: Authentic sources (Getty Images, Vogue, Red Carpet Fashion Awards, WornOnTV, brand archives). Only focus on fashion items. If identification is unsuccessful, return 'Unknown'.";

const PROMPT_TEXT = `Identify the fashion items visible in the image.

RULES FOR BRANDING AND CONFIDENCE:
1. MOVIE/TV COSTUMES: If the image is from a film or series and the outfit is a custom costume, the brand should be "[Film Title] Costume Design".
2. UNKNOWN BRANDS: If you cannot identify the brand with certainty, use "Unknown".
3. CONFIDENCE LEVELS:
   - **PERFECT**: 95-100% Certainty. Requires visual match from retail/editorial sites.
   - **HIGH**: 80-94% Certainty. Strong visual evidence.
   - **LOW**: Use when the brand is "Unknown".

DESCRIPTION PRECISION RULE:
- ONLY provide an exact, detailed product description if you are 100% certain of the item's identity and source (Perfect Match).
- If you are NOT certain, provide only a generic visual description (e.g., "A basic black cotton t-shirt" instead of a specific designer name/model).
- DO NOT invent details about materials or origins if the source is not verified.

IMAGE URL QUALITY RULE (STRICT):
- For 'Perfect' matches, provide a direct image URL ONLY if it points to the specific product image.
- CRITICAL: DO NOT provide URLs that point to "unavailable", "placeholder", "not-found", "broken", "404", "no-image", "default", or "image-coming-soon" graphics.
- VERIFICATION: Before providing a URL, ensure it looks like a real product asset (e.g., ending in .jpg, .webp, .png) and is from a reputable retail or editorial domain (e.g., nike.com, farfetch.com, vogue.com).
- If you find any placeholder text in the URL or the source page, leave the imageUrl field empty.

PROCESS:
1. VISUAL INVENTORY: Identify colors, materials, and cut.
2. SEARCH: Generate specific search queries to identify the brand.
3. CONFIRMATION: Find the exact product.
4. IMAGE: For 'Perfect' matches ONLY, and ONLY if the item is a specific clothing or accessory product (e.g., shoes, dress, jacket, bag, jewelry, watch), provide a clear, high-quality image URL. 
   - CRITICAL: The image MUST be a product photo (e.g., on a white background or a clear studio shot). 
   - DO NOT provide images of logos, generic brand banners, or lifestyle shots where the item is not the primary focus.

RESPONSE: RAW JSON format.
Structure: { items: [{ category, brand, confidence, description, materials, imageUrl, shoppingQuery, box_2d: [ymin, xmin, ymax, xmax] }], styleSummary }
COORDINATES: For each item, provide a bounding box [ymin, xmin, ymax, xmax] with values normalized from 0 to 1000. These will be used to place a marker on the item in the image.`;

async function generateWithModel(model: string, base64Image: string, mimeType: string) {
    const config: any = {
        tools: [{ googleSearch: {} }],
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, 
        maxOutputTokens: model.startsWith("gemini-3") ? 16384 : 8192,
    };

    if (model.startsWith("gemini-3")) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: mimeType } },
                { text: PROMPT_TEXT },
            ],
        },
        config: config,
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
                    shoppingQuery: item.shoppingQuery || "",
                    box_2d: Array.isArray(item.box_2d) && item.box_2d.length === 4 ? item.box_2d : undefined
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
    const proPromise = generateWithModel(MODEL_NAME, base64Image, mimeType);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("TIMEOUT")), 60000)
    );

    const response = await Promise.race([proPromise, timeoutPromise]);
    return processResponse(response);
  } catch (error: any) {
    if (error.message === "TIMEOUT") {
      console.log("Pro model timed out after 60s, falling back to Flash 2.5...");
      try {
        const fallbackResponse = await generateWithModel("gemini-2.5-flash", base64Image, mimeType);
        return processResponse(fallbackResponse);
      } catch (fallbackError: any) {
        if (fallbackError.message && (fallbackError.message.includes("No clothing") || fallbackError.message.includes("detected"))) throw fallbackError;
        throw new Error(fallbackError.message || "The analysis is currently unavailable.");
      }
    }

    if (error.message && (error.message.includes("No clothing") || error.message.includes("detected"))) throw error;
    throw new Error(error.message || "The analysis is currently unavailable.");
  }
};
