import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, FashionItem } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// SWITCH TO FLASH FOR SPEED but use THINKING for ACCURACY
const MODEL_FLASH = "gemini-2.5-flash";

// Compact System Instructions
const SYSTEM_INSTRUCTION = "Role: Fashion Detective. Task: Identify items using Google Search verification. Priority: Check reliable editorial sources (Getty Images, Vogue, Red Carpet Fashion Awards, WornOnTV) FIRST. Scope: FASHION ONLY. If identification fails, return 'Unknown'.";

const PROMPT_TEXT = `Identify the fashion items in this image.

CHAIN OF THOUGHT PROCESS:
1. VISUAL INVENTORY: List visible items, colors, materials, and distinct features (logos, cuts).
2. SEARCH STRATEGY: Generate a specific search query. If a celebrity is present, verify against specific event photos on Getty Images or Vogue.
3. VERIFICATION: Compare the visual match against authoritative editorial sources or retail matches. USE YOUR THINKING BUDGET TO VERIFY DETAILS DEEPLY.
4. CONFIDENCE SCORING:
   - **PERFECT**: 95-100% Certainty. Mark as PERFECT if:
     A) You find a "DNA SAMPLE" (Text confirmation from Getty/Vogue/Brand Site).
     OR
     B) You find a "RETAIL MATCH" (Item found in a webshop like Farfetch/Net-a-Porter that looks visually IDENTICAL to the image).
     Do not be afraid to give Perfect if the visual match is exact.
   - **HIGH**: 80-94% Certainty. Strong visual match but minor details might differ.
   - **MEDIUM**: 70-89% Certainty. Strong resemblance but could be a similar model or dupe.
5. MOVIE/COSTUME DETECTION: If the image is from a movie or TV show and the outfit is a specific costume design (not a retail brand), set the 'brand' field to "Costume Design" or "[Movie Name] Costume Design".
6. OUTPUT: Convert findings into strict JSON.

REQUIREMENTS:
- Materials MUST be an array of strings (e.g. ["Cotton", "Polyester"]).
- **MANDATORY IMAGE for Perfect Matches**: If you identify a 'Perfect' match, you MUST perform a persistent targeted search to find a clean product image URL (white background preferred) or a high-quality editorial photo.
- **DEEP HUNT STRATEGY**: 
  1. Try specific query: "[Brand] [Item Name] product image".
  2. If failed, try "editorial": "[Brand] [Item Name] editorial photo".
  3. Do NOT stop at the first failure. Use your extended thinking budget to find a valid image URL.
  4. **STRICT IMAGE INTEGRITY**: Only return an imageUrl if it clearly depicts the fashion item (dress, shoe, bag). If the only images found are cluttered, low-res, or primarily show faces/crowds without focusing on the item, RETURN UNDEFINED. Do NOT return a bad image.

RETURN RAW JSON ONLY. NO MARKDOWN. NO CODE BLOCKS.
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
            temperature: 0.4, 
            thinkingConfig: { thinkingBudget: 24576 }, // MAX FLASH THINKING: 24k tokens for deepest analysis
            maxOutputTokens: 16384, // Prevent truncation for long responses
            // responseSchema removed to allow googleSearch tool to work
        },
    });
    return response;
}

function processResponse(response: any): AnalysisResult {
    if (!response || !response.text) {
        throw new Error("No response from AI model.");
    }

    let textResponse = response.text;

    try {
        // Robust JSON Extraction: Find the first '{' and last '}' to ignore markdown or preamble
        const firstBrace = textResponse.indexOf('{');
        const lastBrace = textResponse.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            textResponse = textResponse.substring(firstBrace, lastBrace + 1);
        } else {
            // Fallback cleanup if braces aren't found cleanly (rare)
            textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        }
        
        const parsedResult = JSON.parse(textResponse) as AnalysisResult;

        // Handle Content Validation Rejection
        if (parsedResult.styleSummary === "REJECT_NO_FASHION") {
            throw new Error("No person wearing visible fashion was detected in this image.");
        }

        // Explicitly clear sourceUrls
        parsedResult.sourceUrls = [];

        // Validation & Sanitization Loop
        if (!parsedResult.items || !Array.isArray(parsedResult.items)) {
            parsedResult.items = [];
        } else {
            parsedResult.items = parsedResult.items.map((item: any) => {
                // Ensure Materials is an Array (Robust Check)
                let materials: string[] = [];
                if (Array.isArray(item.materials)) {
                    materials = item.materials;
                } else if (typeof item.materials === 'string') {
                    // Fix AI returning "Cotton, Wool" as string
                    materials = item.materials.split(',').map((s: string) => s.trim());
                }
                
                // Normalize Confidence to Title Case (e.g. "PERFECT" -> "Perfect")
                // This ensures the UI styling triggers correctly.
                let confidence = item.confidence || "Low";
                if (confidence && typeof confidence === 'string') {
                    confidence = confidence.charAt(0).toUpperCase() + confidence.slice(1).toLowerCase();
                }

                // Ensure other fields exist
                return {
                    category: item.category || "Item",
                    brand: item.brand || "Unknown",
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
        console.error("Raw Response:", textResponse);
        throw new Error("Failed to process analysis results. Please try again.");
    }
}

export const analyzeFashionImage = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const response = await generateWithModel(MODEL_FLASH, base64Image, mimeType);
    return processResponse(response);
  } catch (error: any) {
    console.error("Gemini Flash Analysis failed:", error);
    
    if (error.message && error.message.includes("No person wearing")) throw error;
    
    // Generic fallback error
    throw new Error(error.message || "Unable to analyze image at this time. Please try again.");
  }
};