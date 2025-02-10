import type { TokenAuditResponse, MemeGenerationResponse } from '@/types/api';

export interface IAgentRuntime {
  registerCommand: (
    command: string, 
    handler: (context: any, ...args: any[]) => Promise<any>
  ) => void;
}

export interface CommandResult {
  type: 'audit_result' | 'meme_result' | 'error';
  content: {
    meme?: MemeGenerationResponse;
    audit?: TokenAuditResponse;
    error?: string;
  };
} 