import { FundingRate } from '@/types/exchange';
import axios from 'axios';

export async function getFundingRates(symbol: string): Promise<FundingRate[]> {
  const response = await axios.get(`/api/funding-rate?symbol=${symbol}`);
  return response.data;
}

export function findArbitrageOpportunities(rates: FundingRate[]): any[] {
  const opportunities = [];
  const exchanges = rates.map(rate => rate.exchange);
  
  for (let i = 0; i < exchanges.length; i++) {
    for (let j = i + 1; j < exchanges.length; j++) {
      const buyExchange = rates[i].rate < rates[j].rate ? exchanges[i] : exchanges[j];
      const sellExchange = rates[i].rate < rates[j].rate ? exchanges[j] : exchanges[i];
      const rateDifference = Math.abs(rates[i].rate - rates[j].rate);
      
      if (rateDifference > 0.0001) { // 0.01% 的最小套利空间
        opportunities.push({
          buyExchange,
          sellExchange,
          rateDifference
        });
      }
    }
  }
  
  return opportunities.sort((a, b) => b.rateDifference - a.rateDifference);
} 