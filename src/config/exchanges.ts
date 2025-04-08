// 交易所配置
export const exchanges = {
  binance: {
    name: 'Binance',
    baseUrl: 'https://fapi.binance.com',
    endpoints: {
      fundingRate: '/fapi/v1/premiumIndex',
    },
    symbolFormat: (symbol: string) => symbol,
  },
  okx: {
    name: 'OKX',
    baseUrl: 'https://www.okx.com',
    endpoints: {
      fundingRate: '/api/v5/public/funding-rate',
    },
    symbolFormat: (symbol: string) => {
      // 将 BTCUSDT 转换为 BTC-USDT-SWAP
      const base = symbol.replace('USDT', '');
      return `${base}-USDT-SWAP`;
    },
  },
  bybit: {
    name: 'Bybit',
    baseUrl: 'https://api.bybit.com',
    endpoints: {
      fundingRate: '/v5/market/funding/history',
    },
    symbolFormat: (symbol: string) => `${symbol}&category=linear&limit=1`,
  },
  bitget: {
    name: 'Bitget',
    baseUrl: 'https://api.bitget.com',
    endpoints: {
      fundingRate: '/api/mix/v1/market/current-fundRate',
    },
    symbolFormat: (symbol: string) => {
      // 将 BTCUSDT 转换为 BTCUSDT_UMCBL
      return `${symbol}_UMCBL`;
    },
  },
  backpack: {
    name: 'Backpack',
    baseUrl: 'https://api.backpack.exchange',
    endpoints: {
      fundingRate: '/api/v1/fundingRates',
    },
    symbolFormat: (symbol: string) => {
      // 将 BTCUSDT 转换为 BTC_USDC_PERP
      const base = symbol.replace('USDT', '');
      return `${base}_USDC_PERP`;
    },
  },
}; 