import { IAgentRuntime, CommandResult } from '@/types/agent';
import { auditToken } from '@/services/auditToken';
import { generateMeme } from '@/services/memeGeneration';
import { analyzeSentiment } from '@/services/sentimentAnalysis';
import type { TokenAuditResponse, MemeGenerationResponse, SentimentAnalysisResponse } from '@/types/api';

export interface DefiDetectorPluginConfig {
  endpoint?: string;
}

interface PluginResponse {
  type: 'audit_result' | 'meme_result' | 'error';
  content: {
    meme?: MemeGenerationResponse;
    audit?: TokenAuditResponse;
    error?: string;
  };
}

export function defiDetectorPlugin(config: DefiDetectorPluginConfig = {}) {
  const endpoint = config.endpoint || 'http://localhost:3000';

  return {
    name: 'defi-detector',
    version: '1.0.0',

    async initialize(runtime: IAgentRuntime) {
      // Audit command
      runtime.registerCommand('audit', async (context: any, tokenSymbol: string): Promise<CommandResult> => {
        try {
          const result = await auditToken(tokenSymbol);
          return {
            type: 'audit_result',
            content: {
              audit: {
                ...result,
                summary: generateAuditSummary(result)
              }
            }
          };
        } catch (error) {
          console.error('Error in audit command:', error);
          return {
            type: 'error',
            content: { error: 'Failed to audit token' }
          };
        }
      });

      // Meme command
      runtime.registerCommand('meme', async (context: any, tokenSymbol: string): Promise<CommandResult> => {
        try {
          const sentiment = await analyzeSentiment(tokenSymbol);
          const meme = await generateMeme({ tokenSymbol, sentiment: sentiment.sentiment });
          return {
            type: 'meme_result',
            content: { meme }
          };
        } catch (error) {
          console.error('Error in meme command:', error);
          return {
            type: 'error',
            content: { error: 'Failed to generate meme' }
          };
        }
      });
    }
  };
}

function generateAuditSummary(result: any) {
  const riskLevel = result.analysis.riskLevel;
  const findings = result.analysis.findings;
  
  return `
🔍 Risk Level: ${riskLevel}
💰 Price: $${result.metrics.price}
📊 Market Cap: $${result.metrics.marketCap}
⚠️ Key Findings:
${findings.map((finding: string) => `- ${finding}`).join('\n')}
  `.trim();
} 