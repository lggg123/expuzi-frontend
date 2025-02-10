export interface TokenAuditRequest {
  tokenSymbol: string;
}

export interface TokenAuditResponse {
  analysis: {
    riskLevel: string;
    findings: string[];
  };
  metrics: {
    price: number;
    volume: number;
    marketCap: number;
  };
  risks: {
    isMintable: boolean;
    hasOwnerOnlyFunctions: boolean;
    suspiciousPatterns: string[];
  };
  summary?: string;
}

export interface MemeGenerationRequest {
  tokenSymbol: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  theme?: string;
}

export interface MemeGenerationResponse {
  url: string;
  text: string;
  sentiment: string;
}

export interface SentimentAnalysisRequest {
  tokenSymbol: string;
}

export interface SentimentAnalysisResponse {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  sources: {
    twitter: number;
    reddit: number;
    telegram: number;
  };
  metrics?: {
    price?: number;
    volume?: number;
    marketCap?: number;
  };
} 