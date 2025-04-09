import { FundingRate, ArbitrageOpportunity } from '@/types/exchange';
import axios from 'axios';

export async function getFundingRates(symbol: string): Promise<FundingRate[]> {
  const response = await axios.get(`/api/funding-rate?symbol=${symbol}`);
  return response.data;
}

export function findArbitrageOpportunities(rates: FundingRate[]): ArbitrageOpportunity[] {
  const opportunities = [];
  const exchanges = rates.map(rate => rate.exchange);
  
  for (let i = 0; i < exchanges.length; i++) {
    for (let j = i + 1; j < exchanges.length; j++) {
      const buyExchange = rates[i].rate < rates[j].rate ? exchanges[i] : exchanges[j];
      const sellExchange = rates[i].rate < rates[j].rate ? exchanges[j] : exchanges[i];
      const rateDifference = Math.abs(rates[i].rate - rates[j].rate);
      
      if (rateDifference > 0.0001) { // 0.01% 的最小套利空间
        opportunities.push({
          symbol: rates[i].symbol,
          buyExchange,
          sellExchange,
          rateDifference,
          timestamp: Date.now()
        });
      }
    }
  }
  
  return opportunities.sort((a, b) => b.rateDifference - a.rateDifference);
}

export async function getTopSymbolsByVolume(limit: number = 30): Promise<string[]> {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
    const symbols = response.data
      .filter((item: any) => item.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, limit)
      .map((item: any) => item.symbol);
    return symbols;
  } catch (error) {
    console.error('Error fetching top symbols:', error);
    return [];
  }
} 