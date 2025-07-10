export interface ComparisonResult {
  strengths: string[];
  weaknesses: string[];
  alignmentScore: number; // 0–100
  recommendations: string[];
}

export interface ProcessedFile {
  filename: string;
  content: string;
  type: 'cv' | 'job-description';
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
}

export interface AIResponse {
  result: ComparisonResult;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

// Custom types for Gemini API
export interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiGenerationConfig {
  responseMimeType?: string;
}

export interface GeminiRequest {
  model: string;
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
} 