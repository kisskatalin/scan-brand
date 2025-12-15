export interface FashionItem {
  category: string;
  brand: string;
  confidence: 'Perfect' | 'High' | 'Medium' | 'Low';
  description: string;
  materials: string[];
  color: string;
  shoppingQuery: string; 
  citations?: string[];
  imageUrl?: string;
}

export interface AnalysisResult {
  items: FashionItem[];
  styleSummary: string;
  sourceUrls?: { title: string; uri: string }[];
}

export interface ImageFile {
  base64: string;
  mimeType: string;
  preview: string;
}