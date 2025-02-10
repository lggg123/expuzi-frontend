import axios from 'axios';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

interface TokenPriceData {
  current_price: number;
  total_volume: number;
  market_cap: number;
  price_change_percentage_24h: number;
}

export class CoinGeckoService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = COINGECKO_BASE_URL;
  }

  async getTokenData(tokenId: string): Promise<TokenPriceData | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/simple/price`, {
        params: {
          ids: tokenId,
          vs_currencies: 'usd',
          include_market_cap: true,
          include_24hr_vol: true,
          include_24hr_change: true,
        },
      });

      if (!response.data || !response.data[tokenId]) {
        return null;
      }

      const data = response.data[tokenId];
      return {
        current_price: data.usd,
        total_volume: data.usd_24h_vol,
        market_cap: data.usd_market_cap,
        price_change_percentage_24h: data.usd_24h_change,
      };
    } catch (error) {
      console.error('Error fetching token data from CoinGecko:', error);
      return null;
    }
  }

  async searchToken(query: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          query,
        },
      });

      return response.data.coins;
    } catch (error) {
      console.error('Error searching token on CoinGecko:', error);
      return [];
    }
  }

  async getTokenPrice(symbol: string): Promise<number | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`
      );
      return response.data[symbol.toLowerCase()]?.usd || null;
    } catch (error) {
      console.error('Failed to fetch token price:', error);
      return null;
    }
  }
}

export const coinGeckoService = new CoinGeckoService(); 