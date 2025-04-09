'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFundingRates, findArbitrageOpportunities } from '@/services/exchange';
import { FundingRate, ArbitrageOpportunity } from '@/types/exchange';

export default function Home() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [rates, setRates] = useState<FundingRate[]>([]);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['fundingRates', symbol],
    queryFn: () => getFundingRates(symbol),
    refetchInterval: 30000, // 每30秒更新一次
  });

  useEffect(() => {
    if (data) {
      setRates(data);
      setOpportunities(findArbitrageOpportunities(data));
    }
  }, [data]);

  // 计算最大费率差
  const getMaxRateDifference = (rates: FundingRate[]) => {
    if (rates.length < 2) return 0;
    const ratesValues = rates.map(rate => rate.rate);
    return Math.max(...ratesValues) - Math.min(...ratesValues);
  };

  // 按交易对分组费率数据
  const groupedRates = rates.reduce((acc, rate) => {
    if (!acc[rate.symbol]) {
      acc[rate.symbol] = [];
    }
    acc[rate.symbol].push(rate);
    return acc;
  }, {} as Record<string, FundingRate[]>);

  // 获取特定交易所的费率
  const getRateByExchange = (symbol: string, exchange: string) => {
    const symbolRates = groupedRates[symbol] || [];
    const rate = symbolRates.find(r => r.exchange === exchange);
    return rate ? rate.rate : null;
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">加密货币资金费率监控</h1>
      
      <div className="mb-8">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="p-2 border rounded"
          placeholder="输入交易对 (例如: BTCUSDT)"
        />
      </div>

      {isLoading && <div>加载中...</div>}
      {error && <div className="text-red-500">错误: {error.message}</div>}

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">资金费率对比</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-4 border">交易对</th>
                  <th className="p-4 border">Binance</th>
                  <th className="p-4 border">OKX</th>
                  <th className="p-4 border">Bybit</th>
                  <th className="p-4 border">Bitget</th>
                  <th className="p-4 border">Backpack</th>
                  <th className="p-4 border">Hyperliquid</th>
                  <th className="p-4 border">Paradex</th>
                  <th className="p-4 border">最大费率差</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedRates).map((symbol) => {
                  const symbolRates = groupedRates[symbol];
                  const maxDiff = getMaxRateDifference(symbolRates);
                  
                  return (
                    <tr key={symbol} className="hover:bg-gray-50">
                      <td className="p-4 border font-medium">{symbol}</td>
                      <td className={`p-4 border ${getRateByExchange(symbol, 'Binance') !== null ? (getRateByExchange(symbol, 'Binance')! > 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                        {getRateByExchange(symbol, 'Binance') !== null ? `${(getRateByExchange(symbol, 'Binance')! * 100).toFixed(4)}%` : '-'}
                      </td>
                      <td className={`p-4 border ${getRateByExchange(symbol, 'OKX') !== null ? (getRateByExchange(symbol, 'OKX')! > 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                        {getRateByExchange(symbol, 'OKX') !== null ? `${(getRateByExchange(symbol, 'OKX')! * 100).toFixed(4)}%` : '-'}
                      </td>
                      <td className={`p-4 border ${getRateByExchange(symbol, 'Bybit') !== null ? (getRateByExchange(symbol, 'Bybit')! > 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                        {getRateByExchange(symbol, 'Bybit') !== null ? `${(getRateByExchange(symbol, 'Bybit')! * 100).toFixed(4)}%` : '-'}
                      </td>
                      <td className={`p-4 border ${getRateByExchange(symbol, 'Bitget') !== null ? (getRateByExchange(symbol, 'Bitget')! > 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                        {getRateByExchange(symbol, 'Bitget') !== null ? `${(getRateByExchange(symbol, 'Bitget')! * 100).toFixed(4)}%` : '-'}
                      </td>
                      <td className={`p-4 border ${getRateByExchange(symbol, 'Backpack') !== null ? (getRateByExchange(symbol, 'Backpack')! > 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                        {getRateByExchange(symbol, 'Backpack') !== null ? `${(getRateByExchange(symbol, 'Backpack')! * 100).toFixed(4)}%` : '-'}
                      </td>
                      <td className={`p-4 border ${getRateByExchange(symbol, 'Hyperliquid') !== null ? (getRateByExchange(symbol, 'Hyperliquid')! > 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                        {getRateByExchange(symbol, 'Hyperliquid') !== null ? `${(getRateByExchange(symbol, 'Hyperliquid')! * 100).toFixed(4)}%` : '-'}
                      </td>
                      <td className={`p-4 border ${getRateByExchange(symbol, 'Paradex') !== null ? (getRateByExchange(symbol, 'Paradex')! > 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                        {getRateByExchange(symbol, 'Paradex') !== null ? `${(getRateByExchange(symbol, 'Paradex')! * 100).toFixed(4)}%` : '-'}
                      </td>
                      <td className="p-4 border text-green-600">
                        {(maxDiff * 100).toFixed(4)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">套利机会</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-4 border">买入交易所</th>
                  <th className="p-4 border">卖出交易所</th>
                  <th className="p-4 border">费率差</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-4 border">{opp.buyExchange}</td>
                    <td className="p-4 border">{opp.sellExchange}</td>
                    <td className="p-4 border text-green-600">
                      {(opp.rateDifference * 100).toFixed(4)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
