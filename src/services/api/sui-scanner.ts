import { getFullnodeUrl, SuiClient, CoinMetadata } from '@mysten/sui/client';

interface ContractAnalysis {
  contractAddress: string;
  sourceCode?: string;
  isVerified: boolean;
  riskFactors: {
    isMintable: boolean;
    hasOwnerOnlyFunctions: boolean;
    liquidityLockPeriod?: number;
    suspiciousPatterns: string[];
  };
}

export class SuiScannerService {
  private client: SuiClient;

  constructor(network: 'mainnet' | 'testnet' | 'devnet' = 'mainnet') {
    this.client = new SuiClient({ 
      url: getFullnodeUrl(network)
    });
  }

  async getContractCode(contractAddress: string): Promise<ContractAnalysis | null> {
    try {
      // Fetch object data from SUI
      const objectResponse = await this.client.getObject({
        id: contractAddress,
        options: { 
          showContent: true,
          showDisplay: true 
        }
      });

      if (!objectResponse.data) {
        throw new Error('Contract not found');
      }

      // Initial risk analysis
      const riskFactors = await this.analyzeContractRisks(objectResponse.data);

      return {
        contractAddress,
        sourceCode: objectResponse.data.content?.dataType,
        isVerified: true, // You'll need to implement verification check
        riskFactors
      };

    } catch (error) {
      console.error('Error fetching contract from SUI:', error);
      return null;
    }
  }

  private async analyzeContractRisks(contractData: any) {
    // This is where we'll implement AI-powered analysis
    return {
      isMintable: false,
      hasOwnerOnlyFunctions: false,
      suspiciousPatterns: []
    };
  }

  async getTokenMetadata(address: string) {
    const [metadata, supply] = await Promise.all([
      this.client.getCoinMetadata({ coinType: address }),
      this.client.getTotalSupply({ coinType: address })
    ]);
    
    return {
      totalSupply: supply?.value,
      decimals: metadata?.decimals,
      symbol: metadata?.symbol
    };
  }
}

export const suiScannerService = new SuiScannerService(); 