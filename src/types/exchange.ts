export interface FundingRate {
  exchange: string;
  symbol: string;
  rate: number;
  timestamp: number;
  nextFundingTime?: number;
}

export interface ExchangeConfig {
  name: string;
  baseUrl: string;
  endpoints: {
    fundingRate: string;
  };
  symbolFormat: (symbol: string) => string;
}

export interface ArbitrageOpportunity {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  rateDifference: number;
  timestamp: number;
} 